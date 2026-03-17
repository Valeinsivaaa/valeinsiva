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
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (!isUpdate && getRes) {
            db = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            return;
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Profile Update", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        
        // Son aktiviteleri hafızaya al
        if(cachedData.spotify) db.lastSpotify = cachedData.spotify;
        const game = cachedData.activities.find(a => a.type === 0);
        if(game) db.lastGame = game;

        io.emit("presence", { ...cachedData, lastSpotify: db.lastSpotify, lastGame: db.lastGame });
    } catch (e) {}
}, 2000);

syncWithGithub();

app.get("/api/like", async (req, res) => {
    db.likes++;
    res.json({ success: true, likes: db.likes });
    await syncWithGithub(true); 
});

app.get("/api/view", async (req, res) => {
    db.views++;
    await syncWithGithub(true);
    res.json({ success: true, views: db.views });
});

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        if(!data.user || !data.text) return;
        db.messages.unshift({ user: data.user.substring(0,20), text: data.text.substring(0,100), date: new Date().toLocaleTimeString('tr-TR') });
        db.messages = db.messages.slice(0, 5);
        io.emit("new_msg", db.messages);
        await syncWithGithub(true);
    });
});

app.get("/", async (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Valeinsiva | Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(15, 15, 15, 0.95); --text: #fff; }
        [data-theme="light"] { --bg: #f0f2f5; --card: rgba(255, 255, 255, 0.98); --text: #1a1a1a; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); display:flex; flex-direction: column; align-items:center; min-height:100vh; overflow-x:hidden; transition: 0.5s; }
        .bg-wrap { position:fixed; inset:0; z-index:-1; pointer-events: none; }
        .orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.15; background:var(--accent); animation:move 20s infinite alternate ease-in-out; }
        @keyframes move { 0% { transform: translate(-10%, -10%); } 100% { transform: translate(50%, 50%); } }

        /* Mobil Uyumlu Container */
        .wrapper { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 80px 10px 20px; width: 100%; max-width: 400px; }

        .main-card { width:100%; background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative; z-index:10; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .banner-box { height:150px; width:100%; background-position: center; background-size: cover; }
        
        .avatar-wrap { position:relative; width:100px; height:100px; margin:-50px auto 12px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); }
        .status { position:absolute; bottom:5px; right:5px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card); }

        /* Eski Kod Spotify/PS Tasarımı */
        .card-act { background:rgba(120,120,120,0.08); border-radius:22px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:12px; }
        .s-bar { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:10px; overflow:hidden; }
        .s-fill { height:100%; background:var(--accent); transition: width 1s linear; }

        /* Mesaj Bölümü */
        .msg-box { width:100%; background:var(--card); border-radius:30px; padding:20px; border:1px solid rgba(255,255,255,0.08); }
        .input-pro { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; font-size: 13px; }
        
        /* Floating Buttons */
        .float-btns { position:fixed; top:20px; width:100%; max-width:400px; display:flex; justify-content:space-between; padding:0 20px; z-index:100; }
        .btn-round { width:48px; height:48px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid rgba(255,255,255,0.1); color:#888; transition: 0.3s; }
        .btn-round.liked { color:#ff4757 !important; border-color:#ff4757; }
        .theme-spin { transition: 0.5s; }

        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    
    <div class="float-btns">
        <div class="btn-round" id="like-btn"><i class="fa-solid fa-heart"></i></div>
        <div class="btn-round" id="theme-btn"><i class="fa-solid fa-moon theme-spin"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div id="banner-color" class="banner-box"></div>
            <div style="padding:0 20px 20px; text-align:center;">
                <div class="avatar-wrap">
                    <img id="avatar" class="avatar" src="">
                    <div id="status" class="status"></div>
                </div>
                <h2 style="margin:0; font-weight:800;">Valeinsiva</h2>
                <div style="font-size:12px; opacity:0.4; margin-bottom:20px;">@valeinsiva.</div>
                
                <div id="act-stack"></div>

                <div style="display:flex; justify-content:center; gap:30px; margin:20px 0; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="color:var(--accent); font-size:22px;"><i class="fa-brands fa-discord"></i></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" style="color:#E1306C; font-size:22px;"><i class="fa-brands fa-instagram"></i></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" style="color:#00d2ff; font-size:22px;"><i class="fa-solid fa-code"></i></a>
                </div>

                <div style="display:flex; justify-content:center; gap:20px; font-size:10px; opacity:0.5;">
                    <div><i class="fa-solid fa-eye"></i> <span id="view-count">${db.views}</span></div>
                    <div><i class="fa-solid fa-heart"></i> <span id="like-count">${db.likes}</span></div>
                    <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
                </div>
            </div>
        </div>

        <div class="msg-box">
            <h4 style="margin:0 0 15px 0; opacity:0.7; font-size:14px;"><i class="fa-solid fa-message"></i> Mesaj Bırak</h4>
            <div id="msg-list" style="margin-bottom:15px;"></div>
            <input type="text" id="msg-user" class="input-pro" placeholder="Sizi tanıyabilmek adına isminiz...">
            <textarea id="msg-text" class="input-pro" style="resize:none;" placeholder="Mesajınız..."></textarea>
            <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:10px; border-radius:12px; cursor:pointer; font-weight:600; font-size:13px;">Gönder</button>
        </div>
    </div>

    <script>
        const socket = io();
        let currentPresence = null;
        let lastLikeTime = 0;

        window.onload = () => {
            fetch('/api/view').then(r => r.json()).then(d => document.getElementById('view-count').innerText = d.views);
        };

        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60) + ":" + (s%60 < 10 ? "0"+(s%60) : s%60);
        }

        socket.on("presence", data => {
            currentPresence = data;
            const u = data.discord_user;
            
            // Banner Renk/Resim Ayarı
            const banner = document.getElementById("banner-color");
            if(u.banner) {
                banner.style.backgroundImage = \`url(https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.png?size=600)\`;
            } else {
                banner.style.backgroundColor = u.banner_color || "#111";
                banner.style.backgroundImage = "none";
            }

            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("status").className = "status " + data.discord_status;

            let actsHTML = "";
            const spot = data.spotify || data.lastSpotify;
            const game = data.activities.find(a => a.type === 0) || data.lastGame;

            if(spot) {
                actsHTML += \`
                <div class="card-act">
                    <img src="\${spot.album_art_url}" style="width:50px; border-radius:10px; animation: \${data.spotify ? 'spin 12s linear infinite' : 'none'};">
                    <div style="flex:1; text-align:left; overflow:hidden;">
                        <div style="font-weight:800; font-size:10px; color:#1db954;">\${data.spotify ? 'LISTENING NOW' : 'SON DİNLENEN'}</div>
                        <div style="font-size:12px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                        <div class="s-bar"><div id="spot-bar" class="s-fill" style="background:#1db954"></div></div>
                    </div>
                    <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px;"></i>
                </div>\`;
            }

            if(game && game.name !== "Henüz oyun oynanmadı") {
                actsHTML += \`
                <div class="card-act">
                    <div style="width:50px; height:50px; background:var(--accent); border-radius:10px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-gamepad" style="color:white; font-size:22px;"></i>
                    </div>
                    <div style="flex:1; text-align:left;">
                        <div style="font-weight:800; font-size:10px; color:var(--accent);">\${data.activities.find(a=>a.type===0) ? 'PLAYING NOW' : 'SON OYNANAN'}</div>
                        <div style="font-size:13px; font-weight:bold;">\${game.name}</div>
                        <div id="game-time" style="font-size:10px; opacity:0.5;">Aktivite süresi...</div>
                    </div>
                </div>\`;
            }
            document.getElementById("act-stack").innerHTML = actsHTML || '<div style="font-size:11px; opacity:0.2;">AKTİVİTE YOK</div>';
        });

        setInterval(() => {
            if(currentPresence?.spotify) {
                const total = currentPresence.spotify.timestamps.end - currentPresence.spotify.timestamps.start;
                const elapsed = Date.now() - currentPresence.spotify.timestamps.start;
                if(document.getElementById('spot-bar')) document.getElementById('spot-bar').style.width = Math.min((elapsed/total)*100, 100) + "%";
            }
            const g = currentPresence?.activities?.find(a => a.type === 0);
            if(g?.timestamps && document.getElementById('game-time')) {
                document.getElementById('game-time').innerText = formatTime(Date.now() - g.timestamps.start) + " süredir";
            }
        }, 1000);

        // Mesajlaşma
        function sendMsg() {
            const user = document.getElementById('msg-user').value;
            const text = document.getElementById('msg-text').value;
            if(user && text) { socket.emit('send_msg', {user, text}); document.getElementById('msg-text').value = ''; }
        }
        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(msgs) {
            document.getElementById('msg-list').innerHTML = msgs.map(m => \`
                <div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:10px; margin-bottom:5px; font-size:11px;">
                    <b style="color:var(--accent)">\${m.user}:</b> \${m.text}
                </div>\`).join('');
        }

        // Like & Tema
        document.getElementById("like-btn").onclick = function() {
            if(Date.now() - lastLikeTime < 3000) return;
            lastLikeTime = Date.now();
            fetch('/api/like').then(r => r.json()).then(d => {
                document.getElementById('like-count').innerText = d.likes;
                this.classList.add('liked');
            });
        };

        document.getElementById("theme-btn").onclick = function() {
            const h = document.documentElement;
            const isDark = h.getAttribute("data-theme") === "dark";
            const icon = this.querySelector('i');
            icon.style.transform = "rotate(360deg)";
            setTimeout(() => {
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                icon.className = isDark ? "fa-solid fa-sun theme-spin" : "fa-solid fa-moon theme-spin";
                icon.style.transform = "rotate(0deg)";
            }, 250);
        };

        const bg = document.getElementById('bg-canvas');
        for(let i=0; i<3; i++){
            let o = document.createElement('div'); o.className='orb';
            o.style.width='300px'; o.style.height='300px';
            o.style.left=Math.random()*80+'%'; o.style.top=Math.random()*80+'%';
            o.style.animationDelay=(i*4)+'s'; bg.appendChild(o);
        }
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
