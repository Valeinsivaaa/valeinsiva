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
const DEFAULT_BANNER_URL = "BURAYA_BANNER_LINKINI_YAPISTIR"; // Sabit banner linkin

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
    } catch (e) { console.error("GitHub Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const cachedData = r.data.data;
        if(cachedData.spotify) db.lastSpotify = cachedData.spotify;
        const game = cachedData.activities.find(a => a.type === 0);
        if(game) db.lastGame = game;
        io.emit("presence", { ...cachedData, lastSpotify: db.lastSpotify, lastGame: db.lastGame });
    } catch (e) {}
}, 5000);

syncWithGithub();

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
    <title>Valeinsiva | Premium</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(15, 15, 15, 0.8); --text: #ffffff; }
        [data-theme="light"] { --bg: #f8f9fa; --card: rgba(255, 255, 255, 0.9); --text: #121212; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
        .bg-animate { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(-45deg, #050505, #121212, #0a0a0a, #1a1a1a); background-size: 400% 400%; z-index: -1; animation: gradientBG 15s ease infinite; }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; }
        .main-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative; backdrop-filter: blur(15px); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .banner { height:150px; width:100%; background: url('${DEFAULT_BANNER_URL}') center/cover no-repeat; }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); object-fit: cover; }
        .decoration { position:absolute; inset:-12%; width:124%; z-index:3; pointer-events:none; }

        .spot-card { background:rgba(30, 215, 96, 0.08); border-radius:20px; padding:12px; margin:0 20px 15px; border:1px solid rgba(30, 215, 96, 0.1); }
        .bar-bg { height:4px; background:rgba(255,255,255,0.1); border-radius:10px; margin:10px 0 5px; }
        .bar-fill { height:100%; background:#1db954; width:0%; border-radius:10px; transition: 0.5s linear; }

        .social-grid { display:flex; justify-content:center; gap:25px; margin:20px 0; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05); }
        .s-link { text-decoration:none; color:inherit; text-align:center; transition:0.3s; }
        .s-link i { font-size:22px; display:block; margin-bottom:4px; }
        .s-desc { font-size:9px; font-weight:700; opacity:0.5; text-transform:uppercase; }

        .msg-container { background:var(--card); border-radius:30px; padding:20px; margin-top:20px; width:100%; box-sizing:border-box; border:1px solid rgba(255,255,255,0.08); backdrop-filter: blur(15px); }
        .msg-bubble { background:rgba(255,255,255,0.03); padding:12px; border-radius:18px; margin-bottom:10px; border-left:3px solid var(--accent); }
        .input-field { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px; color:var(--text); margin-bottom:8px; outline:none; font-family:inherit; box-sizing:border-box; font-size:13px; }

        .nav-bar { position:fixed; top:20px; width:100%; max-width:400px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; box-sizing:border-box; }
        .nav-btn { width:48px; height:48px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:0.4s; color:#888; }
        
        /* Beğeni Animasyonu */
        .nav-btn.liked { color: #ff4757; border-color: #ff4757; animation: heartBeat 0.8s infinite alternate; }
        @keyframes heartBeat { to { transform: scale(1.1); box-shadow: 0 0 15px rgba(255, 71, 87, 0.4); } }

        .theme-rotate { animation: rotateTheme 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes rotateTheme { from { transform: rotate(0deg) scale(1); } to { transform: rotate(360deg) scale(0); } }

        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="nav-bar">
        <div class="nav-btn" id="btn-like"><i class="fa-solid fa-heart"></i></div>
        <div class="nav-btn" id="btn-theme"><i id="theme-icon" class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div class="banner"></div>
            <div style="padding:0 20px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="https://via.placeholder.com/150">
                    <img id="u-decor" class="decoration" src="">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:22px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:15px;">@valeinsiva.</div>

                <div id="spot-area"></div>

                <div class="social-grid">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="s-link" style="color:var(--accent)">
                        <i class="fa-brands fa-discord"></i><span class="s-desc">Discord</span>
                    </a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="s-link" style="color:#E1306C">
                        <i class="fa-brands fa-instagram"></i><span class="s-desc">Instagram</span>
                    </a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="s-link" style="color:#00d2ff">
                        <i class="fa-solid fa-shapes"></i><span class="s-desc">Bot Panel</span>
                    </a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:10px; font-weight:800; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-earth-americas"></i> TR</span>
                </div>
            </div>
        </div>

        <div class="msg-container">
            <h4 style="margin:0 0 12px 0; font-size:13px; opacity:0.5;"><i class="fa-solid fa-comment-dots"></i> Fısıltılar</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" class="input-field" placeholder="Sizi tanıyabilmem için bir nick?">
                <textarea id="in-text" class="input-field" style="height:60px; resize:none;" placeholder="Bir şeyler yazın..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:12px; border-radius:12px; cursor:pointer; font-weight:800; font-size:12px;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentData = null;

        function refreshStats() {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                document.getElementById("view-txt").innerText = d.views;
            });
        }

        if(localStorage.getItem('v_liked')) document.getElementById('btn-like').classList.add('liked');
        if(localStorage.getItem('v_msg_sent')) checkMsgStatus();

        function checkMsgStatus() {
            if(localStorage.getItem('v_msg_sent')) {
                document.getElementById('msg-form-area').innerHTML = '<div style="text-align:center; padding:10px; background:rgba(255,71,87,0.1); border-radius:10px; color:#ff4757; font-size:11px; font-weight:700; border:1px solid rgba(255,71,87,0.2);">Bu oturumda mesaj gönderme hakkınız dolmuştur.</div>';
            }
        }

        socket.on("presence", data => {
            currentData = data;
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("u-status").className = "status-badge " + (data.discord_status || "offline");
            
            if(u.avatar_decoration_data) {
                document.getElementById("u-decor").src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                document.getElementById("u-decor").style.display = "block";
            }

            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                document.getElementById("spot-area").innerHTML = \`
                <div class="spot-card">
                    <div style="display:flex; gap:10px; align-items:center; text-align:left;">
                        <img src="\${spot.album_art_url}" style="width:45px; height:45px; border-radius:12px;">
                        <div style="overflow:hidden;">
                            <div style="font-size:9px; font-weight:800; color:#1db954;">\${data.spotify ? 'DİNLENİYOR' : 'SON DUYULAN'}</div>
                            <div style="font-size:12px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\ squot;\${spot.song}\squot;</div>
                            <div style="font-size:10px; opacity:0.5;">\${spot.artist}</div>
                        </div>
                    </div>
                    <div class="bar-bg"><div id="s-fill" class="bar-fill"></div></div>
                </div>\`;
            }
        });

        setInterval(() => {
            if(currentData?.spotify) {
                const total = currentData.spotify.timestamps.end - currentData.spotify.timestamps.start;
                const elapsed = Date.now() - currentData.spotify.timestamps.start;
                const pct = Math.max(0, Math.min((elapsed / total) * 100, 100));
                if(document.getElementById("s-fill")) document.getElementById("s-fill").style.width = pct + "%";
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

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => {
                const diff = Math.floor((Date.now() - x.time) / 1000);
                const timeStr = diff < 60 ? 'şimdi' : Math.floor(diff/60) + ' dk önce';
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
                document.getElementById("like-txt").innerText = d.likes;
                this.classList.add('liked');
                localStorage.setItem('v_liked', 'true');
            });
        };

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            icon.classList.add('theme-rotate');
            setTimeout(() => {
                const isDark = h.getAttribute("data-theme") === "dark";
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                icon.classList.remove('theme-rotate');
            }, 500);
        };

        window.onload = () => {
            refreshStats();
            fetch('/api/view').then(r=>r.json()).then(d => document.getElementById("view-txt").innerText = d.views);
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
