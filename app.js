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
const BANNER_URL = "https://cdn.discordapp.com/attachments/1475226794943844432/1483173406378561648/hhfhf.jpg?ex=69baf1e0&is=69b9a060&hm=055e79c39eac872b9a954a5e23d3cf66752b4ff23dc04cde077bba87e94e8fcf&";
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
            await axios.put(url, { message: "💎 Aesthetic Update", content: newContent, sha: sha }, { headers });
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
    <title>Valeinsiva | Premium Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(18, 18, 18, 0.75); --text: #fff; }
        [data-theme="light"] { --bg: #f5f7fa; --card: rgba(255, 255, 255, 0.85); --text: #1a1a1a; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; position: relative; }

        /* Hareketli Arka Plan */
        .bg-wrap { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; background: var(--accent); animation: float 25s infinite alternate ease-in-out; }
        @keyframes float { 0% { transform: translate(-10%, -10%) scale(1); } 100% { transform: translate(50%, 40%) scale(1.2); } }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; z-index: 10; }
        
        /* Glassmorphism Kartlar */
        .glass-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); box-shadow: 0 20px 50px rgba(0,0,0,0.4); overflow: hidden; margin-bottom: 25px; }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:4px solid var(--card); object-fit: cover; }
        .decor-img { position:absolute; inset:-12%; width:124%; z-index:11; pointer-events:none; }
        
        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); transition: 0.3s; }
        .online { background:#23a55a; box-shadow: 0 0 15px #23a55a; } .idle { background:#f0b232; box-shadow: 0 0 15px #f0b232; } .dnd { background:#f23f43; box-shadow: 0 0 15px #f23f43; } .offline { background:#80848e; }

        .card-item { background:rgba(255,255,255,0.03); border-radius:22px; padding:15px; display:flex; align-items:center; gap:12px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.05); }
        .s-bar-bg { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:8px; overflow:hidden; }
        .s-bar-fill { height:100%; background:#1db954; width:0%; transition: none; }

        /* Mesaj Kutusu Canlandırma */
        .msg-bubble { background: linear-gradient(135deg, rgba(114, 137, 218, 0.1), rgba(255, 255, 255, 0.02)); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 20px; margin-bottom: 12px; transition: 0.3s; }
        .msg-bubble:hover { transform: scale(1.02); background: rgba(114, 137, 218, 0.15); }
        .msg-time { font-size: 9px; opacity: 0.5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .in-style { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:14px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; box-sizing:border-box; }
        .in-style:focus { border-color: var(--accent); background: rgba(255,255,255,0.08); }

        .nav-btn { position:fixed; top:25px; width:52px; height:52px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; z-index:1000; transition:0.4s; color: #777; backdrop-filter: blur(10px); }
        .nav-btn.liked { color: #ff4757 !important; border-color: #ff4757; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(255, 71, 87, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); } }
    </style>
</head>
<body>
    <div class="bg-wrap" id="orb-container"></div>
    
    <div class="nav-btn" id="btn-like" style="left:25px;"><i class="fa-solid fa-heart"></i></div>
    <div class="nav-btn" id="btn-theme" style="right:25px;"><i id="theme-icon" class="fa-solid fa-moon"></i></div>

    <div class="wrapper">
        <div class="glass-card">
            <div style="height:150px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decor-img" style="display:none;">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:26px; letter-spacing:-1px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:20px;">@valeinsiva</div>

                <div id="activity-stack"></div>

                <div style="display:flex; justify-content:space-between; margin:25px 0; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-brands fa-discord fa-xl"></i><br><span style="font-size:10px; opacity:0.6; font-weight:800;">Discord</span></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-brands fa-instagram fa-xl"></i><br><span style="font-size:10px; opacity:0.6; font-weight:800;">Instagram</span></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-solid fa-terminal fa-xl"></i><br><span style="font-size:10px; opacity:0.6; font-weight:800;">Panel</span></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-location-dot"></i> TURKEY</span>
                </div>
            </div>
        </div>

        <div class="glass-card" style="padding:25px;">
            <h4 style="margin:0 0 18px 0; font-size:11px; opacity:0.5; text-transform:uppercase; letter-spacing:1.5px;">Gelen Kutusu</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:15px;">
                <input id="in-user" class="in-style" maxlength="15" placeholder="Kullanıcı adınız">
                <textarea id="in-text" class="in-style" maxlength="80" style="height:70px; resize:none;" placeholder="Mesajınızı buraya bırakın..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:15px; border-radius:18px; cursor:pointer; font-weight:800; transition:0.3s; box-shadow: 0 10px 20px rgba(114, 137, 218, 0.2);">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let gActive = false, gStart = null, sActive = false, sRef = null;

        // Dinamik Zaman Hesaplayıcı (1 dk önce, 5 sa önce vb.)
        function getTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);
            if (seconds < 60) return 'şimdi';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return minutes + ' dk önce';
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return hours + ' sa önce';
            return Math.floor(hours / 24) + ' gün önce';
        }

        function fmt(ms) {
            if(!ms || ms < 0) return "00:00";
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            const decor = document.getElementById("u-decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display="block";
            } else decor.style.display="none";
            
            document.getElementById("u-status").className = "status-badge " + data.discord_status;

            const isOnline = data.discord_status !== "offline";
            const game = data.activities.find(a => a.type === 0);
            
            let html = "";
            const currGame = game || data.lastGame;
            if(currGame) {
                gActive = !!game && isOnline;
                gStart = gActive ? (currGame.timestamps?.start || Date.now()) : null;
                html += \`
                <div class="card-item">
                    <div style="width:45px; height:45px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fa-solid fa-gamepad fa-lg"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:9px; font-weight:900; color:var(--accent);">\${gActive ? 'ŞU AN OYUNDA' : 'SON OYNANAN'}</div>
                        <div style="font-size:13px; font-weight:800;">\${currGame.name}</div>
                        <div id="g-time" style="font-size:10px; opacity:0.5;">\${gActive ? '00:00' : 'Çevrimdışı'}</div>
                    </div>
                </div>\`;
            }

            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                sActive = !!data.spotify && isOnline;
                if(!sRef || sRef.track_id !== spot.track_id) sRef = spot;
                html += \`
                <div class="card-item">
                    <img src="\${spot.album_art_url}" style="width:50px; height:50px; border-radius:12px;">
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:9px; font-weight:900; color:#1db954;">\${sActive ? 'SPOTIFY' : 'SON DİNLENEN'}</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                        <div style="font-size:11px; opacity:0.5;">\${spot.artist}</div>
                        \${sActive ? \`
                            <div class="s-bar-bg"><div id="s-fill" class="s-bar-fill"></div></div>
                            <div style="display:flex; justify-content:space-between; font-size:9px; opacity:0.4; margin-top:4px; font-family:monospace;"><span id="s-cur">00:00</span><span id="s-end">00:00</span></div>
                        \` : ''}
                    </div>
                </div>\`;
            }
            document.getElementById("activity-stack").innerHTML = html;
        });

        function engine() {
            if(gActive && gStart) {
                document.getElementById("g-time").innerText = fmt(Date.now() - gStart) + " süredir";
            }
            if(sActive && sRef) {
                const total = sRef.timestamps.end - sRef.timestamps.start;
                const elapsed = Date.now() - sRef.timestamps.start;
                const pct = Math.min((elapsed / total) * 100, 100);
                const fill = document.getElementById("s-fill");
                if(fill) {
                    fill.style.width = pct + "%";
                    document.getElementById("s-cur").innerText = fmt(elapsed);
                    document.getElementById("s-end").innerText = fmt(total);
                }
            }
            // Mesaj sürelerini her saniye güncelle
            document.querySelectorAll('.msg-time').forEach(el => {
                el.innerText = getTimeAgo(parseInt(el.dataset.time));
            });
            requestAnimationFrame(engine);
        }
        engine();

        function sendMsg() {
            if(sessionStorage.getItem('sent')) return;
            const u = document.getElementById('in-user').value, t = document.getElementById('in-text').value;
            if(u && t) {
                socket.emit('send_msg', {user:u, text:t});
                sessionStorage.setItem('sent', '1');
                document.getElementById('msg-form-area').innerHTML = "<p style='font-size:11px; opacity:0.5; font-weight:800;'>İletildi!</p>";
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <b style="color:var(--accent); font-size:12px;">\${x.user}</b>
                        <span class="msg-time" data-time="\${x.time}">\${getTimeAgo(x.time)}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.9; line-height:1.4;">\${x.text}</div>
                </div>\`).join('');
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
            const isD = h.getAttribute("data-theme") === "dark";
            icon.style.transform = "rotate(360deg) scale(0)";
            setTimeout(() => {
                h.setAttribute("data-theme", isD ? "light" : "dark");
                icon.className = isD ? "fa-solid fa-sun" : "fa-solid fa-moon";
                icon.style.transform = "rotate(0deg) scale(1)";
                icon.style.color = isD ? "#f1c40f" : "inherit";
            }, 300);
        };

        window.onload = () => {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                document.getElementById("view-txt").innerText = d.views;
            });
            if(!sessionStorage.getItem('v')) { fetch('/api/view'); sessionStorage.setItem('v','1'); }
            if(localStorage.getItem('L')) document.getElementById('btn-like').classList.add('liked');
            
            // Arka plan kürelerini oluştur
            const container = document.getElementById('orb-container');
            for(let i=0; i<3; i++) {
                const o = document.createElement('div');
                o.className = 'orb';
                o.style.width = (200 + Math.random()*200) + 'px';
                o.style.height = o.style.width;
                o.style.left = (Math.random()*80) + '%';
                o.style.top = (Math.random()*80) + '%';
                o.style.animationDelay = (i*5) + 's';
                container.appendChild(o);
            }
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
