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
    <title>Valeinsiva | Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

        body {
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #050505;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        /* Hareketli Estetik Arka Plan */
        .bg-animate {
            position: fixed;
            inset: 0;
            z-index: -1;
            background: linear-gradient(125deg, #050505, #0a0a15, #120b1e, #050505);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
        }

        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Ana Kart - Ultra Şeffaf */
        .main-card {
            width: 380px;
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border-radius: 45px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            padding: 50px 30px;
            text-align: center;
            box-shadow: 0 50px 100px rgba(0,0,0,0.9);
            position: relative;
        }

        .avatar-box {
            position: relative;
            width: 115px;
            height: 115px;
            margin: 0 auto 20px;
        }

        .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid rgba(255,255,255,0.1);
        }

        /* Aktiflik Durum Işığı */
        .status-dot {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 4px solid #080808;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .online { background: #23a55a; box-shadow: 0 0 20px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 20px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 20px #f23f43; }
        .offline { background: #80848e; box-shadow: none; }

        h1 { font-size: 34px; font-weight: 800; margin: 0; letter-spacing: -1.5px; }
        .nickname { font-size: 14px; color: rgba(255,255,255,0.35); margin-top: 5px; }

        /* Aktivite (Spotify/Game) Tasarımı */
        #activities {
            margin: 30px 0;
            min-height: 85px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .activity-card {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 22px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 15px;
            text-align: left;
            border: 1px solid rgba(255,255,255,0.05);
            animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .activity-img {
            width: 55px;
            height: 55px;
            border-radius: 14px;
            object-fit: cover;
            box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }

        .activity-info { flex: 1; overflow: hidden; }
        .activity-name { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px; }
        .activity-details { font-size: 12px; color: rgba(255,255,255,0.5); }

        /* Hareketli Spotify Barı */
        .progress-bar {
            height: 4px;
            background: rgba(255,255,255,0.08);
            border-radius: 10px;
            margin-top: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #1db954;
            width: 0%;
            transition: width 1s linear;
            box-shadow: 0 0 10px #1db954;
        }

        .social-links {
            display: flex;
            justify-content: center;
            gap: 35px;
            margin-top: 10px;
        }

        .social-links a {
            color: white;
            font-size: 30px;
            opacity: 0.35;
            transition: 0.4s;
        }

        .social-links a:hover {
            opacity: 1;
            transform: translateY(-5px);
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.4));
        }

        .footer-meta {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.03);
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 12px;
            color: rgba(255,255,255,0.15);
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>

    <div class="bg-animate"></div>

    <div class="main-card">
        <div class="header">
            <div class="avatar-box">
                <img id="avatar" class="avatar" src="">
                <div id="status" class="status-dot offline"></div>
            </div>
            <h1>Valeinsiva</h1>
            <div class="nickname">@valeinsiva.</div>
        </div>

        <div id="activities">
            </div>

        <div class="social-links">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank"><i class="fa-brands fa-discord"></i></a>
            <a href="https://valeinsiva.com.tr" target="_blank"><i class="fa-solid fa-globe"></i></a>
        </div>

        <div class="footer-meta">
            <span><i class="fa-solid fa-eye"></i> ${views}</span>
            <span><i class="fa-solid fa-location-dot"></i> Türkiye</span>
        </div>
    </div>

    <script>
        const socket = io();
        let spotifyInterval;

        socket.on("presence", data => {
            const user = data.discord_user;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById("status").className = "status-dot " + data.discord_status;

            const container = document.getElementById("activities");
            
            // Spotify Kontrolü
            if (data.spotify) {
                const s = data.spotify;
                container.innerHTML = \`
                    <div class="activity-card">
                        <img src="\${s.album_art_url}" class="activity-img">
                        <div class="activity-info">
                            <div class="activity-name">\${s.song}</div>
                            <div class="activity-details">\${s.artist}</div>
                            <div class="progress-bar"><div id="spotifyProgress" class="progress-fill"></div></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px; align-self:flex-start"></i>
                    </div>\`;
                
                // İlerleme Çubuğu Animasyonu
                clearInterval(spotifyInterval);
                spotifyInterval = setInterval(() => {
                    const total = s.timestamps.end - s.timestamps.start;
                    const current = Date.now() - s.timestamps.start;
                    const prg = Math.min((current / total) * 100, 100);
                    const bar = document.getElementById("spotifyProgress");
                    if(bar) bar.style.width = prg + "%";
                }, 1000);

            } 
            // Oyun Kontrolü
            else if (data.activities && data.activities.length > 0) {
                const game = data.activities.find(a => a.type === 0);
                if (game) {
                    let icon = '<i class="fa-solid fa-gamepad"></i>';
                    if(game.name.toLowerCase().includes("playstation")) icon = '<i class="fa-brands fa-playstation"></i>';
                    
                    container.innerHTML = \`
                        <div class="activity-card">
                            <div style="width:55px; height:55px; background:rgba(255,255,255,0.05); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:24px">
                                \${icon}
                            </div>
                            <div class="activity-info">
                                <div class="activity-name">\${game.name}</div>
                                <div class="activity-details">\${game.details || 'Şu an oynuyor'}</div>
                            </div>
                        </div>\`;
                } else {
                    container.innerHTML = "";
                }
            } else {
                container.innerHTML = "";
                clearInterval(spotifyInterval);
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log("Modern Valeinsiva Portfolyo Hazır!"));
