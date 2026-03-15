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
            --profile-color: #7289da;
        }

        body {
            margin: 0; padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #080808; color: white;
            display: flex; justify-content: center; align-items: center;
            height: 100vh; overflow: hidden;
        }

        /* YÜZEN HAREKETLİ ARKA PLAN */
        .bg-wrap {
            position: fixed; inset: 0; z-index: -1;
            background: radial-gradient(circle at bottom, #111 0%, #000 100%);
            overflow: hidden;
        }

        .bubble {
            position: absolute; border-radius: 50%;
            background: var(--profile-color); opacity: 0.1;
            filter: blur(60px); animation: float 25s infinite linear;
        }

        @keyframes float {
            0% { transform: translateY(110vh) translateX(0) scale(1); }
            50% { transform: translateY(50vh) translateX(50px) scale(1.2); opacity: 0.15; }
            100% { transform: translateY(-20vh) translateX(-50px) scale(1); opacity: 0; }
        }

        /* ANA KART - SAYDAM VE ESTETİK */
        .main-card {
            width: 380px; 
            background: rgba(15, 15, 15, 0.6);
            backdrop-filter: blur(25px); border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px -5px var(--profile-color);
            position: relative; overflow: hidden;
            transition: all 0.8s ease;
        }

        /* BANNER - İSTEDİĞİN KONSER RESMİ */
        .banner-box { width: 100%; height: 160px; position: relative; }
        .banner-img { 
            width: 100%; height: 100%; object-fit: cover; 
            filter: brightness(0.6);
        }

        .profile-content { padding: 0 25px 25px; text-align: center; }

        /* AVATAR & DEKOR */
        .avatar-wrap {
            position: relative; width: 100px; height: 100px;
            margin: -55px auto 15px; z-index: 10;
        }
        .avatar { 
            width: 100%; height: 100%; border-radius: 50%; 
            border: 5px solid rgba(15,15,15,0.8); object-fit: cover; 
        }
        .decor-img { position: absolute; inset: -15%; width: 130%; height: 130%; z-index: 11; pointer-events: none; }

        .status {
            position: absolute; bottom: 5px; right: 5px; width: 20px; height: 20px;
            border-radius: 50%; border: 4px solid #0f0f0f; z-index: 12;
        }
        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; }

        .display-name {
            font-size: 26px; font-weight: 800; margin: 0;
            letter-spacing: -0.5px;
        }
        .username { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }

        /* KARTLAR */
        .act-stack { display: flex; flex-direction: column; gap: 10px; }
        .card {
            background: rgba(255, 255, 255, 0.04); border-radius: 20px;
            padding: 12px 15px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.05); text-align: left;
        }
        .card-img { width: 50px; height: 50px; border-radius: 10px; }
        .card-title { font-weight: 700; font-size: 14px; color: #fff; }
        .card-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        /* SPOTIFY BAR */
        .s-bar-container { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; }
        .s-bar-fill { height: 100%; background: var(--profile-color); width: 0%; border-radius: 10px; }

        /* İKON VE ALT YAZILAR */
        .socials { display: flex; justify-content: center; gap: 40px; margin-top: 25px; }
        .social-item { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; transition: 0.3s; }
        .social-item i { font-size: 24px; color: rgba(255,255,255,0.5); }
        .social-item span { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; }
        .social-item:hover i { color: var(--profile-color); transform: translateY(-3px); }
        .social-item:hover span { color: #fff; }

        .footer { margin-top: 25px; font-size: 11px; color: rgba(255,255,255,0.2); display: flex; justify-content: center; gap: 20px; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bubble-bg"></div>

    <div class="main-card">
        <div class="banner-box">
            <img src="https://i.ibb.co/L5k6t0r/1000055681.jpg" class="banner-img">
        </div>
        
        <div class="profile-content">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar" src="">
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
                <a href="https://valeinsiva.com.tr" target="_blank" class="social-item">
                    <i class="fa-solid fa-layer-group"></i>
                    <span>Bot Panel</span>
                </a>
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-item">
                    <i class="fa-brands fa-discord"></i>
                    <span>Profili Görüntüle</span>
                </a>
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
        for(let i=0; i<12; i++) {
            let b = document.createElement('div');
            b.className = 'bubble';
            let size = Math.random() * 250 + 100;
            b.style.width = size + 'px';
            b.style.height = size + 'px';
            b.style.left = Math.random() * 100 + 'vw';
            b.style.animationDelay = Math.random() * 20 + 's';
            bg.appendChild(b);
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            
            // Profil Rengi ve Dinamik Tema
            const themeColor = u.accent_color ? '#' + u.accent_color.toString(16).padStart(6, '0') : '#5865F2';
            document.documentElement.style.setProperty('--profile-color', themeColor);

            document.getElementById("display-name").innerText = u.display_name || u.username;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            const d = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                d.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                d.style.display = "block";
            } else { d.style.display = "none"; }

            document.getElementById("status").className = "status " + data.discord_status;

            // Oyun/Aktivite Alanı
            const gZone = document.getElementById("game-zone");
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                if(lastG !== game.name) {
                    gZone.innerHTML = \`<div class="card"><div style="width:50px; height:50px; background:rgba(255,255,255,0.05); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px"><i class="fa-solid fa-gamepad"></i></div><div class="card-info"><div class="card-title">\${game.name}</div><div class="card-sub">\${game.details || 'Oynuyor'}</div></div></div>\`;
                    lastG = game.name;
                }
            } else { gZone.innerHTML = ""; lastG = ""; }

            // Spotify Alanı
            const sZone = document.getElementById("spotify-zone");
            if(data.spotify) {
                if(lastS !== data.spotify.track_id) {
                    sZone.innerHTML = \`
                        <div class="card">
                            <img src="\${data.spotify.album_art_url}" class="card-img">
                            <div style="flex:1">
                                <div class="card-title">\${data.spotify.song}</div>
                                <div class="card-sub">\${data.spotify.artist}</div>
                                <div class="s-bar-container"><div id="s-fill" class="s-bar-fill"></div></div>
                            </div>
                            <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px;"></i>
                        </div>\`;
                    lastS = data.spotify.track_id;
                }
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Math.min(Date.now() - data.spotify.timestamps.start, total);
                const prog = (elapsed / total) * 100;
                if(document.getElementById("s-fill")) document.getElementById("s-fill").style.width = prog + "%";
            } else { sZone.innerHTML = ""; lastS = ""; }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log("Site 3000 portunda aktif!"));
