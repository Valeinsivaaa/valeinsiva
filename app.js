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
const BANNER_URL = "https://cdn.discordapp.com/attachments/938931634265280543/1476308554905555057/ce03e0dbed5f30cd6d5efb6d3c9aa441.png";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 

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
            await axios.put(url, { message: "💎 Auto-Sync", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("Sync Hatası"); }
}

// 5 Saniyede Bir Kontrol
setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = r.data.data;
        
        let changed = false;
        if (data.spotify) { db.lastSpotify = data.spotify; changed = true; }
        const game = data.activities.find(a => a.type === 0);
        if (game) { db.lastGame = game; changed = true; }

        if(changed) await syncWithGithub(true); // Veri değiştikçe JSON'u güncelle
        io.emit("presence", { ...data, lastSpotify: db.lastSpotify, lastGame: db.lastGame });
    } catch (e) {}
}, 5000);

syncWithGithub();

app.get("/api/stats", (req, res) => res.json({ views: db.views, likes: db.likes }));
app.get("/api/like", async (req, res) => { db.likes++; await syncWithGithub(true); res.json({ success: true, likes: db.likes }); });
app.get("/api/view", async (req, res) => { db.views++; await syncWithGithub(true); res.json({ success: true, views: db.views }); });

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text || data.text.length > 80) return;
        db.messages.unshift({ user: data.user.substring(0,15), text: data.text, time: Date.now() });
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Portfolio</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(15, 15, 15, 0.9); --text: #fff; }
        [data-theme="light"] { --bg: #f8f9fc; --card: rgba(255, 255, 255, 0.98); --text: #1a1a1a; }
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; }
        
        .nav-btn { position:fixed; top:25px; width:50px; height:50px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; z-index:1000; transition:0.3s; }
        .nav-btn.liked { color:#ff4757; border-color:#ff4757; }
        
        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; }
        .main-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative; backdrop-filter: blur(25px); }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:4px solid var(--card); object-fit: cover; }
        .decor-img { position:absolute; inset:-12%; width:124%; z-index:11; pointer-events:none; }
        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        .card-item { background:rgba(120,120,120,0.05); border-radius:20px; padding:12px 15px; display:flex; align-items:center; gap:12px; margin-bottom:10px; text-align:left; border:1px solid rgba(255,255,255,0.02); }
        .s-bar-bg { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:8px; overflow:hidden; }
        .s-bar-fill { height:100%; background:var(--accent); width:0%; transition: width 0.5s linear; }

        .social-btn { text-decoration:none; color:inherit; opacity:0.6; transition:0.3s; text-align:center; font-size:10px; flex:1; }
        .social-btn i { font-size: 24px; margin-bottom: 5px; display: block; }
        .social-btn:hover { opacity:1; color:var(--accent); transform:translateY(-2px); }

        .msg-section { background:var(--card); border-radius:30px; padding:20px; margin-top:20px; width:100%; box-sizing:border-box; border:1px solid rgba(255,255,255,0.08); }
        .msg-bubble { background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:15px; margin-bottom:10px; border-left:3px solid var(--accent); }
        .in-style { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; box-sizing:border-box; }
        
        #theme-icon { transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    </style>
</head>
<body>
    <div class="nav-btn" id="btn-like" style="left:25px;"><i class="fa-solid fa-heart"></i></div>
    <div class="nav-btn" id="btn-theme" style="right:25px;"><i id="theme-icon" class="fa-solid fa-moon"></i></div>

    <div class="wrapper">
        <div class="main-card">
            <div style="height:150px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 20px 20px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decor-img" style="display:none;">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:24px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:15px;">@valeinsiva</div>

                <div id="activity-stack"></div>

                <div style="display:flex; justify-content:space-between; margin:20px 0; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-btn"><i class="fa-brands fa-discord"></i><b>Discord</b></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="social-btn"><i class="fa-brands fa-instagram"></i><b>Instagram</b></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="social-btn"><i class="fa-solid fa-code-commit"></i><b>Geliştirici</b></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-location-dot"></i> TR</span>
                </div>
            </div>
        </div>

        <div class="msg-section">
            <h4 style="margin:0 0 12px 0; font-size:11px; opacity:0.4; text-transform:uppercase;">Anonim Mesajlar</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:10px;">
                <input id="in-user" class="in-style" maxlength="15" placeholder="Kullanıcı adınız">
                <textarea id="in-text" class="in-style" maxlength="80" style="height:60px; resize:none;" placeholder="Mesajınız..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:12px; border-radius:12px; cursor:pointer; font-weight:800;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let gameActive = false, gameStart = null, spotActive = false, spotRef = null;

        function timeSince(d) {
            const s = Math.floor((new Date() - d) / 1000);
            if (s < 60) return 'şimdi';
            if (s < 3600) return Math.floor(s/60) + 'dk önce';
            return Math.floor(s/3600) + 'sa önce';
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            const decor = document.getElementById("u-decor");
            const dData = u.avatar_decoration_data;
            if(dData) { decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${dData.asset}.png\`; decor.style.display="block"; }
            else { decor.style.display="none"; }
            
            document.getElementById("u-status").className = "status-badge " + data.discord_status;

            let html = "";
            const game = data.activities.find(a => a.type === 0);
            const isOnline = data.discord_status !== "offline";

            // Oyun Kartı
            const activeGame = game || data.lastGame;
            if(activeGame) {
                gameActive = !!game && isOnline;
                gameStart = gameActive ? (activeGame.timestamps?.start || Date.now()) : null;
                html += \`
                <div class="card-item">
                    <div style="width:45px; height:45px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fa-solid fa-gamepad fa-lg"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:9px; font-weight:900; color:var(--accent);">\${gameActive ? 'ŞU AN OYUNDA' : 'SON OYNANAN'}</div>
                        <div style="font-size:13px; font-weight:800;">\${activeGame.name}</div>
                        <div id="game-timer" style="font-size:10px; opacity:0.5;">\${gameActive ? 'Başlıyor...' : 'Çevrimdışı'}</div>
                    </div>
                </div>\`;
            }

            // Spotify Kartı
            const activeSpot = data.spotify || data.lastSpotify;
            if(activeSpot) {
                spotActive = !!data.spotify && isOnline;
                spotRef = spotActive ? data.spotify : null;
                html += \`
                <div class="card-item">
                    <img src="\${activeSpot.album_art_url}" style="width:45px; height:45px; border-radius:12px;">
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:9px; font-weight:900; color:#1db954;">\${spotActive ? 'SPOTIFY' : 'SON DİNLENEN'}</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${activeSpot.song}</div>
                        <div style="font-size:11px; opacity:0.5;">\${activeSpot.artist}</div>
                        \${spotActive ? '<div class="s-bar-bg"><div id="s-fill" class="s-bar-fill" style="background:#1db954"></div></div>' : ''}
                    </div>
                </div>\`;
            }
            document.getElementById("activity-stack").innerHTML = html;
        });

        function engine() {
            if(gameActive && gameStart) {
                const s = Math.floor((Date.now() - gameStart) / 1000);
                document.getElementById("game-timer").innerText = Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0') + " süredir";
            }
            if(spotActive && spotRef) {
                const pct = Math.min(((Date.now() - spotRef.timestamps.start) / (spotRef.timestamps.end - spotRef.timestamps.start)) * 100, 100);
                const fill = document.getElementById("s-fill");
                if(fill) fill.style.width = pct + "%";
            }
            document.querySelectorAll('.msg-time').forEach(el => { el.innerText = timeSince(parseInt(el.dataset.time)); });
            requestAnimationFrame(engine);
        }
        engine();

        function sendMsg() {
            if(sessionStorage.getItem('msg_sent')) return alert("Bu sekmeden sadece 1 mesaj gönderebilirsiniz!");
            const u = document.getElementById('in-user').value, t = document.getElementById('in-text').value;
            if(u && t) {
                socket.emit('send_msg', {user:u, text:t});
                sessionStorage.setItem('msg_sent', '1');
                document.getElementById('msg-form-area').innerHTML = "<p style='font-size:11px; color:gray;'>Mesajınız iletildi.</p>";
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:3px;">
                        <b style="color:var(--accent);">\${x.user}</b>
                        <span class="msg-time" data-time="\${x.time}">\${timeSince(x.time)}</span>
                    </div>
                    <div style="font-size:12px; opacity:0.8;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("btn-like").onclick = function() {
            if(localStorage.getItem('liked')) return;
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                this.classList.add('liked'); localStorage.setItem('liked', '1');
            });
        };

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            const isDark = h.getAttribute("data-theme") === "dark";
            icon.style.transform = "rotate(360deg) scale(0)";
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
            if(!sessionStorage.getItem('v')) { fetch('/api/view'); sessionStorage.setItem('v','1'); }
            if(localStorage.getItem('liked')) document.getElementById('btn-like').classList.add('liked');
            if(sessionStorage.getItem('msg_sent')) document.getElementById('msg-form-area').style.display="none";
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
