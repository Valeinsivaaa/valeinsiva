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

// Görüntülenme sayısını dosyadan oku
let views = 0;
if (fs.existsSync(DB_FILE)) {
    views = JSON.parse(fs.readFileSync(DB_FILE)).views || 0;
}

let cachedData = null;

async function updateCache() {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        io.emit("presence", cachedData);
    } catch (e) { console.error("Lanyard Bağlantı Hatası"); }
}
setInterval(updateCache, 2000); // Daha hızlı güncelleme için 2 saniye

io.on("connection", (socket) => { if (cachedData) socket.emit("presence", cachedData); });

app.get("/", (req, res) => {
    if (!req.cookies.viewed) {
        views++;
        fs.writeFileSync(DB_FILE, JSON.stringify({ views })); // Sayıyı kaydet
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

        /* Hareketli Estetik Arka Plan */
        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(125deg, #050505, #0d0d1a, #150a24, #050505);
            background-size: 400% 400%; animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        /* Ana Kart - Ultra Şeffaf ve Bannerlı */
        .main-card {
            width: 380px; background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(40px); border-radius: 45px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            padding: 0; text-align: center;
            box-shadow: 0 50px 100px rgba(0,0,0,0.8);
            overflow: hidden; /* Banner taşmasın diye */
        }

        /* Discord Banner'ı */
        .discord-banner {
            width: 100%; height: 120px; /* Estetik ve çok büyük değil */
            object-fit: cover; border-bottom: 1px solid rgba(255,255,255,0.05);
            display: none; /* Veri gelene kadar gizli */
        }

        /* Profil ve Nickname Alanı (Bannerın altında) */
        .profile-container {
            padding: 30px 30px 40px;
        }

        .avatar-box {
            position: relative; width: 110px; height: 110px;
            margin: -70px auto 15px; /* Banner'ın üstüne binsin */
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid #080808; }

        /* Discord Avatar Decor'u */
        .avatar-decor {
            position: absolute; inset: -10px; /* Avatar'ın etrafını sarsın */
            border-radius: 50%; pointer-events: none; /* Tıklanmasın */
            display: none; /* Veri gelene kadar gizli */
        }

        .status-dot {
            position: absolute; bottom: 8px; right: 8px;
            width: 22px; height: 22px; border-radius: 50%;
            border: 4px solid #080808; transition: background 0.5s ease;
        }
        .online { background: #23a55a; box-shadow: 0 0 20px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 20px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 20px #f23f43; }
        .offline { background: #80848e; }

        h1 { font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
        .nickname { font-size: 14px; color: rgba(255,255,255,0.3); margin-top: 5px; }

        #activities { margin: 25px 0; min-height: 85px; }

        .activity-card {
            background: rgba(255, 255, 255, 0.04); border-radius: 20px;
            padding: 15px; display: flex; align-items: center; gap: 15px;
            text-align: left; border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.3s ease;
        }

        .activity-img { width: 55px; height: 55px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.4); }
        .activity-info { flex: 1; overflow: hidden; }
        .activity-name { font-weight: 700; font-size: 14px; color: #fff; }
        .activity-details { font-size: 12px; color: rgba(255,255,255,0.5); }

        .progress-bar { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .progress-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 10px #1db954; }

        .social-links { display: flex; justify-content: center; gap: 35px; margin-top: 15px; }
        .social-links a { color: white; font-size: 28px; opacity: 0.4; transition: 0.3s; }
        .social-links a:hover { opacity: 1; transform: translateY(-3px); }

        .footer-meta { margin-top: 35px; font-size: 12px; color: rgba(255,255,255,0.15); display: flex; justify-content: center; gap: 20px; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="main-card">
        <img id="banner" class="discord-banner" src="" alt="Banner">

        <div class="profile-container">
            <div class="header">
                <div class="avatar-box">
                    <img id="avatar" class="avatar" src="">
                    <img id="decor" class="avatar-decor" src="" alt="Decor">
                    <div id="status" class="status-dot offline"></div>
                </div>
                <h1>Valeinsiva</h1>
                <div class="nickname">@valeinsiva.</div>
            </div>
            <div id="activities"></div>
            <div class="social-links">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank"><i class="fa-brands fa-discord"></i></a>
                <a href="https://valeinsiva.com.tr" target="_blank"><i class="fa-solid fa-globe"></i></a>
            </div>
            <div class="footer-meta">
                <span><i class="fa-solid fa-eye"></i> ${views.toLocaleString()}</span>
                <span><i class="fa-solid fa-location-dot"></i> Türkiye</span>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let lastActivity = "";

        socket.on("presence", data => {
            const user = data.discord_user;
            
            // Profil Resmi ve Durum Işığı
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById("status").className = "status-dot " + data.discord_status;

            // Discord Banner'ı (Varsa)
            const bannerEl = document.getElementById("banner");
            if (user.banner) {
                bannerEl.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${user.banner}.png?size=512\`;
                bannerEl.style.display = "block";
            } else {
                bannerEl.style.display = "none";
            }

            // Discord Avatar Decor'u (Varsa)
            const decorEl = document.getElementById("decor");
            if (user.avatar_decoration) {
                decorEl.src = user.avatar_decoration;
                decorEl.style.display = "block";
            } else {
                decorEl.style.display = "none";
            }

            const container = document.getElementById("activities");
            let currentActivityHTML = "";
            let type = "none";

            if (data.spotify) {
                type = "spotify";
                const s = data.spotify;
                currentActivityHTML = \`
                    <div class="activity-card">
                        <img src="\${s.album_art_url}" class="activity-img">
                        <div class="activity-info">
                            <div class="activity-name">\${s.song}</div>
                            <div class="activity-details">\${s.artist}</div>
                            <div class="progress-bar"><div id="spotifyProgress" class="progress-fill"></div></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px; align-self:flex-start"></i>
                    </div>\`;
            } else if (data.activities.length > 0) {
                const game = data.activities.find(a => a.type === 0);
                if (game) {
                    type = "game";
                    let icon = '<i class="fa-solid fa-gamepad"></i>';
                    if(game.name.toLowerCase().includes("playstation")) icon = '<i class="fa-brands fa-playstation"></i>';
                    currentActivityHTML = \`
                        <div class="activity-card">
                            <div style="width:55px; height:55px; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px">\${icon}</div>
                            <div class="activity-info">
                                <div class="activity-name">\${game.name}</div>
                                <div class="activity-details">\${game.details || 'Playing'}</div>
                            </div>
                        </div>\`;
                }
            }

            // Eğer içerik değiştiyse güncelle (Gidip gelmeyi önler)
            const activityHash = type === "spotify" ? data.spotify.song : (type === "game" ? data.activities[0].name : "none");
            if (lastActivity !== activityHash) {
                container.innerHTML = currentActivityHTML;
                lastActivity = activityHash;
            }

            // Spotify Çubuğunu anlık güncelle
            if (type === "spotify") {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const current = Date.now() - data.spotify.timestamps.start;
                const prg = Math.min((current / total) * 100, 100);
                const bar = document.getElementById("spotifyProgress");
                if (bar) bar.style.width = prg + "%";
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log("Modern Valeinsiva Portfolyo Aktif!"));
