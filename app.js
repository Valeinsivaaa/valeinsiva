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
    <title>Valeinsiva | Portfolio</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

        body {
            margin: 0; padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #050505; color: white;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh; overflow: hidden;
        }

        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(135deg, #050505 0%, #0d0d1a 30%, #1a0b2e 70%, #050505 100%);
            background-size: 400% 400%; animation: gradientMove 12s ease-in-out infinite;
        }
        @keyframes gradientMove { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }

        .main-card {
            width: 360px; background: rgba(255, 255, 255, 0.015);
            backdrop-filter: blur(45px); border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            position: relative;
        }

        .banner-container {
            width: 100%; height: 95px; border-radius: 30px 30px 0 0; 
            overflow: hidden; background: rgba(255,255,255,0.03);
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        #banner { width: 100%; height: 100%; object-fit: cover; display: none; }

        .content { padding: 0 25px 30px; position: relative; }

        .avatar-area {
            position: relative; width: 95px; height: 95px;
            margin: -50px auto 15px; z-index: 10;
        }
        .avatar {
            width: 100%; height: 100%; border-radius: 50%;
            border: 4px solid #080808; object-fit: cover;
            position: relative; z-index: 1;
        }
        .avatar-decor {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 120%; height: 120%; z-index: 2; pointer-events: none; display: none;
        }

        .status-dot {
            position: absolute; bottom: 5px; right: 5px;
            width: 18px; height: 18px; border-radius: 50%;
            border: 3px solid #080808; z-index: 3;
        }
        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; }

        h1 { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -1px; }
        .sub-nick { font-size: 13px; color: rgba(255,255,255,0.3); margin: 5px 0 20px; }

        #activity-zone { min-height: 80px; margin-bottom: 20px; }
        .act-box {
            background: rgba(255, 255, 255, 0.03); border-radius: 18px;
            padding: 12px; display: flex; align-items: center; gap: 12px;
            text-align: left; border: 1px solid rgba(255,255,255,0.05);
        }
        .act-img { width: 50px; height: 50px; border-radius: 10px; }
        .act-text { flex: 1; overflow: hidden; }
        .act-main { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }

        /* Spotify Bar & Timer */
        .spotify-timer {
            display: flex; align-items: center; gap: 8px; margin-top: 8px;
            font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 600;
        }
        .p-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
        .p-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 10px #1db954; }

        .socials { display: flex; justify-content: center; gap: 35px; }
        .socials a { color: white; font-size: 26px; opacity: 0.3; transition: 0.3s; }
        .socials a:hover { opacity: 1; transform: translateY(-3px); }

        .footer { margin-top: 30px; display: flex; justify-content: center; gap: 20px; font-size: 11px; color: rgba(255,255,255,0.15); }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="main-card">
        <div class="banner-container">
            <img id="banner" src="" alt="">
        </div>
        <div class="content">
            <div class="avatar-area">
                <img id="avatar" class="avatar" src="">
                <img id="decor" class="avatar-decor" src="">
                <div id="status" class="status-dot offline"></div>
            </div>
            <h1>Valeinsiva</h1>
            <div class="sub-nick">@valeinsiva.</div>
            
            <div id="activity-zone"></div>

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
        let lastActivityKey = "";

        function formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const min = Math.floor(totalSec / 60);
            const sec = totalSec % 60;
            return min + ":" + (sec < 10 ? "0" : "") + sec;
        }

        socket.on("presence", data => {
            const user = data.discord_user;

            // Avatar
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById("status").className = "status-dot " + data.discord_status;

            // Banner (Gelişmiş Kontrol)
            const banner = document.getElementById("banner");
            const bannerHash = user.banner || data.discord_user.banner;
            if (bannerHash) {
                banner.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${bannerHash}.png?size=600\`;
                banner.style.display = "block";
            } else { banner.style.display = "none"; }

            // Dekor (Gelişmiş Kontrol)
            const decor = document.getElementById("decor");
            const decorUrl = user.avatar_decoration_data ? \`https://cdn.discordapp.com/avatar-decoration-presets/\${user.avatar_decoration_data.asset}.png\` : null;
            if (decorUrl || user.avatar_decoration) {
                decor.src = decorUrl || user.avatar_decoration;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            // Aktivite Alanı
            const zone = document.getElementById("activity-zone");
            let html = "";
            let currentKey = "none";

            if (data.spotify) {
                currentKey = data.spotify.track_id;
                html = \`
                    <div class="act-box">
                        <img src="\${data.spotify.album_art_url}" class="act-img">
                        <div class="act-text">
                            <div class="act-main">\${data.spotify.song}</div>
                            <div class="act-sub">\${data.spotify.artist}</div>
                            <div class="spotify-timer">
                                <span id="time-curr">0:00</span>
                                <div class="p-bar"><div id="s-fill" class="p-fill"></div></div>
                                <span id="time-end">0:00</span>
                            </div>
                        </div>
                    </div>\`;
            } else if (data.activities.length > 0) {
                const game = data.activities.find(a => a.type === 0);
                if (game) {
                    currentKey = game.name;
                    let icon = game.name.toLowerCase().includes("playstation") ? 'fa-brands fa-playstation' : 'fa-solid fa-gamepad';
                    html = \`
                        <div class="act-box">
                            <div style="width:50px; height:50px; background:rgba(255,255,255,0.05); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:22px"><i class="\${icon}"></i></div>
                            <div class="act-text">
                                <div class="act-main">\${game.name}</div>
                                <div class="act-sub">\${game.details || 'Aktif'}</div>
                            </div>
                        </div>\`;
                }
            }

            if (lastActivityKey !== currentKey) {
                zone.innerHTML = html;
                lastActivityKey = currentKey;
            }

            // Spotify Real-time Update
            if (data.spotify) {
                const start = data.spotify.timestamps.start;
                const end = data.spotify.timestamps.end;
                const total = end - start;
                
                const updateSpotify = () => {
                    const now = Date.now();
                    const elapsed = Math.min(now - start, total);
                    const prog = (elapsed / total) * 100;
                    
                    const bar = document.getElementById("s-fill");
                    const currTxt = document.getElementById("time-curr");
                    const endTxt = document.getElementById("time-end");
                    
                    if (bar) bar.style.width = prog + "%";
                    if (currTxt) currTxt.innerText = formatTime(elapsed);
                    if (endTxt) endTxt.innerText = formatTime(total);
                };
                updateSpotify();
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
