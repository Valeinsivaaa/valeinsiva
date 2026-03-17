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
    } catch (e) { console.error("GitHub Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const cachedData = r.data.data;
        
        // Spotify verisini yedekle
        if(cachedData.spotify) db.lastSpotify = cachedData.spotify;
        
        // Oyun verisini (Type 0) bul ve yedekle
        const game = cachedData.activities.find(a => a.type === 0);
        if(game) db.lastGame = game;

        io.emit("presence", { 
            ...cachedData, 
            lastSpotify: db.lastSpotify, 
            lastGame: db.lastGame 
        });
    } catch (e) {}
}, 2000);

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
    <title>Valeinsiva | Premium Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #030303; --card: rgba(12, 12, 12, 0.85); --text: #ffffff; }
        [data-theme="light"] { --bg: #f5f7f9; --card: rgba(255, 255, 255, 0.9); --text: #0a0a0a; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
        
        #loader { position: fixed; inset: 0; background: #030303; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: 0.8s ease; }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(114, 137, 218, 0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bg-animate { position: fixed; inset: 0; background: linear-gradient(-45deg, #030303, #0f0f12, #050505); background-size: 400% 400%; z-index: -1; animation: gradientBG 15s ease infinite; }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; }
        .main-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.06); overflow:hidden; position:relative; backdrop-filter: blur(20px); box-shadow: 0 40px 100px rgba(0,0,0,0.6); }
        .banner { height:150px; width:100%; background: url('${DEFAULT_BANNER_URL}') center/cover no-repeat; transition: 0.5s; }
        
        .avatar-area { position:relative; width:105px; height:105px; margin:-52px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); object-fit: cover; }

        /* Kart Stilleri */
        .status-card { border-radius:22px; padding:15px; margin:0 20px 15px; border:1px solid rgba(255,255,255,0.05); text-align:left; }
        .spot-card { background:rgba(30, 215, 96, 0.05); border-color: rgba(30, 215, 96, 0.1); }
        .game-card { background:rgba(114, 137, 218, 0.05); border-color: rgba(114, 137, 218, 0.1); }
        
        .bar-bg { height:4px; background:rgba(255,255,255,0.08); border-radius:10px; margin:12px 0 6px; overflow:hidden; }
        .bar-fill { height:100%; background:var(--accent); width:0%; transition: width 1s linear; }
        .s-fill { background:#1db954; }
        .time-box { display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; opacity: 0.5; font-family: monospace; }

        .social-grid { display:flex; justify-content:center; gap:28px; margin:20px 0; padding-top:20px; border-top:1px solid rgba(255,255,255,0.04); }
        .s-link { text-decoration:none; color:inherit; text-align:center; transition:0.3s; opacity: 0.8; }
        .s-link:hover { opacity: 1; transform: translateY(-3px); }
        .s-link i { font-size:24px; display:block; margin-bottom:5px; }
        .s-desc { font-size:9px; font-weight:800; text-transform:uppercase; }

        .msg-container { background:var(--card); border-radius:30px; padding:20px; margin-top:20px; width:100%; box-sizing:border-box; border:1px solid rgba(255,255,255,0.06); backdrop-filter: blur(20px); }
        .msg-bubble { background:rgba(255,255,255,0.02); padding:12px; border-radius:18px; margin-bottom:10px; border-left:3px solid var(--accent); }

        .nav-bar { position:fixed; top:20px; width:100%; max-width:400px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; box-sizing:border-box; }
        .nav-btn { width:48px; height:48px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:0.4s; color:#777; backdrop-filter: blur(10px); }
        .nav-btn.liked { color: #ff4757 !important; border-color: #ff4757; animation: heartBeat 0.8s infinite alternate; }
        @keyframes heartBeat { to { transform: scale(1.15); filter: drop-shadow(0 0 8px #ff4757); } }

        .status-badge { position:absolute; bottom:6px; right:6px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card); }
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
            <div style="padding:0 20px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:24px; letter-spacing:-0.5px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:20px;">@developer.valeinsiva</div>

                <div id="activity-stack"></div>

                <div class="social-grid">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="s-link" style="color:var(--accent)">
                        <i class="fa-brands fa-discord"></i><span class="s-desc">Discord</span>
                    </a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="s-link" style="color:#E1306C">
                        <i class="fa-brands fa-instagram"></i><span class="s-desc">Social</span>
                    </a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="s-link" style="color:#00d2ff">
                        <i class="fa-solid fa-shapes"></i><span class="s-desc">Dev Panel</span>
                    </a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3; letter-spacing:1px;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-location-dot"></i> TR</span>
                </div>
            </div>
        </div>

        <div class="msg-container">
            <h4 style="margin:0 0 15px 0; font-size:13px; opacity:0.6; text-transform:uppercase;">Anonymous Feed</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" style="width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; color:white; margin-bottom:10px; outline:none;" placeholder="Adın nedir?">
                <textarea id="in-text" style="width:100%; height:70px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; color:white; resize:none; margin-bottom:10px; outline:none;" placeholder="Mesajını buraya bırak..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:14px; border-radius:14px; cursor:pointer; font-weight:800;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentData = null;

        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => document.getElementById('loader').style.display = 'none', 800);
            }, 1000);
        });

        function fmt(ms) {
            if(!ms || ms < 0) return "00:00";
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        function fmtFull(ms) {
            if(!ms || ms < 0) return "00:00:00";
            let s = Math.floor(ms / 1000);
            let h = Math.floor(s / 3600);
            s %= 3600;
            let m = Math.floor(s / 60);
            let sec = s % 60;
            return [h,m,sec].map(v => v.toString().padStart(2,'0')).join(':');
        }

        socket.on("presence", data => {
            currentData = data;
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("u-status").className = "status-badge " + (data.discord_status || "offline");
            
            let actsHTML = "";

            // 💎 OYUN KARTI (MAVİ)
            const game = data.activities.find(a => a.type === 0) || data.lastGame;
            if(game) {
                actsHTML += \`
                <div class="status-card game-card">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div style="width:45px; height:45px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-gamepad" style="color:white; font-size:20px;"></i>
                        </div>
                        <div>
                            <div style="font-size:9px; font-weight:900; color:var(--accent); letter-spacing:1px;">PLAYING A GAME</div>
                            <div style="font-size:13px; font-weight:800;">\${game.name}</div>
                            <div id="g-timer" style="font-size:10px; opacity:0.6; font-weight:bold;">\${data.activities.find(a => a.type === 0) ? '00:00:00' : 'Offline'}</div>
                        </div>
                    </div>
                </div>\`;
            }

            // 💎 SPOTIFY KARTI (YEŞİL)
            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                actsHTML += \`
                <div class="status-card spot-card">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <img src="\${spot.album_art_url}" style="width:45px; height:45px; border-radius:12px;">
                        <div style="overflow:hidden; flex:1;">
                            <div style="font-size:9px; font-weight:900; color:#1db954; letter-spacing:1px;">LISTENING ON SPOTIFY</div>
                            <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                            <div style="font-size:11px; opacity:0.5; font-weight:600;">\${spot.artist}</div>
                        </div>
                    </div>
                    \${data.spotify ? \`
                    <div class="bar-bg"><div id="s-fill" class="bar-fill s-fill"></div></div>
                    <div class="time-box"><span id="s-cur">00:00</span><span id="s-tot">00:00</span></div>\` : ''}
                </div>\`;
            }

            document.getElementById("activity-stack").innerHTML = actsHTML || '<div style="font-size:11px; opacity:0.2; padding:10px;">SESSİZ MOD</div>';
        });

        // 💎 BAĞIMSIZ AKIŞ MOTORU
        setInterval(() => {
            if(!currentData) return;

            // Spotify Barı
            if(currentData.spotify) {
                const total = currentData.spotify.timestamps.end - currentData.spotify.timestamps.start;
                const elapsed = Date.now() - currentData.spotify.timestamps.start;
                const pct = Math.max(0, Math.min((elapsed / total) * 100, 100));
                if(document.getElementById("s-fill")) document.getElementById("s-fill").style.width = pct + "%";
                if(document.getElementById("s-cur")) document.getElementById("s-cur").innerText = fmt(elapsed);
                if(document.getElementById("s-tot")) document.getElementById("s-tot").innerText = fmt(total);
            }

            // Oyun Sayacı
            const activeGame = currentData.activities.find(a => a.type === 0);
            if(activeGame && activeGame.timestamps?.start) {
                const elapsed = Date.now() - activeGame.timestamps.start;
                if(document.getElementById("g-timer")) document.getElementById("g-timer").innerText = fmtFull(elapsed) + " süredir";
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
                document.getElementById('msg-form-area').innerHTML = '<div style="text-align:center; padding:15px; background:rgba(255,71,87,0.08); border-radius:12px; color:#ff4757; font-size:11px; font-weight:800; border:1px solid rgba(255,71,87,0.2);">Mesaj limitin doldu!</div>';
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <b style="color:var(--accent); font-size:11px;">\${x.user}</b>
                        <span style="font-size:9px; opacity:0.3;">\${new Date(x.time).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style="font-size:12px; opacity:0.8;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("btn-like").onclick = function() {
            if(localStorage.getItem('v_liked')) return;
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                this.classList.add('liked');
                localStorage.setItem('v_liked', 'true');
            });
        };

        // 💎 Animasyonlu Tema Geçişi
        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            icon.style.transform = 'rotate(360deg) scale(0)';
            setTimeout(() => {
                const isDark = h.getAttribute("data-theme") === "dark";
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                icon.style.transform = 'rotate(0deg) scale(1)';
            }, 300);
        };

        window.onload = () => {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                document.getElementById("view-txt").innerText = d.views;
            });
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
