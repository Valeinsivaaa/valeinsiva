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
const BANNER_URL = "https://cdn.discordapp.com/attachments/938931634265280543/1476308554905555057/ce03e0dbed5f30cd6d5efb6d3c9aa441.png?ex=69b861fb&is=69b7107b&hm=f0dc11c4677d60906a28dc07b23da32d87633a0657edd91c206503113fcca4cc&";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 

// Veritabanı (Son aktiviteleri de artık burada saklıyoruz ki offline olunca gitmesin)
let db = { 
    views: 0, 
    likes: 0, 
    messages: [], 
    lastGame: null, 
    lastSpotify: null 
};

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
            await axios.put(url, { message: "💎 Elite Sync", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = r.data.data;
        
        // Aktiviteleri veritabanına yedekle (Çevrimdışı görünüm için)
        if (data.spotify) db.lastSpotify = data.spotify;
        const game = data.activities.find(a => a.type === 0);
        if (game) db.lastGame = game;

        io.emit("presence", { ...data, lastSpotify: db.lastSpotify, lastGame: db.lastGame });
    } catch (e) {}
}, 4000);

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Valeinsiva | Premium Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(15, 15, 15, 0.9); --text: #fff; }
        [data-theme="light"] { --bg: #f5f7f9; --card: rgba(255, 255, 255, 0.95); --text: #1a1a1a; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s ease; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
        
        #loader { position: fixed; inset: 0; background: #050505; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: 0.8s ease; }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(114, 137, 218, 0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.12; background:var(--accent); animation:move 20s infinite alternate ease-in-out; pointer-events:none; }
        @keyframes move { 0% { transform: translate(-10%, -10%); } 100% { transform: translate(40%, 40%); } }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; }
        .main-card { background:var(--card); border-radius:40px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative; backdrop-filter: blur(25px); box-shadow: 0 40px 100px rgba(0,0,0,0.6); }
        
        .avatar-area { position:relative; width:105px; height:105px; margin:-52px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); object-fit: cover; }
        .decor-img { position:absolute; inset:-15%; width:130%; z-index:11; pointer-events:none; }
        .status-badge { position:absolute; bottom:6px; right:6px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        /* Kartlar */
        .card-item { background:rgba(120,120,120,0.06); border-radius:22px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:12px; border: 1px solid rgba(255,255,255,0.03); text-align:left; }
        .s-bar-bg { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:10px; overflow:hidden; }
        .s-bar-fill { height:100%; background:var(--accent); width:0%; }

        .social-row { display:flex; justify-content:center; gap:30px; margin:20px 0; padding-top:20px; border-top:1px solid rgba(255,255,255,0.05); }
        .social-btn { text-decoration:none; color:inherit; opacity:0.6; transition:0.3s; text-align:center; font-size:10px; }
        .social-btn:hover { opacity:1; transform:translateY(-3px); color:var(--accent); }

        /* Mesajlar */
        .msg-section { background:var(--card); border-radius:35px; padding:20px; margin-top:20px; width:100%; box-sizing:border-box; border:1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); }
        .msg-bubble { background:rgba(255,255,255,0.02); padding:12px; border-radius:18px; margin-bottom:10px; border-left:3px solid var(--accent); }
        .in-style { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px; color:var(--text); margin-bottom:10px; outline:none; font-family: inherit; box-sizing: border-box; }
        
        /* Butonlar */
        .nav-btn { position:fixed; top:25px; width:52px; height:52px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; z-index:1000; transition: 0.4s; color: #777; }
        .nav-btn:hover { border-color: var(--accent); color: var(--accent); }
        .nav-btn.liked { color: #ff4757 !important; border-color: #ff4757; animation: heart-beat 0.8s infinite alternate; }
        @keyframes heart-beat { to { transform: scale(1.1); filter: drop-shadow(0 0 5px #ff4757); } }

        #theme-icon { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    </style>
</head>
<body>
    <div id="loader"><div class="spinner"></div></div>
    <div id="bg-canvas" style="position:fixed; inset:0; z-index:-1; pointer-events:none;"></div>
    
    <div class="nav-btn" id="btn-like" style="left:25px;"><i class="fa-solid fa-heart"></i></div>
    <div class="nav-btn" id="btn-theme" style="right:25px;"><i id="theme-icon" class="fa-solid fa-moon"></i></div>

    <div class="wrapper">
        <div class="main-card">
            <div style="height:160px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decor-img" style="display:none;">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:26px; letter-spacing:-0.5px;">Valeinsiva</h2>
                <div style="font-size:13px; opacity:0.4; margin-bottom:20px;">@valeinsiva</div>

                <div id="activity-stack"></div>

                <div class="social-row">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-btn"><i class="fa-brands fa-discord fa-2xl"></i><br><span style="display:block; margin-top:8px; font-weight:700;">Discord</span></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="social-btn"><i class="fa-brands fa-instagram fa-2xl"></i><br><span style="display:block; margin-top:8px; font-weight:700;">Instagram</span></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="social-btn"><i class="fa-solid fa-shield-halved fa-2xl"></i><br><span style="display:block; margin-top:8px; font-weight:700;">Developer</span></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3; margin-top:10px;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-location-dot"></i> TÜRKİYE</span>
                </div>
            </div>
        </div>

        <div class="msg-section">
            <h4 style="margin:0 0 15px 0; font-size:12px; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">Son Mesajlar</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" class="in-style" maxlength="15" placeholder="Kullanıcı adınız">
                <textarea id="in-text" class="in-style" maxlength="80" style="height:65px; resize:none;" placeholder="Mesajınızı buraya bırakın..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:14px; border-radius:15px; cursor:pointer; font-weight:800; transition:0.3s; box-shadow: 0 4px 15px rgba(114, 137, 218, 0.3);">MESAJI GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentP = null;
        let gameStart = null;
        let spotData = null;

        // Loader
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => document.getElementById('loader').style.display = 'none', 800);
            }, 1000);
        });

        function timeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 60) return 'şimdi';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return minutes + 'dk önce';
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return hours + 'sa önce';
            return Math.floor(hours / 24) + ' gün önce';
        }

        function fmt(ms) {
            if(!ms || ms < 0) return "00:00";
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        socket.on("presence", data => {
            if(!currentP || JSON.stringify(data.activities) !== JSON.stringify(currentP.activities) || data.discord_status !== currentP.discord_status) {
                renderUI(data);
            }
            currentP = data;
        });

        function renderUI(data) {
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            const decor = document.getElementById("u-decor");
            const decorUrl = u.avatar_decoration_data ? \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\` : null;
            if(decorUrl) { decor.src = decorUrl; decor.style.display = "block"; } else { decor.style.display = "none"; }
            
            document.getElementById("u-status").className = "status-badge " + data.discord_status;

            let html = "";
            const game = data.activities.find(a => a.type === 0) || data.lastGame;
            const isOffline = data.discord_status === "offline";

            if(game) {
                gameStart = isOffline ? null : (game.timestamps?.start || Date.now());
                html += \`
                <div class="card-item">
                    <div style="width:50px; height:50px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fa-solid fa-gamepad fa-xl"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:9px; font-weight:900; color:var(--accent); letter-spacing:1px; text-transform:uppercase;">\${isOffline ? 'SON OYNANAN' : 'ŞU AN OYUNDA'}</div>
                        <div style="font-size:13px; font-weight:800;">\${game.name}</div>
                        <div id="game-timer" style="font-size:10px; opacity:0.6; font-weight:bold;">\${isOffline ? 'Çevrimdışı' : '00:00 süredir'}</div>
                    </div>
                </div>\`;
            }

            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                spotData = isOffline ? null : spot;
                html += \`
                <div class="card-item">
                    <img src="\${spot.album_art_url}" style="width:50px; height:50px; border-radius:12px;">
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:9px; font-weight:900; color:#1db954; letter-spacing:1px; text-transform:uppercase;">\${isOffline ? 'SON DİNLENEN' : 'SPOTIFY'}</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                        <div style="font-size:11px; opacity:0.5;">\${spot.artist}</div>
                        \${!isOffline ? '<div class="s-bar-bg"><div id="s-fill" class="s-bar-fill" style="background:#1db954"></div></div>' : ''}
                    </div>
                </div>\`;
            }
            document.getElementById("activity-stack").innerHTML = html || '<div style="font-size:11px; opacity:0.2; padding:15px;">SESSİZ MOD</div>';
        }

        function engine() {
            const gTime = document.getElementById("game-timer");
            if(gTime && gameStart) { gTime.innerText = fmt(Date.now() - gameStart) + " süredir"; }

            if(spotData) {
                const total = spotData.timestamps.end - spotData.timestamps.start;
                const elapsed = Date.now() - spotData.timestamps.start;
                const pct = Math.min((elapsed / total) * 100, 100);
                const fill = document.getElementById("s-fill");
                if(fill) fill.style.width = pct + "%";
            }
            
            // Mesaj zamanlarını güncelle (X dk önce)
            document.querySelectorAll('.msg-time').forEach(el => {
                const time = parseInt(el.getAttribute('data-time'));
                el.innerText = timeAgo(time);
            });

            requestAnimationFrame(engine);
        }
        engine();

        function sendMsg() {
            if(localStorage.getItem('v_m_s')) return;
            const u = document.getElementById('in-user').value;
            const t = document.getElementById('in-text').value;
            if(u && t) {
                socket.emit('send_msg', {user:u, text:t});
                localStorage.setItem('v_m_s', 'true');
                checkLimit();
            }
        }

        function checkLimit() {
            if(localStorage.getItem('v_m_s')) {
                document.getElementById('msg-form-area').innerHTML = '<div style="text-align:center; padding:15px; background:rgba(255,71,87,0.08); border-radius:14px; color:#ff4757; font-size:11px; font-weight:800; border:1px solid rgba(255,71,87,0.2);">Bugünlük mesaj limitiniz doldu.</div>';
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
                        <b style="color:var(--accent);">\${x.user}</b>
                        <span class="msg-time" data-time="\${x.time}" style="opacity:0.3;">\${timeAgo(x.time)}</span>
                    </div>
                    <div style="font-size:12px; opacity:0.8; word-break: break-word;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("btn-like").onclick = function() {
            if(localStorage.getItem('v_l')) return;
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                this.classList.add('liked');
                localStorage.setItem('v_l', 'true');
            });
        };

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            icon.style.transform = 'rotate(360deg) scale(0)';
            setTimeout(() => {
                const isDark = h.getAttribute("data-theme") === "dark";
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                icon.style.transform = 'rotate(0deg) scale(1)';
                if(isDark) icon.style.color = "#f1c40f"; else icon.style.color = "#777";
            }, 300);
        };

        window.onload = () => {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                document.getElementById("view-txt").innerText = d.views;
            });
            if(!sessionStorage.getItem('v')) { fetch('/api/view'); sessionStorage.setItem('v','1'); }
            if(localStorage.getItem('v_l')) document.getElementById('btn-like').classList.add('liked');
            checkLimit();
            
            const bg = document.getElementById('bg-canvas');
            for(let i=0; i<3; i++){
                let o = document.createElement('div'); o.className='orb';
                o.style.width='300px'; o.style.height='300px';
                o.style.left=Math.random()*80+'%'; o.style.top=Math.random()*80+'%';
                o.style.animationDelay=(i*4)+'s'; bg.appendChild(o);
            }
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
