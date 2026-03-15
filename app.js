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

        body {
            margin: 0; padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #050505; color: white;
            display: flex; justify-content: center; align-items: center;
            height: 100vh; overflow: hidden;
        }

        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(125deg, #050505 0%, #0d0d1a 30%, #1a0b2e 70%, #050505 100%);
            background-size: 400% 400%; animation: gradientMove 12s ease infinite;
        }
        @keyframes gradientMove { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }

        .main-card {
            width: 380px; background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(60px); border-radius: 35px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 40px 100px rgba(0,0,0,0.9);
            position: relative; overflow: hidden;
        }

        .banner-box { width: 100%; height: 110px; background: rgba(255,255,255,0.02); overflow: hidden; }
        #banner { width: 100%; height: 100%; object-fit: cover; }

        .profile-content { padding: 0 25px 25px; text-align: center; }

        .avatar-wrap {
            position: relative; width: 100px; height: 100px;
            margin: -55px auto 10px; z-index: 10;
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 4px solid #080808; object-fit: cover; }
        .decor-img { position: absolute; inset: -15%; width: 130%; height: 130%; z-index: 11; pointer-events: none; }

        .status {
            position: absolute; bottom: 5px; right: 5px; width: 20px; height: 20px;
            border-radius: 50%; border: 4px solid #080808; z-index: 12;
        }
        .online { background: #23a55a; } .idle { background: #f0b232; } .dnd { background: #f23f43; } .offline { background: #80848e; }

        /* ROZETLER - GÖRÜNÜRLÜK DÜZELTİLDİ */
        .badges-container {
            display: flex; justify-content: center; gap: 6px; margin-bottom: 5px; position: relative; z-index: 20;
        }
        .badge-icon {
            width: 20px; height: 20px; object-fit: contain;
        }

        /* YAZI ESKİ HALİNE DÖNDÜ */
        .display-name {
            font-size: 32px; font-weight: 800; margin: 0;
            color: #ffffff;
            letter-spacing: -1px;
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
        }
        
        .username { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 15px; }

        .act-stack { margin: 15px 0; display: flex; flex-direction: column; gap: 10px; }

        .card {
            background: rgba(255, 255, 255, 0.04); border-radius: 20px;
            padding: 14px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.08); text-align: left;
        }
        .card-img { width: 50px; height: 50px; border-radius: 12px; object-fit: cover; }
        .card-info { flex: 1; overflow: hidden; }
        .card-title { font-weight: 700; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        /* SPOTIFY SÜRE VE BAR */
        .spotify-time-info {
            display: flex; justify-content: space-between; font-size: 10px;
            color: rgba(255,255,255,0.4); margin-top: 8px; font-family: monospace;
        }
        .s-bar-container { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 4px; overflow: hidden; }
        .s-bar-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 8px rgba(29, 185, 84, 0.5); }

        .socials { display: flex; justify-content: center; gap: 30px; margin-top: 10px; }
        .socials i { font-size: 24px; color: white; opacity: 0.4; transition: 0.3s; }
        .socials i:hover { opacity: 1; transform: scale(1.1); }

        .footer { margin-top: 25px; font-size: 11px; color: rgba(255,255,255,0.2); display: flex; justify-content: center; gap: 20px; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="main-card">
        <div class="banner-box"><img id="banner"></div>
        <div class="profile-content">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status offline"></div>
            </div>

            <div class="badges-container">
                <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/nitro.png" class="badge-icon">
                <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbravery.png" class="badge-icon">
                <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boost1month.png" class="badge-icon">
                <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/activedeveloper.png" class="badge-icon">
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

        function formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            document.getElementById("display-name").innerText = u.display_name || u.username;

            const b = document.getElementById("banner");
            if(u.banner) {
                b.src = \`https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${u.banner.startsWith("a_")?"gif":"png"}?size=600\`;
                b.style.display = "block";
            }

            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            const d = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                d.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                d.style.display = "block";
            }

            document.getElementById("status").className = "status " + data.discord_status;

            // Oyun
            const gZone = document.getElementById("game-zone");
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                if(lastG !== game.name) {
                    gZone.innerHTML = \`
                        <div class="card">
                            <div style="width:50px; height:50px; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px"><i class="fa-solid fa-gamepad"></i></div>
                            <div class="card-info">
                                <div class="card-title">\${game.name}</div>
                                <div class="card-sub">\${game.details || 'Oynuyor'}</div>
                            </div>
                            <i class="fa-brands fa-playstation" style="color:#00439c; font-size:22px;"></i>
                        </div>\`;
                    lastG = game.name;
                }
            } else { gZone.innerHTML = ""; lastG = ""; }

            // Spotify - Saniye Saniye İlerleme ve Bitiş Süresi
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
                                <div class="spotify-time-info">
                                    <span id="s-start">00:00</span>
                                    <span id="s-end">00:00</span>
                                </div>
                            </div>
                            <i class="fa-brands fa-spotify" style="color:#1db954; font-size:22px;"></i>
                        </div>\`;
                    lastS = data.spotify.track_id;
                }
                
                // Zaman hesaplama
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Math.min(Date.now() - data.spotify.timestamps.start, total);
                const prog = (elapsed / total) * 100;
                
                const bar = document.getElementById("s-fill");
                const startTxt = document.getElementById("s-start");
                const endTxt = document.getElementById("s-end");
                
                if(bar) bar.style.width = prog + "%";
                if(startTxt) startTxt.innerText = formatTime(elapsed);
                if(endTxt) endTxt.innerText = formatTime(total);
                
            } else { sZone.innerHTML = ""; lastS = ""; }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
