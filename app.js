const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cookieParser());

const DISCORD_ID = "877946035408891945";
let views = 0;
let cachedData = null;

async function updateCache() {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        io.emit("presence", cachedData);
    } catch (e) { console.error("Lanyard Error"); }
}
setInterval(updateCache, 5000);

io.on("connection", (socket) => { if (cachedData) socket.emit("presence", cachedData); });

app.get("/", async (req, res) => {
    if (!req.cookies.viewed) {
        views++;
        res.cookie("viewed", "yes", { maxAge: 31536000000 });
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

        body {
            margin: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #050505;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow-x: hidden;
        }

        .main-card {
            width: 400px;
            background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(30px);
            border-radius: 40px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 40px 25px;
            text-align: center;
            box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }

        .header { margin-bottom: 20px; }

        .avatar-box {
            position: relative;
            width: 110px;
            height: 110px;
            margin: 0 auto 15px;
        }

        .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.08);
        }

        .status-dot {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 4px solid #050505;
        }

        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; }

        h1 { font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
        .nickname { font-size: 14px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        /* Aktivite Alanı (Spotify / Oyun) */
        #activities {
            margin: 25px 0;
            min-height: 0;
        }

        .activity-card {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 20px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            text-align: left;
            border: 1px solid rgba(255,255,255,0.05);
            animation: fadeIn 0.5s ease;
        }

        .activity-img {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            object-fit: cover;
        }

        .activity-info { flex: 1; overflow: hidden; }
        .activity-name { font-weight: 700; font-size: 14px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
        .activity-details { font-size: 12px; color: rgba(255,255,255,0.5); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }

        .progress-bar {
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            margin-top: 8px;
        }
        .progress-fill { height: 100%; background: #1db954; width: 0%; border-radius: 2px; }

        .social-links {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 10px;
        }

        .social-links a {
            color: white;
            font-size: 28px;
            opacity: 0.4;
            transition: 0.3s;
        }

        .social-links a:hover { opacity: 1; transform: translateY(-3px); }

        .footer-meta {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.03);
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 12px;
            color: rgba(255,255,255,0.2);
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>

    <div class="main-card">
        <div class="header">
            <div class="avatar-box">
                <img id="avatar" class="avatar" src="">
                <div id="status" class="status-dot offline"></div>
            </div>
            <h1>Valeinsiva</h1>
            <div class="nickname">@valeinsiva.</div>
        </div>

        <div id="activities"></div>

        <div class="social-links">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank"><i class="fa-brands fa-discord"></i></a>
            <a href="https://GİTMESİNİ_İSTEDİĞİN_LİNK.com" target="_blank"><i class="fa-solid fa-globe"></i></a>
        </div>

        <div class="footer-meta">
            <span><i class="fa-solid fa-eye"></i> ${views}</span>
            <span><i class="fa-solid fa-location-dot"></i> Dünya</span>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on("presence", data => {
            const user = data.discord_user;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById("status").className = "status-dot " + data.discord_status;

            const activityContainer = document.getElementById("activities");
            activityContainer.innerHTML = "";

            // ÖNCELİK 1: Spotify
            if (data.spotify) {
                const s = data.spotify;
                const total = s.timestamps.end - s.timestamps.start;
                const current = Date.now() - s.timestamps.start;
                const prg = Math.min((current / total) * 100, 100);

                activityContainer.innerHTML = \`
                    <div class="activity-card">
                        <img src="\${s.album_art_url}" class="activity-img">
                        <div class="activity-info">
                            <div class="activity-name">\${s.song}</div>
                            <div class="activity-details">\${s.artist}</div>
                            <div class="progress-bar"><div class="progress-fill" style="width: \${prg}%"></div></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color: #1db954; font-size: 20px;"></i>
                    </div>\`;
            } 
            // ÖNCELİK 2: Oyunlar (Steam, PlayStation vs.)
            else if (data.activities && data.activities.length > 0) {
                const act = data.activities.find(a => a.type === 0); // Playing tipi
                if (act) {
                    let icon = '<i class="fa-solid fa-gamepad"></i>';
                    if (act.name.toLowerCase().includes("playstation")) icon = '<i class="fa-brands fa-playstation"></i>';
                    if (act.name.toLowerCase().includes("steam")) icon = '<i class="fa-brands fa-steam"></i>';

                    activityContainer.innerHTML = \`
                        <div class="activity-card">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                                \${icon}
                            </div>
                            <div class="activity-info">
                                <div class="activity-name">\${act.name}</div>
                                <div class="activity-details">\${act.details || 'Oynuyor'}</div>
                            </div>
                        </div>\`;
                }
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log("Profil aktif!"));
