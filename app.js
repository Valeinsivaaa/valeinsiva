const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cookieParser());

const DISCORD_ID = "877946035408891945"; // Kendi ID'n ile değiştir
let views = 0;
let cachedData = null;

// Lanyard API üzerinden Discord verilerini çekme
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

    // Kullanıcı konumunu IP üzerinden çekme
    let userLocation = "Dünya";
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // Lokal testlerde (127.0.0.1) konum çalışmaz, sunucuda çalışır.
        const loc = await axios.get(`http://ip-api.com/json/${ip}?fields=city,country`);
        if(loc.data.status === 'success') userLocation = `${loc.data.city}, ${loc.data.country}`;
    } catch { userLocation = "Bilinmiyor"; }

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
            background: #050505; /* Simsiyah modern arka plan */
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        /* Ana Kart Tasarımı */
        .main-card {
            width: 380px;
            background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(30px);
            border-radius: 40px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 45px 30px;
            text-align: center;
            box-shadow: 0 40px 100px rgba(0,0,0,0.9);
        }

        .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            margin-bottom: 25px;
        }

        .avatar-box {
            position: relative;
            width: 100px;
            height: 100px;
        }

        .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.08);
        }

        /* Aktiflik Durum Işığı (Neon) */
        .status-dot {
            position: absolute;
            bottom: 6px;
            right: 6px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 4px solid #050505;
            transition: all 0.5s ease;
        }

        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; box-shadow: none; }

        .name-section h1 {
            font-size: 32px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -1px;
            background: linear-gradient(to bottom, #fff, #888);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nickname {
            font-size: 14px;
            color: rgba(255,255,255,0.3);
            margin-top: 4px;
            font-weight: 400;
        }

        /* Sadece Discord ve Web Butonları */
        .social-links {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 40px 0;
        }

        .social-links a {
            color: white;
            font-size: 30px;
            text-decoration: none;
            opacity: 0.5;
            transition: all 0.3s ease;
        }

        .social-links a:hover {
            opacity: 1;
            transform: scale(1.2);
            filter: drop-shadow(0 0 15px rgba(255,255,255,0.5));
        }

        /* Alt Bilgi Alanı */
        .footer-meta {
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 12px;
            color: rgba(255,255,255,0.25);
            border-top: 1px solid rgba(255,255,255,0.03);
            padding-top: 25px;
        }

        .footer-meta i { margin-right: 6px; }

    </style>
</head>
<body>

    <div class="main-card">
        <div class="header">
            <div class="avatar-box">
                <img id="avatar" class="avatar" src="https://via.placeholder.com/100">
                <div id="status" class="status-dot offline"></div>
            </div>
            <div class="name-section">
                <h1>Valeinsiva</h1>
                <div class="nickname">@valeinsiva.</div>
            </div>
        </div>

        <div class="social-links">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank">
                <i class="fa-brands fa-discord"></i>
            </a>
            
            <a href="https://GİTMESİNİ_İSTEDİĞİN_LİNK.com" target="_blank">
                <i class="fa-solid fa-globe"></i>
            </a>
        </div>

        <div class="footer-meta">
            <span><i class="fa-solid fa-eye"></i> ${views}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${userLocation}</span>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on("presence", data => {
            const user = data.discord_user;
            // Profil resmini güncelle
            if(user.avatar) {
                document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            }
            
            // Durum ışığını güncelle
            const statusDot = document.getElementById("status");
            statusDot.className = "status-dot " + data.discord_status;
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log("Valeinsiva Portfolyo 3000 portunda yayında!"));
