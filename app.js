const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = "Valeinsivaaa"; 
const REPO_NAME = "valeinsiva"; 
const FILE_PATH = "views.json";
const DISCORD_ID = "877946035408891945";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 
const DEFAULT_BANNER_URL = "https://i.ibb.co/VWV0pS8/banner.jpg";

let db = { views: 0, likes: 0, lastSpotify: null, lastGame: null, messages: [] };

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (getRes) {
            const remoteDb = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            if (!isUpdate) { db = remoteDb; return; }
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Elite Sync", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = r.data.data;
        
        // Spotify Kontrol
        if(data.spotify) db.lastSpotify = data.spotify;
        
        // Oyun Kontrol (Tip 0 olan ilk aktiviteyi oyun kabul et)
        const currentGame = data.activities.find(a => a.type === 0);
        if(currentGame) db.lastGame = {
            name: currentGame.name,
            details: currentGame.details,
            state: currentGame.state,
            start: currentGame.timestamps?.start,
            assets: currentGame.assets,
            application_id: currentGame.application_id
        };

        io.emit("presence", { 
            ...data, 
            lastSpotify: db.lastSpotify, 
            lastGame: db.lastGame,
            isGameActive: !!currentGame
        });
    } catch (e) {}
}, 2000);

syncWithGithub();

// API Endpoints
app.get("/api/stats", (req, res) => res.json({ views: db.views, likes: db.likes }));
app.get("/api/like", async (req, res) => { db.likes++; await syncWithGithub(true); res.json({ success: true, likes: db.likes }); });
app.get("/api/view", async (req, res) => { db.views++; await syncWithGithub(true); res.json({ success: true, views: db.views }); });

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text) return;
        db.messages.unshift({ user: data.user.substring(0,15), text: data.text.substring(0,80), time: Date.now() });
        db.messages = db.messages.slice(0, 5);
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Valeinsiva | Premium Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #030303; --card: rgba(12, 12, 12, 0.85); --text: #ffffff; }
        [data-theme="light"] { --bg: #f5f7f9; --card: rgba(255, 255, 255, 0.9); --text: #0a0a0a; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; }
        
        #loader { position: fixed; inset: 0; background: #030303; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: 0.8s; }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(114, 137, 218, 0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bg-animate { position: fixed; inset: 0; background: linear-gradient(-45deg, #030303, #0f0f12, #080808); background-size: 400% 400%; z-index: -1; animation: gradientBG 15s ease infinite; }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; }
        .main-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.06); overflow:hidden; position:relative; backdrop-filter: blur(20px); box-shadow: 0 40px 100px rgba(0,0,0,0.6); margin-bottom: 20px; }
        .banner { height:140px; width:100%; background: url('${DEFAULT_BANNER_URL}') center/cover no-repeat; }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); object-fit: cover; }

        /* Aktivite Kartları */
        .activity-box { padding: 0 15px 20px; display: flex; flex-direction: column; gap: 10px; }
        .act-card { border-radius: 20px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: left; display: flex; align-items: center; gap: 12px; position: relative; overflow: hidden; }
        
        .spotify-style { background: rgba(30, 215, 96, 0.05); border-color: rgba(30, 215, 96, 0.1); }
        .game-style { background: rgba(114, 137, 218, 0.05); border-color: rgba(114, 137, 218, 0.1); }

        .act-img { width: 50px; height: 50px; border-radius: 12px; object-fit: cover; }
        .act-info { flex: 1; overflow: hidden; }
        .act-label { font-size: 9px; font-weight: 900; letter-spacing: 1px; margin-bottom: 2px; }
        .act-name { font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-detail { font-size: 10px; opacity: 0.5; font-weight: 600; }

        .progress-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 10px; margin-top: 8px; overflow: hidden; width: 100%; }
        .progress-fill { height: 100%; transition: width 1s linear; }

        .social-grid { display:flex; justify-content:center; gap:25px; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.04); }
        .s-link { text-decoration:none; color:inherit; text-align:center; transition:0.3s; opacity: 0.7; }
        .s-link i { font-size:22px; display:block; margin-bottom:4px; }
        .s-desc { font-size:9px; font-weight:800; text-transform:uppercase; }

        .nav-bar { position:fixed; top:20px; width:100%; max-width:400px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; box-sizing:border-box; }
        .nav-btn { width:46px; height:46px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; color:#777; backdrop-filter: blur(10px); transition: 0.3s; }
        .nav-btn.liked { color: #ff4757; border-color: #ff4757; animation: beat 0.8s infinite alternate; }
        @keyframes beat { to { transform: scale(1.1); filter: drop-shadow(0 0 5px #ff4757); } }

        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:4px solid var(--card); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
    </style>
</head>
<body>
    <div id="loader"><div class="spinner"></div></div>
    <div class="bg-animate"></div>
    
    <div class="nav-bar">
        <div class="nav-btn" id="btn-like"><i class="fa-solid fa-heart"></i></div>
        <div class="nav-btn" id="btn-theme"><i id="theme-icon" class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div class="banner"></div>
            <div style="padding:0 20px 20px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:24px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:15px;">@developer.valeinsiva</div>

                <div class="activity-box" id="activity-list"></div>

                <div class="social-grid">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="s-link" style="color:var(--accent)">
                        <i class="fa-brands fa-discord"></i><span class="s-desc">Discord</span>
                    </a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="s-link" style="color:#E1306C">
                        <i class="fa-brands fa-instagram"></i><span class="s-desc">Social</span>
                    </a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="s-link" style="color:#00d2ff">
                        <i class="fa-solid fa-terminal"></i><span class="s-desc">Dev Panel</span>
                    </a>
                </div>
            </div>
        </div>

        <div id="msg-container" style="background:var(--card); border-radius:30px; padding:20px; border:1px solid rgba(255,255,255,0.06); backdrop-filter: blur(20px);">
             <h4 style="margin:0 0 12px 0; font-size:12px; opacity:0.5; letter-spacing:1px;">GELEN FISILTILAR</h4>
             <div id="msg-feed"></div>
             <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" placeholder="Sen kimsin?" style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px; color:white; margin-bottom:8px; outline:none; font-family:inherit;">
                <textarea id="in-text" placeholder="Mesajın..." style="width:100%; height:60px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px; color:white; resize:none; margin-bottom:10px; outline:none; font-family:inherit;"></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:12px; border-radius:12px; cursor:pointer; font-weight:800; font-size:11px;">GÖNDER</button>
             </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentData = null;

        window.addEventListener('load', () => {
            setTimeout(() => { document.getElementById('loader').style.display = 'none'; }, 1000);
        });

        function fmt(ms) {
            if(!ms || ms < 0) return "00:00";
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        socket.on("presence", data => {
            currentData = data;
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("u-status").className = "status-badge " + (data.discord_status || "offline");

            const list = document.getElementById("activity-list");
            let html = "";

            // 1. OYUN KARTI (Aktif veya Son Oynanan)
            const game = data.isGameActive ? data.lastGame : (data.discord_status === 'offline' || !data.activities.length ? data.lastGame : null);
            if(game) {
                const elapsed = game.start ? Math.floor((Date.now() - game.start)/1000/60) : 0;
                const timeText = data.isGameActive ? \`\${elapsed} dakikadır oynuyor\` : "Son Oynanan";
                const icon = game.application_id ? \`https://cdn.discordapp.com/app-icons/\${game.application_id}/\${game.assets?.large_image}.png\` : "https://i.ibb.co/6R0R9zY/gamepad.png";
                
                html += \`
                <div class="act-card game-style">
                    <img src="\${icon}" class="act-img" onerror="this.src='https://i.ibb.co/6R0R9zY/gamepad.png'">
                    <div class="act-info">
                        <div class="act-label" style="color:#7289da;">\${data.isGameActive ? 'OYUNDA' : 'GEÇMİŞ OYUN'}</div>
                        <div class="act-name">\${game.name}</div>
                        <div class="act-detail">\${timeText} • PS5</div>
                    </div>
                </div>\`;
            }

            // 2. SPOTIFY KARTI (Aktif veya Son Dinlenen)
            const spot = data.spotify ? data.spotify : data.lastSpotify;
            if(spot) {
                html += \`
                <div class="act-card spotify-style" style="flex-direction:column; align-items:flex-start;">
                    <div style="display:flex; gap:12px; align-items:center; width:100%;">
                        <img src="\${spot.album_art_url}" class="act-img">
                        <div class="act-info">
                            <div class="act-label" style="color:#1db954;">\${data.spotify ? 'SPOTIFY' : 'SON DİNLENEN'}</div>
                            <div class="act-name">\${spot.song}</div>
                            <div class="act-detail">\${spot.artist}</div>
                        </div>
                    </div>
                    \${data.spotify ? '<div class="progress-bar"><div id="s-fill" class="progress-fill" style="background:#1db954;"></div></div><div style="display:flex; justify-content:space-between; width:100%; font-size:9px; opacity:0.5; margin-top:4px;"><span id="s-cur">00:00</span><span id="s-tot">00:00</span></div>' : ''}
                </div>\`;
            }

            list.innerHTML = html;
        });

        // Spotify Progress Motoru
        setInterval(() => {
            if(currentData?.spotify) {
                const total = currentData.spotify.timestamps.end - currentData.spotify.timestamps.start;
                const elapsed = Date.now() - currentData.spotify.timestamps.start;
                const pct = Math.max(0, Math.min((elapsed / total) * 100, 100));
                const fill = document.getElementById("s-fill");
                if(fill) fill.style.width = pct + "%";
                if(document.getElementById("s-cur")) document.getElementById("s-cur").innerText = fmt(elapsed);
                if(document.getElementById("s-tot")) document.getElementById("s-tot").innerText = fmt(total);
            }
        }, 1000);

        function sendMsg() {
            if(localStorage.getItem('v_msg_sent')) return;
            const u = document.getElementById('in-user').value;
            const t = document.getElementById('in-text').value;
            if(u && t) { 
                socket.emit('send_msg', {user:u, text:t});
                localStorage.setItem('v_msg_sent', 'true');
                checkMsgStatus();
            }
        }

        function checkMsgStatus() {
            if(localStorage.getItem('v_msg_sent')) {
                document.getElementById('msg-form-area').innerHTML = '<div style="text-align:center; padding:12px; background:rgba(255,71,87,0.05); border-radius:10px; color:#ff4757; font-size:11px; font-weight:700;">Mesaj limitin doldu.</div>';
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => {
                const diff = Math.floor((Date.now() - x.time) / 1000);
                const timeStr = diff < 60 ? 'şimdi' : Math.floor(diff/60) + 'dk';
                return \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                        <b style="color:var(--accent); font-size:11px;">\${x.user}</b>
                        <span style="font-size:9px; opacity:0.3;">\${timeStr}</span>
                    </div>
                    <div style="font-size:12px; opacity:0.8;">\${x.text}</div>
                </div>\`;
            }).join('');
        }

        document.getElementById("btn-like").onclick = function() {
            if(localStorage.getItem('v_liked')) return;
            fetch('/api/like').then(r=>r.json()).then(d => {
                this.classList.add('liked');
                localStorage.setItem('v_liked', 'true');
            });
        };

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            const isDark = h.getAttribute("data-theme") === "dark";
            h.setAttribute("data-theme", isDark ? "light" : "dark");
            icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
        };

        window.onload = () => {
            fetch('/api/stats').then(r=>r.json());
            fetch('/api/view');
            checkMsgStatus();
            if(localStorage.getItem('v_liked')) document.getElementById('btn-like').classList.add('liked');
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
