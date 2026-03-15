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
            height: 100vh; overflow-y: auto; padding: 40px 0;
        }

        .bg-animate {
            position: fixed; inset: 0; z-index: -1;
            background: linear-gradient(125deg, #050505 0%, #0d0d1a 30%, #1a0b2e 70%, #050505 100%);
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

        /* Aktivite Alanları */
        #game-zone, #spotify-zone { margin-bottom: 20px; text-align: left; }

        /* Aktivite Kartı Temeli */
        .act-card {
            background: rgba(255, 255, 255, 0.03); border-radius: 20px;
            padding: 15px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.05); position: relative;
        }
        .act-img { width: 55px; height: 55px; border-radius: 12px; object-fit: cover; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .act-text { flex: 1; overflow: hidden; }
        .act-main { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #eee; }
        .act-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 3px; }
        .time-counter { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 5px; font-weight: 600; }

        /* Spotify Bar */
        .spotify-timer {
            display: flex; align-items: center; gap: 8px; margin-top: 8px;
            font-size: 10px; color: rgba(255,255,255,0.4);
        }
        .p-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
        .p-fill { height: 100%; background: #1db954; width: 0%; box-shadow: 0 0 10px #1db954; transition: width 1s linear; }

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
                <div id="spotify-zone"></div>

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
        let lastGameId = "";
        let lastSpotifyId = "";

        function formatHMS(ms) {
            const totalSec = Math.floor(ms / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            return (h > 0 ? h + ":" : "") + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
        }

        socket.on("presence", data => {
            const user = data.discord_user;

            // Banner Düzeltme
            const banner = document.getElementById("banner");
            if (user.banner) {
                const ext = user.banner.startsWith("a_") ? "gif" : "png";
                banner.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${user.banner}.\${ext}?size=1024\`;
                banner.onerror = () => { banner.src = \`https://cdn.discordapp.com/banners/\${user.id}/\${user.banner}.png?size=1024\`; };
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
            let gameHTML = "";
            let currentGameId = "none";
            const game = data.activities.find(a => a.type === 0);

            if (game) {
                currentGameId = game.name;
                const isPS = game.name.toLowerCase().includes("playstation") || (game.assets && game.assets.large_text && game.assets.large_text.toLowerCase().includes("playstation"));
                
                let iconHTML = "";
                if (game.assets && game.assets.large_image) {
                    const iconUrl = game.assets.large_image.startsWith("mp:") ? 
                        "https://images-ext-1.discordapp.net/external/" + game.assets.large_image.split("https/")[1] :
                        \`https://cdn.discordapp.com/app-assets/\${game.application_id}/\${game.assets.large_image}.png\`;
                    iconHTML = \`<img src="\${iconUrl}" class="act-img">\`;
                } else {
                    iconHTML = \`<div style="width:55px; height:55px; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px"><i class="fa-solid fa-gamepad"></i></div>\`;
                }
                
                gameHTML = \`
                    <div class="act-card">
                        \${iconHTML}
                        <div class="act-text">
                            <div class="act-main">\${game.name}</div>
                            <div class="act-sub">\${game.details || 'Oynuyor'}</div>
                            <div class="time-counter" id="game-time">00:00 süredir</div>
                        </div>
                        \${isPS ? '<i class="fa-brands fa-playstation" style="color:#00439c; font-size:20px; align-self:flex-start"></i>' : ''}
                    </div>\`;
            }

            if (lastGameId !== currentGameId) {
                gameZone.innerHTML = gameHTML;
                lastGameId = currentGameId;
            }

            // Canlı Oyun Süresi
            if (game && game.timestamps && game.timestamps.start) {
                const el = document.getElementById("game-time");
                if (el) el.innerText = formatHMS(Date.now() - game.timestamps.start) + " süredir oynuyor";
            }

            // --- SPOTIFY KONTROLÜ ---
            const spotifyZone = document.getElementById("spotify-zone");
            let spotifyHTML = "";
            let currentSpotifyId = "none";

            if (data.spotify) {
                currentSpotifyId = data.spotify.track_id;
                spotifyHTML = \`
                    <div class="act-card">
                        <img src="\${data.spotify.album_art_url}" class="act-img">
                        <div class="act-text">
                            <div class="act-main">\${data.spotify.song}</div>
                            <div class="act-sub">\${data.spotify.artist}</div>
                            <div class="spotify-timer">
                                <span id="s-curr">0:00</span>
                                <div class="p-bar"><div id="s-fill" class="p-fill"></div></div>
                                <span id="s-end">0:00</span>
                            </div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px; align-self:flex-start"></i>
                    </div>\`;
            }

            if (lastSpotifyId !== currentSpotifyId) {
                spotifyZone.innerHTML = spotifyHTML;
                lastSpotifyId = currentSpotifyId;
            }

            // Canlı Spotify Çubuğu
            if (data.spotify) {
                const start = data.spotify.timestamps.start;
                const total = data.spotify.timestamps.end - start;
                const elapsed = Math.min(Date.now() - start, total);
                const prog = (elapsed / total) * 100;
                
                const bar = document.getElementById("s-fill");
                const currTxt = document.getElementById("s-curr");
                const endTxt = document.getElementById("s-end");
                
                if (bar) bar.style.width = prog + "%";
                if (currTxt) currTxt.innerText = formatHMS(elapsed).replace(/^0:/, '');
                if (endTxt) endTxt.innerText = formatHMS(total).replace(/^0:/, '');
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000);
