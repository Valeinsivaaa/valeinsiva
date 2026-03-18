const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- AYARLAR ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = "Valeinsivaaa"; 
const REPO_NAME = "valeinsiva"; 
const FILE_PATH = "views.json";
const DISCORD_ID = "877946035408891945"; //
const BANNER_URL = "https://cdn.discordapp.com/attachments/995368673172799618/1483558000172990717/ce03e0dbed5f30cd6d5efb6d3c9aa441.png?ex=69bb068e&is=69b9b50e&hm=49e2edec926aae5b8f73a686d89e4df9ef55fe48147ed53f53ae0b27bf70b8d6&"; //
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; //
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; //

// Xiaomi 13T Pro Model Kodu
const ADMIN_MODEL_ID = "23078PND5G"; //

let db = { views: 0, likes: 0, messages: [], lastGame: null, lastSpotify: null };

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (getRes) {
            const remoteDb = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            if (!isUpdate) { db = remoteDb; return; }
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Aesthetic & Logo Update", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = r.data.data;
        if (data.spotify) db.lastSpotify = data.spotify;
        const game = data.activities.find(a => a.type === 0);
        if (game) db.lastGame = game;
        io.emit("presence", { ...data, lastSpotify: db.lastSpotify, lastGame: db.lastGame });
    } catch (e) {}
}, 4000);

syncWithGithub();

app.get("/api/stats", (req, res) => res.json({ views: db.views, likes: db.likes }));
app.get("/api/like", async (req, res) => { db.likes++; await syncWithGithub(true); res.json({ success: true, likes: db.likes }); });

app.get("/api/view", async (req, res) => {
    const userAgent = req.headers['user-agent'] || "";
    if (userAgent.includes(ADMIN_MODEL_ID)) return res.json({ success: true, views: db.views });
    db.views++;
    await syncWithGithub(true);
    res.json({ success: true, views: db.views });
});

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text || data.text.length > 80) return;
        db.messages.unshift({ user: data.user.substring(0,15), text: data.text, time: Date.now() });
        db.messages = db.messages.slice(0, 8);
        io.emit("new_msg", db.messages);
        await syncWithGithub(true);
    });
});

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(18, 18, 18, 0.75); --text: #fff; }
        [data-theme="light"] { --bg: #f5f7fa; --card: rgba(255, 255, 255, 0.85); --text: #1a1a1a; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: background 0.5s ease; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; z-index: 10; }
        .glass-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.1); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: hidden; margin-bottom: 25px; }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:4px solid var(--card); object-fit: cover; }
        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        .card-item { background:rgba(255,255,255,0.03); border-radius:22px; padding:15px; display:flex; align-items:center; gap:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.05); position: relative; }
        
        .ps-badge { position: absolute; top: 12px; right: 45px; font-size: 14px; opacity: 0.3; }
        .game-img { width:45px; height:45px; border-radius:12px; object-fit: cover; background: rgba(255,255,255,0.1); }

        .msg-bubble { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 20px; margin-bottom: 12px; animation: slideIn 0.4s ease; text-align: left; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .msg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .msg-user { color: var(--accent); font-weight: 800; font-size: 13px; }
        .msg-date { font-size: 10px; opacity: 0.4; font-weight: 600; }

        .nav-btn { position:fixed; top:25px; width:50px; height:50px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; z-index:1000; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .nav-btn:active { transform: scale(0.9); }
        
        .liked { color: #ff4757 !important; border-color: #ff4757 !important; animation: heartBeat 0.4s linear; }
        @keyframes heartBeat { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }

        .in-style { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:14px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; box-sizing:border-box; }
    </style>
</head>
<body>
    <div class="nav-btn" id="btn-like" style="left:20px;"><i class="fa-solid fa-heart"></i></div>
    <div class="nav-btn" id="btn-theme" style="right:20px;"><i id="theme-icon" class="fa-solid fa-moon"></i></div>

    <div class="wrapper">
        <div class="glass-card">
            <div style="height:140px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:26px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:20px;">@valeinsiva</div>

                <div id="activity-stack"></div>

                <div style="display:flex; justify-content:space-around; margin:25px 0; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="color:inherit;"><i class="fa-brands fa-discord fa-xl"></i></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" style="color:inherit;"><i class="fa-brands fa-instagram fa-xl"></i></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" style="color:inherit;"><i class="fa-solid fa-terminal fa-xl"></i></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-location-dot"></i> TURKEY</span>
                </div>
            </div>
        </div>

        <div class="glass-card" style="padding:25px;">
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" class="in-style" maxlength="15" placeholder="İsim">
                <textarea id="in-text" class="in-style" maxlength="80" style="height:60px; resize:none;" placeholder="Mesajın..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:15px; border-radius:18px; cursor:pointer; font-weight:800;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();

        function getTimeAgo(ts) {
            const diff = Math.floor((Date.now() - ts) / 1000);
            if (diff < 60) return 'şimdi';
            if (diff < 3600) return Math.floor(diff/60) + ' dk önce';
            if (diff < 86400) return Math.floor(diff/3600) + ' sa önce';
            return Math.floor(diff/86400) + ' gün önce';
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("u-status").className = "status-badge " + data.discord_status;

            let html = "";
            const game = data.activities.find(a => a.type === 0);
            const currGame = game || data.lastGame;
            
            if(currGame) {
                const gActive = !!game && data.discord_status !== "offline";
                let gameImg = "https://i.imgur.com/8QO9yC2.png";
                
                if (currGame.assets && currGame.assets.large_image) {
                    if (currGame.assets.large_image.startsWith("mp:external")) {
                        gameImg = \`https://media.discordapp.net/external/\${currGame.assets.large_image.split("mp:external/")[1]}\`;
                    } else {
                        gameImg = \`https://cdn.discordapp.com/app-assets/\${currGame.application_id}/\${currGame.assets.large_image}.png\`;
                    }
                } else {
                    gameImg = \`https://api.dicebear.com/7.x/initials/svg?seed=\${encodeURIComponent(currGame.name)}&backgroundColor=121212\`;
                }

                html += \`
                <div class="card-item">
                    <span class="material-icons ps-badge">videogame_asset</span>
                    <img src="\${gameImg}" class="game-img" onerror="this.src='https://i.imgur.com/8QO9yC2.png'">
                    <div style="flex:1; text-align:left;">
                        <div style="font-size:9px; font-weight:900; color:var(--accent); letter-spacing:1px;">\${gActive ? 'OYNANIYOR' : 'GEÇMİŞ'}</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${currGame.name}</div>
                        <div style="font-size:10px; opacity:0.5;">\${gActive ? 'PlayStation 5' : 'Çevrimdışı'}</div>
                    </div>
                    <i class="fa-brands fa-playstation fa-xl" style="opacity:0.8;"></i>
                </div>\`;
            }

            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                html += \`
                <div class="card-item">
                    <img src="\${spot.album_art_url}" class="game-img" style="border-radius:50%; animation: spin 10s linear infinite;">
                    <div style="flex:1; text-align:left;">
                        <div style="font-size:9px; font-weight:900; color:#1db954;">SPOTIFY</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                        <div style="font-size:10px; opacity:0.5;">\${spot.artist}</div>
                    </div>
                    <i class="fa-brands fa-spotify fa-xl" style="color:#1db954;"></i>
                </div>\`;
            }
            document.getElementById("activity-stack").innerHTML = html;
        });

        socket.on('init_messages', m => renderMsgs(m));
        socket.on('new_msg', m => renderMsgs(m));

        function renderMsgs(msgs) {
            document.getElementById("msg-feed").innerHTML = msgs.map(m => \`
                <div class="msg-bubble">
                    <div class="msg-header">
                        <span class="msg-user">\${m.user}</span>
                        <span class="msg-date">\${getTimeAgo(m.time)}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.8;">\${m.text}</div>
                </div>\`).join('');
        }

        function sendMsg() {
            const u = document.getElementById('in-user').value, t = document.getElementById('in-text').value;
            if(u && t) { socket.emit('send_msg', {user:u, text:t}); document.getElementById('in-text').value = ""; }
        }

        document.getElementById("btn-like").onclick = function() {
            if(localStorage.getItem('L')) return;
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                this.classList.add('liked'); localStorage.setItem('L', '1');
            });
        };

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            const isDark = h.getAttribute("data-theme") === "dark";
            icon.style.transform = "rotate(180deg) scale(0)";
            setTimeout(() => {
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                icon.style.transform = "rotate(0deg) scale(1)";
                icon.style.color = isDark ? "#f1c40f" : "inherit";
            }, 300);
        };

        window.onload = () => {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                document.getElementById("view-txt").innerText = d.views;
            });
            fetch('/api/view');
            if(localStorage.getItem('L')) document.getElementById('btn-like').classList.add('liked');
        };
    </script>
    <style> @keyframes spin { from {transform:rotate(0)} to {transform:rotate(360deg)} } </style>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
