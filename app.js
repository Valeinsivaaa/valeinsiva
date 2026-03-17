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
// ---------------

let stats = { views: 0, likes: 0, lastSpotify: null, lastGame: null };
let cachedData = null;

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (!isUpdate && getRes) {
            const data = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            stats = { ...stats, ...data };
            return;
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(stats, null, 2)).toString('base64');
            await axios.put(url, { message: "📊 Data Update", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        
        // Son aktiviteyi kaydet (Sessiz mod için)
        if(cachedData.spotify) stats.lastSpotify = cachedData.spotify;
        const game = cachedData.activities.find(a => a.type === 0);
        if(game) stats.lastGame = game;

        io.emit("presence", { ...cachedData, lastSpotify: stats.lastSpotify, lastGame: stats.lastGame });
    } catch (e) {}
}, 2000);

syncWithGithub();

app.get("/api/like", async (req, res) => {
    stats.likes++;
    await syncWithGithub(true);
    res.json({ success: true, likes: stats.likes });
});

app.get("/api/view", async (req, res) => {
    stats.views++;
    await syncWithGithub(true);
    res.json({ success: true, views: stats.views });
});

app.get("/", (req, res) => {
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
        [data-theme="light"] { --bg: #f0f2f5; --card: rgba(255, 255, 255, 0.98); --text: #1a1a1a; --accent: #5865f2; }
        
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); display:flex; justify-content:center; align-items:center; min-height:100vh; overflow:hidden; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .bg-wrap { position:fixed; inset:0; z-index:-1; overflow:hidden; }
        .orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.15; background:var(--accent); will-change: transform; animation:move 20s infinite alternate ease-in-out; }
        @keyframes move { 0% { transform: translate3d(-10%, -10%, 0); } 100% { transform: translate3d(50%, 50%, 0); } }

        .main-card { 
            width:90%; max-width:400px; background:var(--card); border-radius:35px; 
            border:1px solid rgba(255,255,255,0.08); box-shadow:0 25px 50px rgba(0,0,0,0.5); 
            overflow:hidden; position:relative; z-index:10; transition: transform 0.3s ease;
        }

        /* Tema ve Kalp Butonları */
        .top-nav { position:fixed; top:20px; width:100%; display:flex; justify-content:space-between; padding:0 25px; z-index:100; }
        .btn-circle { 
            width:50px; height:50px; background:var(--card); border-radius:50%; 
            display:flex; align-items:center; justify-content:center; cursor:pointer; 
            border:1px solid rgba(255,255,255,0.1); color: #888; transition: 0.4s;
        }
        .btn-circle i { transition: 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
        .like-btn.liked { color: #ff4757; transform: scale(1.1); box-shadow: 0 0 15px rgba(255, 71, 87, 0.3); border-color: #ff4757; }
        .theme-toggle.sun i { transform: rotate(180deg) scale(1.2); color: #ff9f43; }

        .avatar-wrap { position:relative; width:100px; height:100px; margin:-50px auto 12px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); object-fit: cover; }
        .status { position:absolute; bottom:5px; right:5px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card); }

        /* Spotify & Game Cards */
        .act-card { 
            background:rgba(120,120,120,0.06); border-radius:22px; padding:12px; 
            display:flex; align-items:center; gap:12px; margin-bottom:10px; 
            border: 1px solid rgba(255,255,255,0.03); animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform: translateY(5px); } to { opacity:1; transform: translateY(0); } }
        
        .progress-bar { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:8px; overflow:hidden; }
        .progress-fill { height:100%; background:var(--accent); transition: width 1s linear; }

        /* Socials */
        .social-grid { display:flex; justify-content:center; gap:30px; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05); }
        .social-link { text-decoration:none; color:var(--text); opacity:0.5; transition:0.3s; font-size:10px; text-align:center; }
        .social-link:hover { opacity:1; transform:translateY(-3px); color:var(--accent); }

        @media (max-width: 480px) {
            .main-card { width: 95%; border-radius: 30px; }
            .top-nav { top: 15px; }
        }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    
    <div class="top-nav">
        <div class="btn-circle like-btn" id="like-btn"><i class="fa-solid fa-heart"></i></div>
        <div class="btn-circle theme-toggle" id="theme-btn"><i class="fa-solid fa-moon"></i></div>
    </div>

    <div class="main-card">
        <div style="height:140px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
        <div style="padding:0 20px 20px; text-align:center;">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar" src="https://ui-avatars.com/api/?name=V">
                <div id="status" class="status offline"></div>
            </div>
            <h2 style="margin:0; font-weight:800; font-size:22px;">Valeinsiva</h2>
            <div style="font-size:12px; opacity:0.4; margin-bottom:15px;">@valeinsiva.</div>
            
            <div id="act-stack"></div>

            <div class="social-grid">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-link"><i class="fa-brands fa-discord fa-2xl"></i><br><span style="display:block;margin-top:5px">Discord</span></a>
                <a href="${INSTAGRAM_LINK}" target="_blank" class="social-link"><i class="fa-brands fa-instagram fa-2xl"></i><br><span style="display:block;margin-top:5px">Instagram</span></a>
                <a href="${BOT_PANEL_LINK}" target="_blank" class="social-link"><i class="fa-solid fa-code fa-2xl"></i><br><span style="display:block;margin-top:5px">Developer</span></a>
            </div>

            <div style="margin-top:20px; font-size:10px; display:flex; justify-content:center; gap:15px; opacity:0.4;">
                <div><i class="fa-solid fa-eye"></i> <span id="view-count">${stats.views}</span></div>
                <div><i class="fa-solid fa-heart"></i> <span id="like-count">${stats.likes}</span></div>
                <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
            </div>
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
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("status").className = "status " + data.discord_status;

            let actsHTML = "";
            const activeSpotify = data.spotify || data.lastSpotify;
            const activeGame = data.activities.find(a => a.type === 0) || data.lastGame;

            if(activeSpotify) {
                actsHTML += \`
                <div class="act-card" style="border-left: 3px solid #1db954;">
                    <img src="\${activeSpotify.album_art_url}" style="width:48px; border-radius:10px;">
                    <div style="flex:1; text-align:left; overflow:hidden;">
                        <div style="font-weight:800; font-size:11px; color:#1db954;">\${data.spotify ? 'LISTENING NOW' : 'LAST PLAYED'}</div>
                        <div style="font-size:12px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${activeSpotify.song}</div>
                        <div class="progress-bar"><div id="spotify-bar" class="progress-fill" style="background:#1db954"></div></div>
                    </div>
                </div>\`;
            }

            if(activeGame) {
                actsHTML += \`
                <div class="act-card" style="border-left: 3px solid var(--accent);">
                    <div style="width:48px; height:48px; background:var(--accent); border-radius:10px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-gamepad" style="color:white; font-size:20px;"></i>
                    </div>
                    <div style="flex:1; text-align:left;">
                        <div style="font-weight:800; font-size:11px; color:var(--accent);">PLAYING</div>
                        <div style="font-size:12px; font-weight:bold;">\${activeGame.name}</div>
                        <div id="game-time" style="font-size:9px; opacity:0.5;">Aktivite bekleniyor...</div>
                    </div>
                </div>\`;
            }

            document.getElementById("act-stack").innerHTML = actsHTML || '<div style="font-size:11px; opacity:0.3; padding:15px;">SESSİZ MODDA</div>';
        });

        setInterval(() => {
            if(currentPresence?.spotify) {
                const total = currentPresence.spotify.timestamps.end - currentPresence.spotify.timestamps.start;
                const elapsed = Date.now() - currentPresence.spotify.timestamps.start;
                const prog = Math.min((elapsed / total) * 100, 100);
                if(document.getElementById('spotify-bar')) document.getElementById('spotify-bar').style.width = prog + "%";
            }
            const g = currentPresence?.activities?.find(a => a.type === 0);
            if(g?.timestamps && document.getElementById('game-time')) {
                const diff = Date.now() - g.timestamps.start;
                document.getElementById('game-time').innerText = formatTime(diff) + " süredir oynuyor";
            }
        }, 1000);

        // Spam Korumalı Like
        document.getElementById("like-btn").onclick = function() {
            const now = Date.now();
            if (now - lastLikeTime < 2000) return; // 2 saniye spam koruması
            lastLikeTime = now;

            if(!this.classList.contains('liked')) {
                fetch('/api/like').then(r => r.json()).then(d => {
                    document.getElementById('like-count').innerText = d.likes;
                    this.classList.add('liked');
                });
            }
        };

        // Animasyonlu Tema Değişimi
        document.getElementById("theme-btn").onclick = function() {
            const h = document.documentElement;
            const isDark = h.getAttribute("data-theme") === "dark";
            this.style.transform = "rotate(360deg)";
            
            setTimeout(() => {
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                this.classList.toggle('sun', !isDark);
                this.querySelector('i').className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                this.style.transform = "rotate(0deg)";
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
