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
const BANNER_URL = "https://cdn.discordapp.com/attachments/938931634265280543/1476308554905555057/ce03e0dbed5f30cd6d5efb6d3c9aa441.png"; // İstediğin link
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
            await axios.put(url, { message: "💎 Elite Sync", content: newContent, sha: sha }, { headers });
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
    <title>Valeinsiva | Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(15, 15, 15, 0.9); --text: #fff; }
        [data-theme="light"] { --bg: #f2f4f7; --card: rgba(255, 255, 255, 0.98); --text: #1a1a1a; }
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; display:flex; flex-direction:column; align-items:center; min-height:100vh; overflow-x:hidden; }
        
        /* Kalp Animasyonu */
        .nav-btn { position:fixed; top:25px; width:52px; height:52px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; z-index:1000; transition:0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: #777; }
        .nav-btn.liked { color: #ff4757 !important; border-color: #ff4757; transform: scale(1.1); box-shadow: 0 0 15px rgba(255, 71, 87, 0.4); animation: heartBeat 1.2s infinite; }
        @keyframes heartBeat { 0% { transform: scale(1.1); } 50% { transform: scale(1.2); } 100% { transform: scale(1.1); } }

        .wrapper { width:100%; max-width:400px; padding:80px 15px 40px; box-sizing:border-box; }
        .main-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative; backdrop-filter: blur(25px); }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:4px solid var(--card); object-fit: cover; }
        .decor-img { position:absolute; inset:-12%; width:124%; z-index:11; pointer-events:none; }
        
        /* Durum Renkleri */
        .status-badge { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); transition: 0.3s; }
        .online { background:#23a55a; box-shadow: 0 0 10px #23a55a; } 
        .idle { background:#f0b232; box-shadow: 0 0 10px #f0b232; } 
        .dnd { background:#f23f43; box-shadow: 0 0 10px #f23f43; } 
        .offline { background:#80848e; }

        .card-item { background:rgba(120,120,120,0.05); border-radius:22px; padding:15px; display:flex; align-items:center; gap:12px; margin-bottom:12px; text-align:left; border:1px solid rgba(255,255,255,0.02); }
        .s-bar-bg { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:8px; overflow:hidden; position: relative; }
        .s-bar-fill { height:100%; background:#1db954; width:0%; transition: none; }
        .s-time-row { display: flex; justify-content: space-between; font-size: 9px; opacity: 0.4; margin-top: 4px; font-family: monospace; }

        .in-style { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; box-sizing:border-box; transition: 0.3s; }
        .in-style:focus { border-color: var(--accent); background: rgba(255,255,255,0.08); }
        
        #theme-icon { transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    </style>
</head>
<body>
    <div class="nav-btn" id="btn-like" style="left:25px;"><i class="fa-solid fa-heart"></i></div>
    <div class="nav-btn" id="btn-theme" style="right:25px;"><i id="theme-icon" class="fa-solid fa-moon"></i></div>

    <div class="wrapper">
        <div class="main-card">
            <div style="height:150px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div style="padding:0 25px 25px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decor-img" style="display:none;">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:25px; letter-spacing:-0.5px;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:15px;">@valeinsiva</div>

                <div id="activity-stack"></div>

                <div style="display:flex; justify-content:space-between; margin:20px 0; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-brands fa-discord fa-xl"></i><br><span style="font-size:10px; opacity:0.6;">Discord</span></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-brands fa-instagram fa-xl"></i><br><span style="font-size:10px; opacity:0.6;">Instagram</span></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" style="text-decoration:none; color:inherit; flex:1;"><i class="fa-solid fa-laptop-code fa-xl"></i><br><span style="font-size:10px; opacity:0.6;">Geliştirici</span></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:900; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-location-dot"></i> TÜRKİYE</span>
                </div>
            </div>
        </div>

        <div style="background:var(--card); border-radius:30px; padding:20px; margin-top:20px; width:100%; box-sizing:border-box; border:1px solid rgba(255,255,255,0.08);">
            <h4 style="margin:0 0 15px 0; font-size:11px; opacity:0.4; text-transform:uppercase;">Gelen Kutusu</h4>
            <div id="msg-feed"></div>
            <div id="msg-form-area" style="margin-top:10px;">
                <input id="in-user" class="in-style" maxlength="15" placeholder="Sizi tanıyabilmek adına kullanıcı adınız">
                <textarea id="in-text" class="in-style" maxlength="80" style="height:65px; resize:none;" placeholder="Mesajınızı yazın..."></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:12px; border-radius:12px; cursor:pointer; font-weight:800; transition:0.3s;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let gActive = false, gStart = null, sActive = false, sRef = null;

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
                        <div id="g-time" style="font-size:10px; opacity:0.5;">\${gActive ? 'Yükleniyor...' : 'Çevrimdışı'}</div>
                    </div>
                </div>\`;
            }

            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                sActive = !!data.spotify && isOnline;
                // Sadece şarkı değişirse referansı güncelle ki bar atlamasın
                if(!sRef || sRef.track_id !== spot.track_id) sRef = spot;
                
                html += \`
                <div class="card-item">
                    <img src="\${spot.album_art_url}" style="width:48px; height:48px; border-radius:12px;">
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:9px; font-weight:900; color:#1db954;">\${sActive ? 'SPOTIFY' : 'SON DİNLENEN'}</div>
                        <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                        <div style="font-size:11px; opacity:0.5;">\${spot.artist}</div>
                        \${sActive ? \`
                            <div class="s-bar-bg"><div id="s-fill" class="s-bar-fill"></div></div>
                            <div class="s-time-row"><span id="s-cur">00:00</span><span id="s-end">00:00</span></div>
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
            requestAnimationFrame(engine);
        }
        engine();

        function sendMsg() {
            if(sessionStorage.getItem('sent')) return;
            const u = document.getElementById('in-user').value, t = document.getElementById('in-text').value;
            if(u && t) {
                socket.emit('send_msg', {user:u, text:t});
                sessionStorage.setItem('sent', '1');
                document.getElementById('msg-form-area').innerHTML = "<p style='font-size:11px; opacity:0.5;'>Mesajınız için teşekkürler!</p>";
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:2px;">
                        <b style="color:var(--accent);">\${x.user}</b>
                        <span style="opacity:0.3;">\${new Date(x.time).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div style="font-size:12px; opacity:0.8;">\${x.text}</div>
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
            if(sessionStorage.getItem('sent')) document.getElementById('msg-form-area').style.display="none";
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
