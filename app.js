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
            height: 100vh; overflow: hidden;
        }

        /* AKICI VE KASTIRMAYAN ARKA PLAN ANIMASYONU (CSS MESH GRADIENT) */
        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(125deg, #050505 0%, #0d0d1a 30%, #1a0b2e 70%, #050505 100%);
            background-size: 400% 400%; animation: gradientMove 12s ease-in-out infinite;
        }
        @keyframes gradientMove { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }

        /* ANA KART VE DISCORD TEMASIYLA AYNI RENK AKIŞI */
        .main-card {
            width: 380px; background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(45px); border-radius: 35px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            position: relative; overflow: hidden;
            transition: box-shadow 0.3s;
        }

        /* BANNER ALANI VE DÜZELTİLMİŞ ID ÇEKİMİ */
        .banner-box { width: 100%; height: 120px; background: rgba(255,255,255,0.03); overflow: hidden; }
        #banner { width: 100%; height: 100%; object-fit: cover; display: none; }

        .profile-content { padding: 0 25px 30px; position: relative; text-align: center; }

        .avatar-area {
            position: relative; width: 100px; height: 100px;
            margin: -55px auto 15px; z-index: 10;
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 4px solid #080808; object-fit: cover; }
        .avatar-decor { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 124%; height: 124%; z-index: 11; }

        .status {
            position: absolute; bottom: 5px; right: 5px; width: 20px; height: 20px;
            border-radius: 50%; border: 4px solid #080808; z-index: 12;
        }
        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; }

        .display-name { font-size: 30px; font-weight: 800; margin: 0; color: #fff; letter-spacing: -1px; }
        .sub-nick { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }

        .act-stack { margin: 20px 0; display: flex; flex-direction: column; gap: 10px; text-align: left; }
        .act-card {
            background: rgba(255, 255, 255, 0.03); border-radius: 20px;
            padding: 15px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.06);
        }
        .act-img { width: 55px; height: 55px; border-radius: 12px; }
        .act-info { flex: 1; overflow: hidden; }
        .act-main { font-weight: 700; font-size: 14px; color: #eee; }
        .act-sub { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        .s-bar-container { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .s-bar-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 10px #1db954; transition: width 1s linear; }

        .socials { display: flex; justify-content: center; gap: 30px; margin-top: 10px; }
        .socials a { color: white; font-size: 24px; opacity: 0.4; transition: 0.3s; }
        .socials a:hover { opacity: 1; transform: scale(1.1); }

        .footer { margin-top: 25px; font-size: 11px; color: rgba(255,255,255,0.15); display: flex; justify-content: center; gap: 20px; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="main-card">
        <div class="banner-box">
            <img id="banner" src="" alt="Discord Banner">
        </div>
        <div class="profile-content">
            <div class="avatar-area">
                <img id="avatar" class="avatar">
                <img id="decor" class="avatar-decor" src="" style="display:none;">
                <div id="status" class="status offline"></div>
            </div>
            <div id="display-name" class="display-name">Valeinsiva</div>
            <div class="sub-nick">@valeinsiva.</div>
            
            <div id="activity-zone" class="act-stack"></div>

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

        socket.on("presence", data => {
            const u = data.discord_user;

            // 1. Banner ve Avatar Düzeltme
            const banner = document.getElementById("banner");
            if(u.banner) {
                const ext = u.banner.startsWith("a_") ? "gif" : "png";
                banner.src = \`https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${ext}?size=1024\`;
                banner.onerror = () => { banner.src = \`https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.png?size=1024\`; };
                banner.style.display = "block";
            } else { banner.style.display = "none"; }

            document.getElementById("display-name").innerText = u.display_name || u.username;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            const decor = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            }

            document.getElementById("status").className = "status " + data.discord_status;

            // 2. Aktivite Alanı (Yanıp Sönmeyi Engelleme)
            const zone = document.getElementById("activity-zone");
            let html = "";
            let currentKey = "none";

            if (data.spotify) {
                currentKey = data.spotify.track_id;
                html = \`
                    <div class="act-card">
                        <img src="\${data.spotify.album_art_url}" class="act-img">
                        <div class="act-info">
                            <div class="act-main">\${data.spotify.song}</div>
                            <div class="act-sub">\${data.spotify.artist}</div>
                            <div class="s-bar-container"><div id="s-fill" class="s-bar-fill"></div></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:22px"></i>
                    </div>\`;
            } else if (data.activities.length > 0) {
                const play = data.activities.find(a => a.type === 0);
                if (play) {
                    currentKey = play.name;
                    let icon = play.name.toLowerCase().includes("playstation") ? 'fa-brands fa-playstation' : 'fa-solid fa-gamepad';
                    html = \`
                        <div class="act-card">
                            <div style="width:55px; height:55px; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px"><i class="\${icon}"></i></div>
                            <div class="act-info">
                                <div class="act-title">\${play.name}</div>
                                <div class="act-sub">\${play.details || 'Oynuyor'}</div>
                            </div>
                        </div>\`;
                }
            }

            if (lastG !== currentKey) { zone.innerHTML = html; lastG = currentKey; }

            if (data.spotify) {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const prog = Math.min(((Date.now() - data.spotify.timestamps.start) / total) * 100, 100);
                const bar = document.getElementById("s-fill");
                if (bar) bar.style.width = prog + "%";
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
