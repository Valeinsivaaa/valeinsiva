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
            min-height: 100vh; overflow-y: auto;
        }

        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(125deg, #050505, #0d0d1a, #150a24, #050505);
            background-size: 400% 400%; animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .container { width: 380px; margin: 40px 0; }

        .main-card {
            background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(40px); border-radius: 35px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: 0 50px 100px rgba(0,0,0,0.8);
            overflow: hidden; position: relative;
        }

        .banner-box { width: 100%; height: 110px; background: #111; position: relative; overflow: hidden; }
        #banner { width: 100%; height: 100%; object-fit: cover; display: none; }

        .profile-section { padding: 0 25px 25px; text-align: center; }

        .avatar-container {
            position: relative; width: 100px; height: 100px;
            margin: -50px auto 15px; z-index: 5;
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 4px solid #080808; object-fit: cover; }
        .decor { position: absolute; inset: -12%; width: 124%; height: 124%; z-index: 6; pointer-events: none; display: none; }
        
        .status-dot {
            position: absolute; bottom: 5px; right: 5px; width: 20px; height: 20px;
            border-radius: 50%; border: 4px solid #080808; z-index: 7;
        }
        .online { background: #23a55a; } .idle { background: #f0b232; } .dnd { background: #f23f43; } .offline { background: #80848e; }

        h1 { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -1px; }
        .tag { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 5px; }

        /* Aktivite Alanı */
        .activity-stack { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }
        .act-card {
            background: rgba(255, 255, 255, 0.03); border-radius: 20px;
            padding: 12px; display: flex; align-items: center; gap: 12px;
            text-align: left; border: 1px solid rgba(255,255,255,0.05);
        }
        .act-icon { width: 50px; height: 50px; border-radius: 12px; object-fit: cover; }
        .act-info { flex: 1; overflow: hidden; }
        .act-title { font-weight: 700; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        
        .s-bar { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .s-fill { height: 100%; background: #1db954; width: 0%; transition: width 1s linear; }

        .socials { display: flex; justify-content: center; gap: 35px; margin-top: 10px; }
        .socials a { color: white; font-size: 24px; opacity: 0.3; transition: 0.3s; }
        .socials a:hover { opacity: 1; transform: translateY(-3px); }

        .footer { margin-top: 25px; display: flex; justify-content: center; gap: 20px; font-size: 11px; color: rgba(255,255,255,0.15); }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="container">
        <div class="main-card">
            <div class="banner-box"><img id="banner"></div>
            <div class="profile-section">
                <div class="avatar-container">
                    <img id="avatar" class="avatar">
                    <img id="decor" class="decor">
                    <div id="status" class="status-dot"></div>
                </div>
                <h1>Valeinsiva</h1>
                <div class="tag">@valeinsiva.</div>
                
                <div id="activity-stack" class="activity-stack"></div>

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
    </div>

    <script>
        const socket = io();
        let lastStack = "";

        socket.on("presence", data => {
            const user = data.discord_user;
            
            // Banner (Uzantı Kontrollü)
            const banner = document.getElementById("banner");
            if(user.banner) {
                const ext = user.banner.startsWith("a_") ? "gif" : "png";
                banner.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${user.banner}.\${ext}?size=600\`;
                banner.style.display = "block";
            }

            // Avatar & Dekor
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            const decor = document.getElementById("decor");
            if(user.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${user.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            }

            document.getElementById("status").className = "status-dot " + data.discord_status;

            // Stack Mantığı (Aynı anda Oyun + Spotify)
            const stack = document.getElementById("activity-stack");
            let html = "";
            let currentStackKey = "";

            // 1. PlayStation / Oyun
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                currentStackKey += game.name;
                let gameIcon = "";
                if(game.assets && game.assets.large_image) {
                    gameIcon = game.assets.large_image.startsWith("mp:") ? 
                        "https://images-ext-1.discordapp.net/external/" + game.assets.large_image.split("https/")[1] :
                        \`https://cdn.discordapp.com/app-assets/\${game.application_id}/\${game.assets.large_image}.png\`;
                }
                const isPS = game.name.toLowerCase().includes("playstation") || (game.assets && game.assets.large_text && game.assets.large_text.toLowerCase().includes("playstation"));
                
                html += \`
                    <div class="act-card">
                        <img src="\${gameIcon || 'https://i.imgur.com/8Q9M99S.png'}" class="act-icon">
                        <div class="act-info">
                            <div class="act-title">\${game.name}</div>
                            <div class="act-sub">\${game.details || 'Oynuyor'}</div>
                        </div>
                        \${isPS ? '<i class="fa-brands fa-playstation" style="color:#00439c; font-size:18px"></i>' : '<i class="fa-solid fa-gamepad" style="opacity:0.2"></i>'}
                    </div>\`;
            }

            // 2. Spotify
            if(data.spotify) {
                currentStackKey += data.spotify.track_id;
                html += \`
                    <div class="act-card" style="border-color: rgba(29, 185, 84, 0.2)">
                        <img src="\${data.spotify.album_art_url}" class="act-icon">
                        <div class="act-info">
                            <div class="act-title">\${data.spotify.song}</div>
                            <div class="act-sub">\${data.spotify.artist}</div>
                            <div class="s-bar"><div id="sFill" class="s-fill"></div></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:18px"></i>
                    </div>\`;
            }

            if(lastStack !== currentStackKey) { stack.innerHTML = html; lastStack = currentStackKey; }

            // Spotify Bar Güncelleme
            if(data.spotify) {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const progress = Math.min(((Date.now() - data.spotify.timestamps.start) / total) * 100, 100);
                const bar = document.getElementById("sFill");
                if(bar) bar.style.width = progress + "%";
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
