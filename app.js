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

// --- AYARLAR ---
const DISCORD_ID = "877946035408891945";
const BANNER_URL = "https://i.ibb.co/L5k6t0r/1000055681.jpg"; // Kendi banner linkini buraya koy
const BOT_PANEL_URL = "https://valeinsiva.com.tr"; // Bot panelinin linkini buraya koy
const DB_FILE = "./views.json";
// ---------------

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

        :root { --profile-color: #7289da; }

        body {
            margin: 0; padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #050505; color: white;
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
            background: var(--profile-color); opacity: 0.08;
            filter: blur(60px); animation: float 25s infinite linear;
        }
        @keyframes float {
            0% { transform: translateY(110vh) scale(1); }
            100% { transform: translateY(-20vh) scale(1.5); opacity: 0; }
        }

        .main-card {
            width: 380px; 
            background: rgba(15, 15, 15, 0.7);
            backdrop-filter: blur(20px); border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 40px -10px var(--profile-color);
            position: relative; overflow: hidden;
        }

        .banner-box { width: 100%; height: 160px; overflow: hidden; }
        .banner-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6); }

        .profile-content { padding: 0 25px 25px; text-align: center; }

        .avatar-wrap {
            position: relative; width: 100px; height: 100px;
            margin: -55px auto 15px; z-index: 10;
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 4px solid #0f0f0f; object-fit: cover; }
        .decor-img { position: absolute; inset: -15%; width: 130%; height: 130%; z-index: 11; pointer-events: none; }

        .status {
            position: absolute; bottom: 5px; right: 5px; width: 18px; height: 18px;
            border-radius: 50%; border: 4px solid #0f0f0f; z-index: 12;
        }
        .online { background: #23a55a; } .idle { background: #f0b232; } .dnd { background: #f23f43; } .offline { background: #80848e; }

        .display-name { font-size: 24px; font-weight: 800; margin: 0; }
        .username { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }

        /* AKTİVİTE KARTI */
        .act-stack { min-height: 80px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
        .card {
            background: rgba(255, 255, 255, 0.04); border-radius: 18px;
            padding: 12px; display: flex; align-items: center; gap: 12px;
            border: 1px solid rgba(255,255,255,0.05); text-align: left;
        }
        .no-activity { font-size: 13px; color: rgba(255,255,255,0.3); font-style: italic; letter-spacing: 0.5px; }

        .s-bar-container { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; }
        .s-bar-fill { height: 100%; background: var(--profile-color); border-radius: 10px; transition: width 1s linear; }
        .s-time { display: flex; justify-content: space-between; font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 4px; }

        .socials { display: flex; justify-content: center; gap: 40px; margin-top: 25px; }
        .social-item { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: white; opacity: 0.5; transition: 0.3s; }
        .social-item:hover { opacity: 1; transform: translateY(-3px); color: var(--profile-color); }
        .social-item span { font-size: 10px; font-weight: 600; text-transform: uppercase; }

        .footer { margin-top: 20px; font-size: 11px; color: rgba(255,255,255,0.2); display: flex; justify-content: center; gap: 15px; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bubble-bg"></div>
    <div class="main-card">
        <div class="banner-box">
            <img src="${BANNER_URL}" class="banner-img">
        </div>
        <div class="profile-content">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status offline"></div>
            </div>
            <div id="display-name" class="display-name">Valeinsiva</div>
            <div class="username">@valeinsiva.</div>
            
            <div class="act-stack" id="act-stack">
                <div class="no-activity">Şu an bir aktivite yok...</div>
            </div>

            <div class="socials">
                <a href="${BOT_PANEL_URL}" target="_blank" class="social-item">
                    <i class="fa-solid fa-layer-group fa-xl"></i><span>Bot Panel</span>
                </a>
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-item">
                    <i class="fa-brands fa-discord fa-xl"></i><span>Profili Görüntüle</span>
                </a>
            </div>

            <div class="footer">
                <span><i class="fa-solid fa-eye"></i> ${views}</span>
                <span><i class="fa-solid fa-location-dot"></i> Türkiye</span>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        const stack = document.getElementById("act-stack");

        function formatTime(ms) {
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
        }

        // Arka plan küreleri
        const bg = document.getElementById('bubble-bg');
        for(let i=0; i<10; i++) {
            let b = document.createElement('div');
            b.className = 'bubble';
            let size = Math.random() * 150 + 100;
            b.style.width = size + 'px'; b.style.height = size + 'px';
            b.style.left = Math.random() * 100 + 'vw';
            b.style.animationDelay = Math.random() * 20 + 's';
            bg.appendChild(b);
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            const themeColor = u.accent_color ? '#' + u.accent_color.toString(16).padStart(6, '0') : '#7289da';
            document.documentElement.style.setProperty('--profile-color', themeColor);

            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            // Avatar Dekoru Kontrolü
            const decor = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            document.getElementById("status").className = "status " + data.discord_status;

            let html = "";
            let hasActivity = false;

            // Spotify
            if(data.spotify) {
                hasActivity = true;
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Math.min(Date.now() - data.spotify.timestamps.start, total);
                const progress = (elapsed / total) * 100;
                html += \`
                <div class="card">
                    <img src="\${data.spotify.album_art_url}" style="width:50px; border-radius:10px;">
                    <div style="flex:1">
                        <div style="font-weight:700; font-size:13px;">\${data.spotify.song}</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.5)">\${data.spotify.artist}</div>
                        <div class="s-bar-container"><div class="s-bar-fill" style="width:\${progress}%"></div></div>
                        <div class="s-time"><span>\${formatTime(elapsed)}</span><span>\${formatTime(total)}</span></div>
                    </div>
                    <i class="fa-brands fa-spotify" style="color:#1db954; font-size:18px"></i>
                </div>\`;
            }

            // Oyun
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                hasActivity = true;
                html += \`
                <div class="card">
                    <div style="width:40px; height:40px; background:rgba(255,255,255,0.1); border-radius:10px; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-gamepad"></i></div>
                    <div style="flex:1">
                        <div style="font-weight:700; font-size:13px;">\${game.name}</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.5)">\${game.details || 'Oynuyor'}</div>
                    </div>
                </div>\`;
            }

            stack.innerHTML = hasActivity ? html : '<div class="no-activity">Şu an bir aktivite yok...</div>';
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);

