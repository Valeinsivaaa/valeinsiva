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

// Görüntülenme sayısını kalıcı tutma
let views = 0;
if (fs.existsSync(DB_FILE)) {
    try { views = JSON.parse(fs.readFileSync(DB_FILE)).views || 0; } catch(e) {}
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
    <title>Valeinsiva</title>
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

        /* Hareketli Arka Plan */
        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(125deg, #050505, #0d0d1a, #150a24, #050505);
            background-size: 400% 400%; animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .main-card {
            width: 380px; background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(40px); border-radius: 40px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            padding: 0; text-align: center;
            box-shadow: 0 50px 100px rgba(0,0,0,0.8);
            overflow: hidden; position: relative;
        }

        .discord-banner {
            width: 100%; height: 120px; object-fit: cover;
            display: none; border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .profile-content { padding: 0 30px 40px; }

        .avatar-box {
            position: relative; width: 100px; height: 100px;
            margin: -55px auto 15px; /* Banner üstüne bindirme */
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 4px solid #080808; object-fit: cover; }
        .avatar-decor { position: absolute; inset: -10px; width: 120px; height: 120px; display: none; pointer-events: none; }

        .status-dot {
            position: absolute; bottom: 5px; right: 5px;
            width: 20px; height: 20px; border-radius: 50%;
            border: 4px solid #080808;
        }
        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; }

        h1 { font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -1px; }
        .nickname { font-size: 14px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        #activities { margin: 20px 0; min-height: 85px; }

        .activity-card {
            background: rgba(255, 255, 255, 0.04); border-radius: 18px;
            padding: 12px; display: flex; align-items: center; gap: 12px;
            text-align: left; border: 1px solid rgba(255,255,255,0.05);
        }
        .activity-img { width: 50px; height: 50px; border-radius: 10px; }
        .activity-info { flex: 1; overflow: hidden; }
        .activity-name { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .activity-details { font-size: 11px; color: rgba(255,255,255,0.5); }
        .prog-bar { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; }
        .prog-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 10px #1db954; }

        .social-links { display: flex; justify-content: center; gap: 40px; }
        .socials a { color: white; font-size: 26px; opacity: 0.4; transition: 0.3s; }
        .socials a:hover { opacity: 1; transform: translateY(-3px); }

        .footer { margin-top: 30px; font-size: 11px; color: rgba(255,255,255,0.15); display: flex; justify-content: center; gap: 20px; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="main-card">
        <img id="banner" class="discord-banner" src="">
        <div class="profile-content">
            <div class="avatar-box">
                <img id="avatar" class="avatar" src="">
                <img id="decor" class="avatar-decor" src="">
                <div id="status" class="status-dot offline"></div>
            </div>
            <h1>Valeinsiva</h1>
            <div class="nickname">@valeinsiva.</div>
            
            <div id="activities"></div>

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
        let lastId = "";

        socket.on("presence", data => {
            const user = data.discord_user;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById("status").className = "status-dot " + data.discord_status;

            const banner = document.getElementById("banner");
            if(user.banner) {
                banner.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${user.banner}.png?size=512\`;
                banner.style.display = "block";
            } else { banner.style.display = "none"; }

            const decor = document.getElementById("decor");
            if(user.avatar_decoration) {
                decor.src = user.avatar_decoration;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            const container = document.getElementById("activities");
            let html = "";
            let currentId = "none";

            if (data.spotify) {
                currentId = data.spotify.track_id;
                html = \`
                    <div class="activity-card">
                        <img src="\${data.spotify.album_art_url}" class="activity-img">
                        <div class="activity-info">
                            <div class="activity-name">\${data.spotify.song}</div>
                            <div class="activity-details">\${data.spotify.artist}</div>
                            <div class="prog-bar"><div id="sBar" class="prog-fill"></div></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:18px"></i>
                    </div>\`;
            } else if (data.activities.length > 0) {
                const g = data.activities.find(a => a.type === 0);
                if (g) {
                    currentId = g.name;
                    let icon = g.name.toLowerCase().includes("playstation") ? 'fa-brands fa-playstation' : 'fa-solid fa-gamepad';
                    html = \`
                        <div class="activity-card">
                            <div style="width:50px; height:50px; background:rgba(255,255,255,0.05); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px"><i class="\${icon}"></i></div>
                            <div class="activity-info">
                                <div class="activity-name">\${g.name}</div>
                                <div class="activity-details">\${g.details || 'Oynuyor'}</div>
                            </div>
                        </div>\`;
                }
            }

            if(lastId !== currentId) { container.innerHTML = html; lastId = currentId; }

            if(data.spotify) {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const progress = Math.min(((Date.now() - data.spotify.timestamps.start) / total) * 100, 100);
                const bar = document.getElementById("sBar");
                if(bar) bar.style.width = progress + "%";
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
