const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cookieParser());

const DISCORD_ID = "877946035408891945";
const DB_FILE = "./views.json";

let views = 0;
if (fs.existsSync(DB_FILE)) {
    try { views = JSON.parse(fs.readFileSync(DB_FILE)).views || 0; } catch(e) { views = 0; }
}

let cachedData = null;

async function updateCache() {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (r.data && r.data.data) {
            cachedData = r.data.data;
            io.emit("presence", cachedData);
        }
    } catch (e) { console.error("Lanyard Error"); }
}
setInterval(updateCache, 2000);

io.on("connection", (socket) => { if (cachedData) socket.emit("presence", cachedData); });

app.get("/", (req, res) => {
    if (!req.cookies.viewed) {
        views++;
        fs.writeFileSync(DB_FILE, JSON.stringify({ views }));
        res.cookie("viewed", "yes", { maxAge: 31536000000 });
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

        :root {
            --profile-color: #5865F2; /* Dinamik olarak değişecek */
        }

        body {
            margin: 0; padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #050505; color: white;
            display: flex; justify-content: center; align-items: center;
            height: 100vh; overflow: hidden;
        }

        /* HAREKETLİ ARKA PLAN */
        .bg-wrap {
            position: fixed; inset: 0; z-index: -1;
            background: radial-gradient(circle at center, #0a0a0a 0%, #000 100%);
            overflow: hidden;
        }

        .bubble {
            position: absolute; border-radius: 50%;
            background: var(--profile-color); opacity: 0.1;
            filter: blur(40px); animation: float 20s infinite linear;
        }

        @keyframes float {
            0% { transform: translateY(100vh) scale(1); opacity: 0; }
            50% { opacity: 0.15; }
            100% { transform: translateY(-20vh) scale(1.5); opacity: 0; }
        }

        /* ANA KART - DISCORD PROFIL TEMASIYLA AYNI */
        .main-card {
            width: 400px; 
            background: linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(5,5,5,0.95) 100%);
            backdrop-filter: blur(30px); border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 50px -10px var(--profile-color);
            position: relative; overflow: hidden;
            transition: box-shadow 1s ease;
        }

        /* BANNER - GÖNDERDİĞİN RESİM */
        .banner-box { width: 100%; height: 140px; position: relative; overflow: hidden; }
        .banner-img { 
            width: 100%; height: 100%; object-fit: cover; 
            filter: brightness(0.7);
        }

        .profile-content { padding: 0 25px 30px; text-align: center; }

        .avatar-wrap {
            position: relative; width: 110px; height: 110px;
            margin: -60px auto 15px; z-index: 10;
        }
        .avatar { 
            width: 100%; height: 100%; border-radius: 50%; 
            border: 6px solid #0a0a0a; object-fit: cover; 
        }
        .decor-img { position: absolute; inset: -18%; width: 136%; height: 136%; z-index: 11; }

        .status {
            position: absolute; bottom: 8px; right: 8px; width: 22px; height: 22px;
            border-radius: 50%; border: 4px solid #0a0a0a; z-index: 12;
        }
        .online { background: #23a55a; box-shadow: 0 0 10px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 10px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 10px #f23f43; }
        .offline { background: #80848e; }

        .display-name {
            font-size: 30px; font-weight: 800; margin: 0;
            background: linear-gradient(to bottom, #fff, #888);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        
        .username { font-size: 15px; color: rgba(255,255,255,0.4); margin-bottom: 20px; font-weight: 300; }

        /* KARTLAR */
        .act-stack { display: flex; flex-direction: column; gap: 12px; }
        .card {
            background: rgba(255, 255, 255, 0.03); border-radius: 18px;
            padding: 15px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.05); text-align: left;
            transition: 0.3s;
        }
        .card:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }

        .card-img { width: 55px; height: 55px; border-radius: 12px; }
        .card-info { flex: 1; overflow: hidden; }
        .card-title { font-weight: 700; font-size: 14px; color: #fff; }
        .card-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 3px; }

        /* SPOTIFY */
        .s-bar-container { height: 5px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .s-bar-fill { height: 100%; background: var(--profile-color); width: 0%; transition: width 0.5s linear; }
        .time-box { display: flex; justify-content: space-between; font-size: 10px; margin-top: 5px; color: rgba(255,255,255,0.3); font-family: monospace; }

        .socials { display: flex; justify-content: center; gap: 30px; margin-top: 20px; }
        .socials a { color: white; opacity: 0.4; font-size: 22px; transition: 0.3s; }
        .socials a:hover { opacity: 1; color: var(--profile-color); transform: translateY(-3px); }

        .footer { margin-top: 30px; font-size: 11px; color: rgba(255,255,255,0.2); display: flex; justify-content: center; gap: 20px; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bubble-bg"></div>
    <div class="main-card">
        <div class="banner-box">
            <img src="https://i.ibb.co/Xky9n7z/1000055682.jpg" class="banner-img" id="banner">
        </div>
        <div class="profile-content">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status offline"></div>
            </div>
            
            <div id="display-name" class="display-name">Valeinsiva</div>
            <div class="username">@valeinsiva.</div>

            <div class="act-stack">
                <div id="game-zone"></div>
                <div id="spotify-zone"></div>
            </div>

            <div class="socials">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank"><i class="fa-brands fa-discord"></i></a>
                <a href="https://valeinsiva.com.tr" target="_blank"><i class="fa-solid fa-globe"></i></a>
            </div>

            <div class="footer">
                <span><i class="fa-solid fa-eye"></i> ${views.toLocaleString()}</span>
                <span><i class="fa-solid fa-location-dot"></i> Türkiye</span>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let lastG = ""; let lastS = "";

        // Arka plan kürelerini oluştur
        const bg = document.getElementById('bubble-bg');
        for(let i=0; i<15; i++) {
            let b = document.createElement('div');
            b.className = 'bubble';
            let size = Math.random() * 200 + 50;
            b.style.width = size + 'px';
            b.style.height = size + 'px';
            b.style.left = Math.random() * 100 + 'vw';
            b.style.animationDelay = Math.random() * 20 + 's';
            b.style.animationDuration = (Math.random() * 10 + 15) + 's';
            bg.appendChild(b);
        }

        function formatTime(ms) {
            const s = Math.floor((ms / 1000) % 60);
            const m = Math.floor((ms / (1000 * 60)) % 60);
            return (m < 10 ? "0"+m : m) + ":" + (s < 10 ? "0"+s : s);
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            
            // Profil Rengini Ayarla (Theme Color varsa onu kullan)
            const themeColor = data.discord_user.accent_color ? '#' + data.discord_user.accent_color.toString(16) : '#5865F2';
            document.documentElement.style.setProperty('--profile-color', themeColor);

            document.getElementById("display-name").innerText = u.display_name || u.username;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            const d = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                d.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                d.style.display = "block";
            } else { d.style.display = "none"; }

            document.getElementById("status").className = "status " + data.discord_status;

            // Oyun Kartı
            const gZone = document.getElementById("game-zone");
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                if(lastG !== game.name) {
                    gZone.innerHTML = \`<div class="card"><div style="width:55px; height:55px; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px"><i class="fa-solid fa-gamepad"></i></div><div class="card-info"><div class="card-title">\${game.name}</div><div class="card-sub">\${game.details || 'Oynuyor'}</div></div><i class="fa-brands fa-playstation" style="color:#00439c; font-size:24px;"></i></div>\`;
                    lastG = game.name;
                }
            } else { gZone.innerHTML = ""; lastG = ""; }

            // Spotify Kartı
            const sZone = document.getElementById("spotify-zone");
            if(data.spotify) {
                if(lastS !== data.spotify.track_id) {
                    sZone.innerHTML = \`
                        <div class="card">
                            <img src="\${data.spotify.album_art_url}" class="card-img">
                            <div class="card-info">
                                <div class="card-title">\${data.spotify.song}</div>
                                <div class="card-sub">\${data.spotify.artist}</div>
                                <div class="s-bar-container"><div id="s-fill" class="s-bar-fill"></div></div>
                                <div class="time-box"><span id="s-start">00:00</span><span id="s-end">00:00</span></div>
                            </div>
                            <i class="fa-brands fa-spotify" style="color:#1db954; font-size:24px;"></i>
                        </div>\`;
                    lastS = data.spotify.track_id;
                }
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Math.min(Date.now() - data.spotify.timestamps.start, total);
                const prog = (elapsed / total) * 100;
                document.getElementById("s-fill").style.width = prog + "%";
                document.getElementById("s-start").innerText = formatTime(elapsed);
                document.getElementById("s-end").innerText = formatTime(total);
            } else { sZone.innerHTML = ""; lastS = ""; }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
