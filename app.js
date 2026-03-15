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

// API Cache Sistemi (Rate limit yememek için)
async function updateCache() {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        io.emit("presence", cachedData);
    } catch (e) { console.error("Lanyard Error"); }
}
setInterval(updateCache, 5000);

io.on("connection", (socket) => { if (cachedData) socket.emit("presence", cachedData); });

app.get("/", (req, res) => {
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
    <title>Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

        body {
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #08080c;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }

        /* Arka Plan Efekti */
        .bg-glow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(88, 101, 242, 0.15) 0%, rgba(0,0,0,0) 70%);
            z-index: -1;
        }

        /* Ana Kart */
        .main-card {
            width: 650px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 40px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        /* Üst Kısım: Avatar ve İsim */
        .header {
            display: flex;
            align-items: center;
            gap: 25px;
            margin-bottom: 30px;
        }

        .avatar-container { position: relative; }

        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.1);
        }

        .user-info .name {
            font-size: 32px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .badges { display: flex; gap: 8px; }
        .badges img { width: 22px; filter: drop-shadow(0 0 5px rgba(255,255,255,0.3)); }

        .discord-link {
            color: rgba(255,255,255,0.6);
            font-size: 14px;
            margin-top: 5px;
            font-weight: 400;
        }

        /* Orta Bölüm: Durum Kartları */
        .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }

        .status-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .status-icon { font-size: 24px; color: #5865f2; }

        /* Sosyal Medya İkonları */
        .socials {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-bottom: 30px;
        }

        .socials i {
            font-size: 24px;
            color: white;
            opacity: 0.8;
            transition: 0.3s;
            cursor: pointer;
            filter: drop-shadow(0 0 8px transparent);
        }

        .socials i:hover {
            opacity: 1;
            transform: translateY(-3px);
            filter: drop-shadow(0 0 12px white);
        }

        /* Footer Bilgileri */
        .meta-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 13px;
            color: rgba(255,255,255,0.4);
        }

        /* Spotify Alt Bar */
        .spotify-bar {
            width: 650px;
            margin-top: 20px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 15px 30px;
            display: flex;
            align-items: center;
            gap: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            display: none; /* Başlangıçta gizli */
        }

        .spotify-img { width: 50px; height: 50px; border-radius: 10px; }

        .spotify-info { flex: 1; }
        .spotify-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
        .spotify-artist { font-size: 12px; color: rgba(255,255,255,0.6); }

        .progress-container {
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            margin-top: 10px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: white;
            width: 0%;
            transition: width 1s linear;
        }

        .spotify-controls { display: flex; gap: 15px; color: rgba(255,255,255,0.6); }

    </style>
</head>
<body>

    <div class="bg-glow"></div>

    <div class="main-card">
        <div class="header">
            <div class="avatar-container">
                <img id="avatar" class="avatar" src="">
            </div>
            <div class="user-info">
                <div class="name">
                    <span id="display-name">Loading</span>
                    <div class="badges">
                        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg">
                        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbalance.svg">
                    </div>
                </div>
                <div class="discord-link">discord.gg/guns</div>
            </div>
        </div>

        <div class="status-grid">
            <div class="status-box">
                <i class="fa-brands fa-discord status-icon"></i>
                <div>
                    <div id="username" style="font-weight:600">User#0000</div>
                    <div style="font-size:12px; opacity:0.5" id="status-text">connecting...</div>
                </div>
            </div>
            <div class="status-box">
                <i class="fa-solid fa-link status-icon" style="color:#fff"></i>
                <div>
                    <div style="font-weight:600">guns.lol</div>
                    <div style="font-size:12px; opacity:0.5">official member</div>
                </div>
            </div>
        </div>

        <div class="socials">
            <i class="fa-brands fa-discord"></i>
            <i class="fa-brands fa-github"></i>
            <i class="fa-solid fa-envelope"></i>
            <i class="fa-brands fa-telegram"></i>
            <i class="fa-solid fa-globe"></i>
        </div>

        <div class="meta-info">
            <span><i class="fa-solid fa-eye"></i> ${views.toLocaleString()}</span>
            <span><i class="fa-solid fa-location-dot"></i> guns.lol HQ</span>
        </div>
    </div>

    <div id="spotify-card" class="spotify-bar">
        <img id="spotify-album" class="spotify-img" src="">
        <div class="spotify-info">
            <div id="spotify-song" class="spotify-title">Song Name</div>
            <div id="spotify-art" class="spotify-artist">Artist</div>
            <div class="progress-container">
                <div id="spotify-progress" class="progress-fill"></div>
            </div>
        </div>
        <div class="spotify-controls">
            <i class="fa-solid fa-backward-step"></i>
            <i class="fa-solid fa-pause"></i>
            <i class="fa-solid fa-forward-step"></i>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on("presence", data => {
            const user = data.discord_user;
            
            // Üst Kısım
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById("display-name").innerText = user.global_name || user.username;
            document.getElementById("username").innerText = user.username;
            document.getElementById("status-text").innerText = data.discord_status.toUpperCase();

            // Spotify
            const spotifyCard = document.getElementById("spotify-card");
            if (data.spotify) {
                spotifyCard.style.display = "flex";
                document.getElementById("spotify-album").src = data.spotify.album_art_url;
                document.getElementById("spotify-song").innerText = data.spotify.song;
                document.getElementById("spotify-art").innerText = data.spotify.artist;
                
                // Progress Hesaplama
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const current = Date.now() - data.spotify.timestamps.start;
                const prg = Math.min((current / total) * 100, 100);
                document.getElementById("spotify-progress").style.width = prg + "%";
            } else {
                spotifyCard.style.display = "none";
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => {
    console.log("Guns.lol temalı sunucu 3000 portunda hazır!");
});
