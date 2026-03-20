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
const BANNER_URL = "https://cdn.discordapp.com/attachments/995368673172799618/1483558000172990717/ce03e0dbed5f30cd6d5efb6d3c9aa441.png?ex=69bb068e&is=69b9b50e&hm=49e2edec926aae5b8f73a686d89e4df9ef55fe48147ed53f53ae0b27bf70b8d6&";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 

const ADMIN_UA_KEY = "23078PND5G";

let db = { views: 0, likes: 0, messages: [], lastGame: null, lastSpotify: null, lastGameTime: "00:00:00" };

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (getRes) {
            const remoteDb = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            if (!isUpdate) { db = { ...db, ...remoteDb }; return; }
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Interaction & Animation Update", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = r.data.data;
        if (data.spotify) db.lastSpotify = data.spotify;
        const game = data.activities.find(a => a.type === 0);
        if (game) {
            db.lastGame = game;
            const start = game.timestamps?.start || Date.now();
            db.lastGameTime = fmtFull(Date.now() - start);
        }
        io.emit("presence", { ...data, lastSpotify: db.lastSpotify, lastGame: db.lastGame, lastGameTime: db.lastGameTime });
    } catch (e) {}
}, 4000);

function fmtFull(ms) {
    if(!ms || ms < 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

syncWithGithub();

app.get("/api/stats", (req, res) => res.json({ views: db.views, likes: db.likes }));
app.get("/api/like", async (req, res) => { db.likes++; await syncWithGithub(true); res.json({ success: true, likes: db.likes }); });

app.get("/api/view", async (req, res) => {
    const userAgent = req.headers['user-agent'] || "";
    if (userAgent.includes(ADMIN_UA_KEY) || req.query.admin === 'true') {
        return res.json({ success: true, admin: true, views: db.views });
    }
    db.views++;
    await syncWithGithub(true);
    res.json({ success: true, views: db.views });
});

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text || data.text.length > 80) return;
        const msgId = Date.now();
        db.messages.unshift({ id: msgId, user: data.user.substring(0,15), text: data.text, time: Date.now(), liked: false, reply: null });
        db.messages = db.messages.slice(0, 8);
        io.emit("new_msg", db.messages);
        await syncWithGithub(true);
    });

    socket.on("admin_like", async (id) => {
        const m = db.messages.find(x => x.id === id);
        if(m) { m.liked = true; io.emit("new_msg", db.messages); io.emit("action_notif", {id, type:'like'}); await syncWithGithub(true); }
    });

    socket.on("admin_reply", async (d) => {
        const m = db.messages.find(x => x.id === d.id);
        if(m) { m.reply = d.text; io.emit("new_msg", db.messages); io.emit("action_notif", {id:d.id, type:'reply'}); await syncWithGithub(true); }
    });
});

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Premium Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(18, 18, 18, 0.75); --text: #fff; }
        [data-theme="light"] { --bg: #f5f7fa; --card: rgba(255, 255, 255, 0.85); --text: #1a1a1a; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: background 0.5s ease; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; position: relative; }
        * { -webkit-tap-highlight-color: transparent; }

        .bg-wrap { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
        .orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.12; background: var(--accent); animation: float 20s infinite alternate linear; }
        @keyframes float { 0% { transform: translate(-5%, -5%); } 100% { transform: translate(30%, 20%); } }

        .wrapper { width:100%; max-width:400px; padding:110px 15px 40px; box-sizing:border-box; z-index: 10; }
        .glass-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.1); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: hidden; margin-bottom: 25px; }
        
        .nav-btn { position:absolute; top:25px; width:50px; height:50px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; z-index:1000; }
        #theme-icon { font-size: 20px; transition: 0.6s; }
        .rotate-out { transform: rotate(180deg) scale(0); opacity: 0; }

        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:4px solid var(--card); object-fit: cover; }
        .decor-img { position:absolute; inset:-12%; width:124%; z-index:11; pointer-events:none; }
        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); z-index:12; }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        .card-item { background:rgba(255,255,255,0.03); border-radius:22px; padding:15px; display:flex; align-items:center; gap:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.05); }
        .s-bar-bg { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:8px; overflow:hidden; }
        .s-bar-fill { height:100%; background:#1db954; width:0%; transition: width 0.5s linear; }

        .msg-bubble { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 20px; margin-bottom: 12px; position: relative; }
        .in-style { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:14px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; box-sizing:border-box; }
        
        .reply-box { margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); display:flex; gap:8px; align-items:center; }
        .admin-mini-pfp { width:22px; height:22px; border-radius:50%; border:1px solid var(--accent); }
        .admin-heart { position:absolute; top:12px; right:12px; color:#ff4757; font-size:12px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% {transform: scale(1);} 50% {transform: scale(1.3);} }

        /* YENİ: Bildirim ve Kalp Animasyonları */
        #admin-toast { position: fixed; top: -100px; left: 50%; transform: translateX(-50%); width: 85%; max-width: 320px; background: rgba(114, 137, 218, 0.3); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 15px; border-radius: 20px; z-index: 10000; transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        #admin-toast.active { top: 25px; }
        .toast-pfp { width: 35px; height: 35px; border-radius: 50%; border: 2px solid var(--accent); }

        .floating-heart { position: fixed; bottom: -50px; color: #ff4757; font-size: 24px; z-index: 9999; pointer-events: none; animation: floatUp 3s forwards ease-in; opacity: 0.8; }
        @keyframes floatUp { 0% { bottom: -50px; transform: translateX(0) rotate(0); opacity: 1; } 100% { bottom: 110vh; transform: translateX(var(--random-x)) rotate(360deg); opacity: 0; } }
        
        .adm-btn { font-size:9px; padding:4px 8px; border-radius:6px; border:none; background:rgba(255,255,255,0.1); color:white; cursor:pointer; margin-top:5px; margin-right:5px; }
    </style>
</head>
<body>
    <div id="admin-toast">
        <img id="toast-img" class="toast-pfp" src="">
        <div style="flex:1">
            <div id="toast-name" style="font-size:11px; font-weight:800; color:var(--accent);"></div>
            <div id="toast-msg" style="font-size:13px; font-weight:600;"></div>
        </div>
    </div>

    <div class="bg-wrap" id="orb-container"></div>
    <div style="position:absolute; width:100%; max-width:400px; height:0;">
        <div class="nav-btn" id="btn-like" style="left:20px;"><i class="fa-solid fa-heart"></i></div>
        <div class="nav-btn" id="btn-theme" style="right:20px;"><i id="theme-icon" class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="glass-card">
            <div style="height:140px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decor-img" style="display:none;">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:26px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:20px;">@valeinsiva</div>
                <div id="activity-stack"></div>
                <div style="display:flex; justify-content:space-between; margin:25px 0; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-brands fa-discord fa-xl"></i><br><span style="font-size:10px; opacity:0.6; font-weight:800;">Discord</span></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-brands fa-instagram fa-xl"></i><br><span style="font-size:10px; opacity:0.6; font-weight:800;">Instagram</span></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-solid fa-terminal fa-xl"></i><br><span style="font-size:10px; opacity:0.6; font-weight:800;">Bot Hub</span></a>
                </div>
                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                </div>
            </div>
        </div>

        <div class="glass-card" style="padding:25px;">
            <h4 style="margin:0 0 18px 0; font-size:11px; opacity:0.5; text-transform:uppercase;">Gelen Kutusu</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" class="in-style" maxlength="15" placeholder="İsminiz">
                <textarea id="in-text" class="in-style" maxlength="80" style="height:70px; resize:none;" placeholder="Bir mesaj bırak..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:15px; border-radius:18px; cursor:pointer; font-weight:800;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let gActive = false, gStart = null, sActive = false, sRef = null;
        let myMsgs = JSON.parse(localStorage.getItem('myMsgs') || '[]');
        const isAdmin = navigator.userAgent.includes("${ADMIN_UA_KEY}");
        let currentNick = "Valeinsiva";

        function getTimeAgo(ts) {
            const s = Math.floor((Date.now() - ts) / 1000);
            if (s < 60) return 'az önce';
            if (s < 3600) return Math.floor(s/60) + 'dk önce';
            return Math.floor(s/3600) + 'sa önce';
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            currentNick = u.global_name || u.username;
            document.getElementById("u-nick").innerText = currentNick;
            const pfp = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("u-avatar").src = pfp;
            document.getElementById("toast-img").src = pfp;
            document.getElementById("toast-name").innerText = currentNick;
            
            const decor = document.getElementById("u-decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display="block";
            } else decor.style.display="none";
            document.getElementById("u-status").className = "status-badge " + data.discord_status;

            let html = "";
            const game = data.activities.find(a => a.type === 0);
            const currGame = game || data.lastGame;
            if(currGame) {
                gActive = !!game && data.discord_status !== "offline";
                gStart = gActive ? (currGame.timestamps?.start || Date.now()) : null;
                html += \`
                <div class="card-item">
                    <div style="width:40px; height:40px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fa-solid fa-gamepad"></i></div>
                    <div style="flex:1; text-align:left;">
                        <div style="font-size:9px; font-weight:900; color:var(--accent);">\${gActive ? 'OYNANIYOR' : 'GEÇMİŞ'}</div>
                        <div style="font-size:13px; font-weight:800;">\${currGame.name}</div>
                        <div id="g-time" style="font-size:10px; opacity:0.5;">\${gActive ? '00:00:00' : (data.lastGameTime || '00:00:00')} süredir</div>
                    </div>
                </div>\`;
            }
            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                sActive = !!data.spotify && data.discord_status !== "offline";
                sRef = spot;
                html += \`
                <div class="card-item">
                    <img src="\${spot.album_art_url}" style="width:50px; height:50px; border-radius:12px;">
                    <div style="flex:1; text-align:left; overflow:hidden;">
                        <div style="font-size:9px; font-weight:900; color:#1db954;">\${sActive ? 'SPOTIFY' : 'SON DİNLENEN'}</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                        \${sActive ? \`<div class="s-bar-bg"><div id="s-fill" class="s-bar-fill"></div></div>\` : \`<div style="font-size:11px; opacity:0.5;">\${spot.artist}</div>\`}
                    </div>
                </div>\`;
            }
            document.getElementById("activity-stack").innerHTML = html;
        });

        // BİLDİRİM VE KALP TETİKLEYİCİ
        socket.on("action_notif", d => {
            if(myMsgs.includes(d.id)) {
                // Kalp uçur
                for(let i=0; i<15; i++) {
                    setTimeout(() => {
                        const h = document.createElement('i');
                        h.className = 'fa-solid fa-heart floating-heart';
                        h.style.left = Math.random() * 100 + 'vw';
                        h.style.setProperty('--random-x', (Math.random() * 200 - 100) + 'px');
                        document.body.appendChild(h);
                        setTimeout(() => h.remove(), 3000);
                    }, i * 150);
                }
                // Bildirim düşür
                const t = document.getElementById('admin-toast');
                document.getElementById('toast-msg').innerText = d.type === 'like' ? 'Mesajınızı beğendi!' : 'Mesajınıza yanıt verdi!';
                t.classList.add('active');
                setTimeout(() => t.classList.remove('active'), 5000);
            }
        });

        function sendMsg() {
            const u = document.getElementById('in-user').value, t = document.getElementById('in-text').value;
            if(u && t) {
                const tempId = Date.now();
                myMsgs.push(tempId);
                localStorage.setItem('myMsgs', JSON.stringify(myMsgs));
                socket.emit('send_msg', {user:u, text:t});
                document.getElementById('in-text').value = "";
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    \${x.liked ? '<i class="fa-solid fa-heart admin-heart"></i>' : ''}
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <b style="color:var(--accent); font-size:12px;">\${x.user}</b>
                        <span style="font-size:9px; opacity:0.5;">\${getTimeAgo(x.time)}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.9;">\${x.text}</div>
                    \${x.reply ? \`<div class="reply-box"><img src="\${document.getElementById('u-avatar').src}" class="admin-mini-pfp"><div style="font-size:11px; opacity:0.7;">\${x.reply}</div></div>\` : ''}
                    \${isAdmin ? \`<div>
                        <button class="adm-btn" onclick="socket.emit('admin_like', \${x.id})">Beğen</button>
                        <button class="adm-btn" onclick="const r=prompt('Yanıt:'); if(r) socket.emit('admin_reply',{id:\${x.id}, text:r})">Yanıtla</button>
                    </div>\` : ''}
                </div>\`).join('');
        }

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            const isDark = h.getAttribute("data-theme") === "dark";
            icon.classList.add("rotate-out");
            setTimeout(() => {
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                icon.classList.remove("rotate-out");
            }, 300);
        };

        window.onload = () => {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                document.getElementById("view-txt").innerText = d.views;
            });
            fetch('/api/view');
            const container = document.getElementById('orb-container');
            for(let i=0; i<2; i++) {
                const o = document.createElement('div');
                o.className = 'orb'; o.style.width = '250px'; o.style.height = '250px';
                o.style.left = (i*50) + '%'; o.style.top = (i*30) + '%';
                container.appendChild(o);
            }
        };

        function engine() {
            if(gActive && gStart) {
                const gEl = document.getElementById("g-time");
                if(gEl) {
                    const s = Math.floor((Date.now() - gStart) / 1000);
                    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
                    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
                    const secs = (s % 60).toString().padStart(2, '0');
                    gEl.innerText = \`\${hrs}:\${mins}:\${secs} süredir\`;
                }
            }
            if(sActive && sRef) {
                const total = sRef.timestamps.end - sRef.timestamps.start;
                const elapsed = Date.now() - sRef.timestamps.start;
                const fill = document.getElementById("s-fill");
                if(fill) fill.style.width = Math.min((elapsed / total) * 100, 100) + "%";
            }
            requestAnimationFrame(engine);
        }
        engine();
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
