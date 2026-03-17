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
// ---------------

let db = { views: 0, likes: 0, lastSpotify: null, lastGame: null, messages: [] };
let cachedData = null;

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: token ${GITHUB_TOKEN}, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (!isUpdate && getRes) {
            db = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            return;
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Core Sync Update", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        if(cachedData.spotify) db.lastSpotify = cachedData.spotify;
        io.emit("presence", { ...cachedData, lastSpotify: db.lastSpotify });
    } catch (e) {}
}, 5000); // Ana veri 5 saniyede bir çekilir ama arayüz bağımsız akar.

syncWithGithub();

app.get("/api/like", async (req, res) => {
    db.likes++; await syncWithGithub(true);
    res.json({ success: true, likes: db.likes });
});

app.get("/api/view", async (req, res) => {
    db.views++; await syncWithGithub(true);
    res.json({ success: true, views: db.views });
});

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text) return;
        db.messages.unshift({ user: data.user, text: data.text, time: Date.now() });
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
        :root { --accent: #7289da; --bg: #030303; --card: rgba(18, 18, 18, 0.98); --text: #fff; --dev: #00d2ff; }
        [data-theme="light"] { --bg: #f8f9fa; --card: #ffffff; --text: #1a1a1a; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); display:flex; flex-direction:column; align-items:center; min-height:100vh; transition: 0.5s; }
        
        /* Container & Card */
        .wrapper { width:100%; max-width:420px; padding:100px 15px 40px; }
        .main-card { background:var(--card); border-radius:38px; border:1px solid rgba(255,255,255,0.05); overflow:hidden; position:relative; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        
        .banner { height:160px; width:100%; background-size:cover; background-position:center; }
        .avatar-area { position:relative; width:110px; height:110px; margin:-55px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); z-index:1; position:relative; }
        .decoration { position:absolute; inset:-12%; width:124%; z-index:2; pointer-events:none; }
        
        /* Spotify Bağımsız Tasarım */
        .spot-card { background:rgba(255,255,255,0.03); border-radius:24px; padding:18px; margin-bottom:15px; }
        .spot-bar-bg { height:4px; background:rgba(255,255,255,0.1); border-radius:10px; margin:12px 0 6px; position:relative; }
        .spot-bar-fill { height:100%; background:#1db954; width:0%; border-radius:10px; transition: width 0.1s linear; }
        .spot-time { display:flex; justify-content:space-between; font-size:10px; font-weight:800; opacity:0.5; font-family:monospace; }

        /* Mesajlar */
        .msg-section { background:var(--card); border-radius:32px; padding:25px; margin-top:20px; width:100%; border:1px solid rgba(255,255,255,0.05); }
        .msg-item { background:rgba(120,120,120,0.05); padding:12px 16px; border-radius:18px; margin-bottom:10px; animation: slideIn 0.4s ease; border-left: 3px solid var(--accent); }
        @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }

        .input-box { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:15px; padding:12px; color:var(--text); margin-bottom:10px; outline:none; transition: 0.3s; }
        .input-box:focus { border-color:var(--accent); background:rgba(255,255,255,0.06); }

        /* Butonlar */
        .nav-btns { position:fixed; top:25px; width:100%; max-width:420px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; }
        .circle-btn { width:52px; height:52px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); color:#777; transition:0.3s; cursor:pointer; }
        .circle-btn.liked { color:#ff4757; border-color:#ff4757; transform:scale(1.1); }
        
        .status-dot { position:absolute; bottom:8px; right:8px; width:22px; height:22px; border-radius:50%; border:4px solid var(--card); z-index:3; }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
        
        .social-icon { font-size:24px; transition:0.3s; text-align:center; text-decoration:none; }
        .social-icon:hover { transform:translateY(-3px); }
        .dev-color { color: var(--dev); }
    </style>
</head>
<body>
    <div class="nav-btns">
        <div class="circle-btn" id="like-btn"><i class="fa-solid fa-heart"></i></div>
        <div class="circle-btn" id="theme-btn"><i class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div id="u-banner" class="banner"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decoration" src="">
                    <div id="u-status" class="status-dot"></div>
                </div>
                <h2 id="u-name" style="margin:0; font-weight:800; letter-spacing:-0.5px;">Valeinsiva</h2>
                <div id="u-tag" style="font-size:12px; opacity:0.4; margin-bottom:20px;">@valeinsiva</div>

                <div id="spotify-engine"></div>
                <div id="game-engine"></div>

                <div style="display:flex; justify-content:center; gap:40px; margin:25px 0; border-top:1px solid rgba(255,255,255,0.05); padding-top:20px;">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-icon" style="color:var(--accent)"><i class="fa-brands fa-discord"></i><br><span style="font-size:9px;color:var(--text);opacity:0.4">Discord</span></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="social-icon" style="color:#E1306C"><i class="fa-brands fa-instagram"></i><br><span style="font-size:9px;color:var(--text);opacity:0.4">Instagram</span></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="social-icon dev-color"><i class="fa-solid fa-code"></i><br><span style="font-size:9px;color:var(--text);opacity:0.4">Developer</span></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; opacity:0.5; font-weight:600;">
                    <div><i class="fa-solid fa-eye"></i> <span id="view-count">0</span></div>
                    <div><i class="fa-solid fa-heart"></i> <span id="like-count">0</span></div>
                    <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
                </div>
            </div>
        </div>

        <div class="msg-section">
            <h3 style="margin:0 0 15px 0; font-size:16px;"><i class="fa-solid fa-feather-pointed"></i> İz Bırak</h3>
            <div id="msg-list"></div>
            <div style="margin-top:20px;">
                <input id="in-user" class="input-box" placeholder="İsminiz...">
                <textarea id="in-text" class="input-box" style="resize:none;" placeholder="Mesajınız..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:14px; border-radius:15px; cursor:pointer; font-weight:800;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let lanyard = null;
        let lastLike = 0;

        function timeAgo(ms) {
            const sec = Math.floor((Date.now() - ms) / 1000);
            if(sec < 60) return 'şimdi';
            const min = Math.floor(sec / 60);
            return \`\${min} dk önce\`;
        }

        function fmt(ms) {
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        socket.on("presence", data => {
            lanyard = data;
            const u = data.discord_user;
            
            // Nick & Font & Dekor Entegrasyonu
            document.getElementById("u-name").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            if(u.avatar_decoration_data) {
                document.getElementById("u-decor").src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                document.getElementById("u-decor").style.display = "block";
            } else {
                document.getElementById("u-decor").style.display = "none";
            }

            const banner = document.getElementById("u-banner");
            if(u.banner) {
                banner.style.backgroundImage = \`url(https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.png?size=600)\`;
            } else {
                banner.style.backgroundColor = u.banner_color || "#111";
            }

            document.getElementById("u-status").className = "status-dot " + data.discord_status;
            
            // Aktivite Motoru
            let spotHTML = "";
            const s = data.spotify || data.lastSpotify;
            if(s) {
                spotHTML = \`
                <div class="spot-card">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <img src="\${s.album_art_url}" style="width:50px; border-radius:12px; box-shadow:0 10px 20px rgba(0,0,0,0.3)">
                        <div style="text-align:left; overflow:hidden;">
                            <div style="font-size:10px; font-weight:800; color:#1db954;">SPOTIFY</div>
                            <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${s.song}</div>
                            <div style="font-size:11px; opacity:0.5;">\${s.artist}</div>
                        </div>
                    </div>
                    <div class="spot-bar-bg"><div id="s-fill" class="spot-bar-fill"></div></div>
                    <div class="spot-time"><span id="s-cur">00:00</span><span id="s-tot">00:00</span></div>
                </div>\`;
            }
            document.getElementById("spotify-engine").innerHTML = spotHTML;
        });

        // Saniyelik Bağımsız Motor
        setInterval(() => {
            if(lanyard?.spotify) {
                const total = lanyard.spotify.timestamps.end - lanyard.spotify.timestamps.start;
                const elapsed = Date.now() - lanyard.spotify.timestamps.start;
                const pct = Math.min((elapsed / total) * 100, 100);
                
                const fill = document.getElementById("s-fill");
                const cur = document.getElementById("s-cur");
                const tot = document.getElementById("s-tot");
                
                if(fill) fill.style.width = pct + "%";
                if(cur) cur.innerText = fmt(elapsed);
                if(tot) tot.innerText = fmt(total);
            }
        }, 1000);

        function sendMsg() {
            const u = document.getElementById('in-user').value;
            const t = document.getElementById('in-text').value;
            if(u && t) { socket.emit('send_msg', {user:u, text:t}); document.getElementById('in-text').value=''; }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-list").innerHTML = m.map(x => \`
                <div class="msg-item">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <b style="color:var(--accent); font-size:12px;">\${x.user}</b>
                        <span style="font-size:9px; opacity:0.4;">\${timeAgo(x.time)}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.8;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("like-btn").onclick = function() {
            if(Date.now() - lastLike < 3000) return;
            lastLike = Date.now();
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("like-count").innerText = d.likes;
                this.classList.add('liked');
            });
        };

        window.addEventListener('load', () => {
            fetch('/api/view').then(r=>r.json()).then(d => document.getElementById("view-count").innerText = d.views);
        });
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
