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
            min-height: 100vh; overflow-y: auto; padding: 40px 0;
        }

        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(135deg, #050505 0%, #0d0d1a 30%, #1a0b2e 70%, #050505 100%);
            background-size: 400% 400%; animation: gradientMove 12s ease-in-out infinite;
        }
        @keyframes gradientMove { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }

        .container { width: 380px; display: flex; flex-direction: column; gap: 20px; position: relative; }

        .main-card {
            background: rgba(255, 255, 255, 0.015);
            backdrop-filter: blur(45px); border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            position: relative; overflow: hidden;
        }

        .banner-container {
            width: 100%; height: 100px; position: relative;
            background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        #banner { width: 100%; height: 100%; object-fit: cover; display: none; }

        .content { padding: 0 25px 25px; position: relative; text-align: center; }

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
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 120%; height: 120%; z-index: 2; pointer-events: none;
        }

        .status-dot {
            position: absolute; bottom: 5px; right: 5px; width: 18px; height: 18px;
            border-radius: 50%; border: 3px solid #080808; z-index: 3;
        }
        .online { background: #23a55a; box-shadow: 0 0 15px #23a55a; }
        .idle { background: #f0b232; box-shadow: 0 0 15px #f0b232; }
        .dnd { background: #f23f43; box-shadow: 0 0 15px #f23f43; }
        .offline { background: #80848e; }

        h1 { font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; color: #fff; }
        .sub-nick { font-size: 13px; color: rgba(255,255,255,0.3); margin: 5px 0 15px; }

        /* Oyun Kartı */
        .game-card {
            background: rgba(255, 255, 255, 0.03); border-radius: 20px;
            padding: 15px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.05); margin-bottom: 15px;
            text-align: left; position: relative;
        }
        .act-img { width: 55px; height: 55px; border-radius: 12px; object-fit: cover; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .act-text { flex: 1; overflow: hidden; }
        .act-main { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #eee; }
        .act-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 3px; }
        .time-counter { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 5px; font-weight: 600; }

        /* Spotify Kartı (Guns.lol Stil) */
        .spotify-card {
            background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px);
            border-radius: 25px; padding: 15px 20px; border: 1px solid rgba(29, 185, 84, 0.2);
            display: flex; align-items: center; gap: 18px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .spot-img { width: 60px; height: 60px; border-radius: 12px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
        .spot-info { flex: 1; overflow: hidden; }
        .spot-title { font-weight: 800; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spot-artist { font-size: 12px; color: rgba(255,255,255,0.5); margin: 2px 0 8px; }
        
        .spot-progress-container { display: flex; align-items: center; gap: 10px; font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 700; }
        .p-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
        .p-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 12px rgba(29, 185, 84, 0.6); }

        .socials { display: flex; justify-content: center; gap: 25px; margin-top: 5px; }
        .socials a { color: white; font-size: 22px; opacity: 0.3; transition: 0.3s; }
        .socials a:hover { opacity: 1; transform: scale(1.2); }

        .footer { margin-top: 20px; display: flex; justify-content: center; gap: 15px; font-size: 11px; color: rgba(255,255,255,0.2); }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="container">
        <div class="main-card">
            <div class="banner-container">
                <img id="banner" src="" alt="">
            </div>
            <div class="content">
                <div class="avatar-area">
                    <img id="avatar" class="avatar" src="">
                    <img id="decor" class="avatar-decor" src="" style="display:none;">
                    <div id="status" class="status-dot offline"></div>
                </div>
                <h1>Valeinsiva</h1>
                <div class="sub-nick">@valeinsiva.</div>
                
                <div id="game-zone"></div>

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

        <div id="spotify-zone"></div>
    </div>

    <script>
        const socket = io();
        let currentActivityKey = "";
        let currentSpotifyKey = "";

        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            return Math.floor(s / 60) + ":" + (s % 60).toString().padStart(2, '0');
        }

        socket.on("presence", data => {
            const user = data.discord_user;

            // Banner Çekici
            const banner = document.getElementById("banner");
            if (user.banner) {
                const ext = user.banner.startsWith("a_") ? "gif" : "png";
                banner.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${user.banner}.\${ext}?size=1024\`;
                banner.style.display = "block";
            }

            // Avatar & Dekor
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            const decor = document.getElementById("decor");
            const d = user.avatar_decoration_data || user.avatar_decoration;
            if (d) {
                decor.src = d.asset ? \`https://cdn.discordapp.com/avatar-decoration-presets/\${d.asset}.png\` : d;
                decor.style.display = "block";
            }

            document.getElementById("status").className = "status-dot " + data.discord_status;

            // --- OYUN KONTROLÜ ---
            const gameZone = document.getElementById("game-zone");
            const game = data.activities.find(a => a.type === 0);
            if (game) {
                if (currentActivityKey !== game.name) {
                    let icon = "";
                    if (game.assets && game.assets.large_image) {
                        icon = game.assets.large_image.startsWith("mp:") ? 
                            "https://images-ext-1.discordapp.net/external/" + game.assets.large_image.split("https/")[1] :
                            \`https://cdn.discordapp.com/app-assets/\${game.application_id}/\${game.assets.large_image}.png\`;
                    }
                    const psIcon = game.name.toLowerCase().includes("playstation") ? '<i class="fa-brands fa-playstation" style="color:#00439c; margin-left:auto"></i>' : '';
                    
                    gameZone.innerHTML = \`
                        <div class="game-card">
                            <img src="\${icon || 'https://i.imgur.com/8Q9M99S.png'}" class="act-img">
                            <div class="act-text">
                                <div class="act-main">\${game.name}</div>
                                <div class="act-sub">\${game.details || 'Oynuyor'}</div>
                                <div class="time-counter" id="game-timer">00:00:00</div>
                            </div>
                            \${psIcon}
                        </div>\`;
                    currentActivityKey = game.name;
                }
                if (game.timestamps && game.timestamps.start) {
                    const elapsed = Date.now() - game.timestamps.start;
                    const h = Math.floor(elapsed / 3600000);
                    const m = Math.floor((elapsed % 3600000) / 60000);
                    const s = Math.floor((elapsed % 60000) / 1000);
                    const timerEl = document.getElementById("game-timer");
                    if (timerEl) timerEl.innerText = \`\${h > 0 ? h + ':' : ''}\${m.toString().padStart(2,'0')}:\${s.toString().padStart(2,'0')} süredir oynuyor\`;
                }
            } else { gameZone.innerHTML = ""; currentActivityKey = ""; }

            // --- SPOTIFY KONTROLÜ ---
            const spotZone = document.getElementById("spotify-zone");
            if (data.spotify) {
                if (currentSpotifyKey !== data.spotify.track_id) {
                    spotZone.innerHTML = \`
                        <div class="spotify-card">
                            <img src="\${data.spotify.album_art_url}" class="spot-img">
                            <div class="spot-info">
                                <div class="spot-title">\${data.spotify.song}</div>
                                <div class="spot-artist">\${data.spotify.artist}</div>
                                <div class="spot-progress-container">
                                    <span id="s-curr">0:00</span>
                                    <div class="p-bar"><div id="s-fill" class="p-fill"></div></div>
                                    <span id="s-end">0:00</span>
                                </div>
                            </div>
                            <i class="fa-brands fa-spotify" style="color:#1db954; font-size:24px; align-self:flex-start"></i>
                        </div>\`;
                    currentSpotifyKey = data.spotify.track_id;
                }
                const start = data.spotify.timestamps.start;
                const end = data.spotify.timestamps.end;
                const total = end - start;
                const progress = Math.min(((Date.now() - start) / total) * 100, 100);
                
                if (document.getElementById("s-fill")) document.getElementById("s-fill").style.width = progress + "%";
                if (document.getElementById("s-curr")) document.getElementById("s-curr").innerText = formatTime(Date.now() - start);
                if (document.getElementById("s-end")) document.getElementById("s-end").innerText = formatTime(total);
            } else { spotZone.innerHTML = ""; currentSpotifyKey = ""; }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);

