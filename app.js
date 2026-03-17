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
const FILE_PATH = "data.json"; // Hem istatistik hem mesajlar burada tutulacak
const DISCORD_ID = "877946035408891945";
const BANNER_URL = "https://cdn.discordapp.com/attachments/938931634265280543/1476308554905555057/ce03e0dbed5f30cd6d5efb6d3c9aa441.png";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 
// ---------------

let db = { stats: { views: 0, likes: 0 }, messages: [] };
let cachedData = null;

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        
        if (!isUpdate && getRes) {
            db = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            return;
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💾 Data Update", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error"); }
}

syncWithGithub();

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        io.emit("presence", cachedData);
    } catch (e) {}
}, 2000);

app.get("/api/like", async (req, res) => {
    db.stats.likes++;
    res.json({ success: true, likes: db.stats.likes });
    await syncWithGithub(true); 
});

app.get("/api/view", async (req, res) => {
    db.stats.views++;
    await syncWithGithub(true);
    res.json({ success: true, views: db.stats.views });
});

// Soket Üzerinden Mesajlaşma
io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text) return;
        const newMsg = { user: data.user.substring(0,15), text: data.text.substring(0,50), date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) };
        db.messages.unshift(newMsg);
        db.messages = db.messages.slice(0, 5); // Sadece son 5 mesaj
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
    <title>Valeinsiva | Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --profile-color: #7289da; --bg-color: #030303; --card-bg: rgba(18, 18, 18, 0.95); --text-color: #fff; --accent: #5865F2; }
        [data-theme="light"] { --bg-color: #f8f9fa; --card-bg: rgba(255, 255, 255, 0.98); --text-color: #111; --accent: #404eed; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg-color); color:var(--text-color); display:flex; justify-content:center; align-items:center; min-height:100vh; overflow-x:hidden; transition: 0.4s; }
        .bg-wrap { position:fixed; inset:0; z-index:-1; pointer-events:none; }
        .orb { position:absolute; border-radius:50%; filter:blur(100px); opacity:0.15; background:var(--profile-color); will-change: transform; animation:move 25s infinite alternate ease-in-out; }
        @keyframes move { 0% { transform: translate3d(-10%, -10%, 0); } 100% { transform: translate3d(60%, 60%, 0); } }
        
        /* Layout */
        .container { display:flex; gap:20px; max-width:1000px; width:95%; padding:20px; align-items: flex-start; }
        
        /* DM Box */
        .dm-box { width:280px; background:var(--card-bg); border-radius:30px; border:1px solid rgba(255,255,255,0.05); padding:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .msg-item { background:rgba(120,120,120,0.05); padding:10px; border-radius:15px; margin-bottom:10px; font-size:12px; border-left: 3px solid var(--accent); animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(-10px); opacity:0; } to { transform: translateX(0); opacity:1; } }

        /* Main Card */
        .main-card { width:400px; background:var(--card-bg); border-radius:40px; border:1px solid rgba(255,255,255,0.08); box-shadow:0 30px 60px rgba(0,0,0,0.5); overflow:hidden; }
        .avatar-wrap { position:relative; width:110px; height:110px; margin:-55px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:6px solid var(--card-bg); object-fit:cover; }
        .status { position:absolute; bottom:8px; right:8px; width:22px; height:22px; border-radius:50%; border:4px solid var(--card-bg); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
        
        .card-alt { background:rgba(120,120,120,0.06); border-radius:20px; padding:12px; display:flex; align-items:center; gap:12px; margin-bottom:10px; border: 1px solid rgba(255,255,255,0.03); }
        .s-bar { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:8px; overflow:hidden; }
        .s-fill { height:100%; background:var(--accent); transition: width 0.6s ease; }
        
        /* Buttons */
        .btn-icon { width:50px; height:50px; background:var(--card-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid rgba(255,255,255,0.1); color: var(--text-color); transition:0.3s; }
        .btn-icon:hover { transform: scale(1.1); background: var(--accent); color:white; }
        .input-sm { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px; color:var(--text-color); margin-bottom:8px; font-family:inherit; outline:none; }
        
        @media (max-width: 850px) { .container { flex-direction: column; align-items: center; } .dm-box { width:400px; order: 2; } }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    
    <div style="position:fixed; top:25px; left:25px; right:25px; display:flex; justify-content:space-between; z-index:100;">
        <div class="btn-icon" onclick="toggleDM()"><i class="fa-solid fa-envelope"></i></div>
        <div class="btn-icon" id="theme-btn"><i class="fa-solid fa-moon"></i></div>
    </div>

    <div class="container">
        <div class="dm-box" id="dm-section">
            <h3 style="margin:0 0 15px 0; font-size:16px;"><i class="fa-solid fa-comments"></i> Mesaj Bırak</h3>
            <div id="msg-list" style="min-height:100px;"></div>
            <div style="margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05);">
                <input type="text" id="msg-user" class="input-sm" placeholder="Adınız...">
                <input type="text" id="msg-text" class="input-sm" placeholder="Mesajınız...">
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:10px; border-radius:10px; cursor:pointer; font-weight:bold;">Gönder</button>
            </div>
        </div>

        <div class="main-card">
            <div style="height:150px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-wrap">
                    <img id="avatar" class="avatar" src="https://ui-avatars.com/api/?name=V">
                    <div id="status" class="status offline"></div>
                </div>
                <h2 style="margin:0; font-weight:800; letter-spacing:-1px;">Valeinsiva</h2>
                <div style="font-size:13px; opacity:0.5; margin-bottom:20px;">@valeinsiva.</div>
                
                <div style="text-align:left; font-size:11px; opacity:0.4; margin-bottom:8px; font-weight:800; text-transform:uppercase;">Canlı Aktivite</div>
                <div id="act-stack"></div>

                <div style="display:flex; justify-content:center; gap:25px; margin:20px 0; padding:15px 0; border-top:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-link"><i class="fa-brands fa-discord fa-2xl"></i></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="social-link"><i class="fa-brands fa-instagram fa-2xl"></i></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="social-link"><i class="fa-solid fa-code fa-2xl"></i></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; opacity:0.5;">
                    <div onclick="like()" style="cursor:pointer;"><i class="fa-solid fa-heart"></i> <span id="like-count">${db.stats.likes}</span></div>
                    <div><i class="fa-solid fa-eye"></i> <span id="view-count">${db.stats.views}</span></div>
                    <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentPresence = null;

        // View Count Logic
        window.onload = () => {
            if(!sessionStorage.viewed) {
                fetch('/api/view').then(r => r.json()).then(d => {
                    document.getElementById('view-count').innerText = d.views;
                    sessionStorage.viewed = 1;
                });
            }
        };

        // Mesajlaşma
        function sendMsg() {
            const user = document.getElementById('msg-user').value;
            const text = document.getElementById('msg-text').value;
            if(user && text) {
                socket.emit('send_msg', {user, text});
                document.getElementById('msg-text').value = '';
            }
        }

        socket.on('init_messages', renderMessages);
        socket.on('new_msg', renderMessages);

        function renderMessages(msgs) {
            const list = document.getElementById('msg-list');
            list.innerHTML = msgs.map(m => \`
                <div class="msg-item">
                    <b style="color:var(--accent)">\${m.user}</b> <span style="opacity:0.4; font-size:9px; float:right;">\${m.date}</span><br>
                    \${m.text}
                </div>
            \`).join('') || '<div style="opacity:0.2; text-align:center; font-size:12px;">Henüz mesaj yok...</div>';
        }

        function like() {
            fetch('/api/like').then(r => r.json()).then(d => {
                document.getElementById('like-count').innerText = d.likes;
            });
        }

        // Lanyard Integration
        socket.on("presence", data => {
            const u = data.discord_user;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("status").className = "status " + data.discord_status;
            
            let actsHTML = "";
            
            // Spotify Card
            if(data.spotify) {
                actsHTML += \`
                <div class="card-alt">
                    <img src="\${data.spotify.album_art_url}" style="width:45px; border-radius:10px;">
                    <div style="flex:1; text-align:left; overflow:hidden;">
                        <div style="font-weight:800; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${data.spotify.song}</div>
                        <div style="font-size:10px; opacity:0.6;">\${data.spotify.artist}</div>
                        <div class="s-bar"><div id="spotify-bar" class="s-fill"></div></div>
                    </div>
                    <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px;"></i>
                </div>\`;
            }

            // Game Card
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                actsHTML += \`
                <div class="card-alt">
                    <div style="width:45px; height:45px; background:var(--accent); border-radius:10px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-gamepad" style="color:white;"></i>
                    </div>
                    <div style="flex:1; text-align:left;">
                        <div style="font-weight:800; font-size:12px;">\${game.name}</div>
                        <div id="game-duration" style="font-size:10px; opacity:0.6;">Oynuyor...</div>
                    </div>
                </div>\`;
            }

            document.getElementById("act-stack").innerHTML = actsHTML || '<div style="font-size:11px; opacity:0.3; padding:10px;">Şu an sessiz modda...</div>';
            currentPresence = data;
        });

        // Spotify Progress Logic
        setInterval(() => {
            if(currentPresence?.spotify) {
                const total = currentPresence.spotify.timestamps.end - currentPresence.spotify.timestamps.start;
                const elapsed = Date.now() - currentPresence.spotify.timestamps.start;
                const prog = Math.min((elapsed / total) * 100, 100);
                const bar = document.getElementById('spotify-bar');
                if(bar) bar.style.width = prog + "%";
            }
        }, 1000);

        // Theme Toggle
        document.getElementById("theme-btn").onclick = function() {
            const h = document.documentElement;
            const isDark = h.getAttribute("data-theme") === "dark";
            h.setAttribute("data-theme", isDark ? "light" : "dark");
            this.querySelector('i').className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
        };

        // Orbs
        const bg = document.getElementById('bg-canvas');
        for(let i=0; i<3; i++){
            let o = document.createElement('div'); o.className='orb';
            o.style.width='300px'; o.style.height='300px';
            o.style.left=Math.random()*80+'%'; o.style.top=Math.random()*80+'%';
            o.style.animationDelay=(i*5)+'s'; bg.appendChild(o);
        }
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
