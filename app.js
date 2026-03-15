const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cookieParser());

// --- AYARLAR ---
const DISCORD_ID = "877946035408891945";
const BANNER_URL = "https://cdn.discordapp.com/attachments/1475226794943844432/1482767286732328980/SPOILER_Screenshot_20260315_182002_Gallery-1.jpg?ex=69b82625&is=69b6d4a5&hm=1823322bd44acc69d7e1897fe92b195d20a849423d75daf4c3f809f4d07e7994&"; // Gönderdiğin resmi buraya sabitledim
const BOT_PANEL_URL = "https://valeinsiva.com.tr";
const DB_FILE = "./views.json";
// ---------------

function getStats() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ views: 0, likes: 0 }));
        return { views: 0, likes: 0 };
    }
    try { return JSON.parse(fs.readFileSync(DB_FILE)); } catch (e) { return { views: 0, likes: 0 }; }
}

let cachedData = null;
async function updateCache() {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (r.data && r.data.data) {
            cachedData = r.data.data;
            io.emit("presence", cachedData);
        }
    } catch (e) { console.error("Lanyard Error"); }
}
setInterval(updateCache, 1000);

app.get("/api/like", (req, res) => {
    let stats = getStats();
    stats.likes = (stats.likes || 0) + 1;
    fs.writeFileSync(DB_FILE, JSON.stringify(stats));
    res.json({ success: true, likes: stats.likes });
});

app.get("/", (req, res) => {
    let stats = getStats();
    stats.views++;
    fs.writeFileSync(DB_FILE, JSON.stringify(stats));

    res.send(`
<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --profile-color: #7289da; --bg-color: #050505; --card-bg: rgba(15, 15, 15, 0.8); --text-color: #fff; }
        [data-theme="light"] { --bg-color: #f0f2f5; --card-bg: rgba(255, 255, 255, 0.85); --text-color: #1a1a1a; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg-color); color:var(--text-color); display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; transition:0.5s; }
        
        .bg-wrap { position:fixed; inset:0; z-index:-1; overflow:hidden; }
        .orb { position:absolute; border-radius:50%; filter:blur(100px); opacity:0.3; background:var(--profile-color); animation:move 15s infinite alternate; }
        @keyframes move { 0% { transform: translate(-10%,-10%) scale(1); } 100% { transform: translate(110%,110%) scale(1.5); } }

        .like-btn, .theme-toggle { position:fixed; top:25px; width:50px; height:50px; background:var(--card-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100; border:1px solid rgba(255,255,255,0.1); transition:0.3s; }
        .like-btn { left:25px; color:#888; } .like-btn.liked { color:#ff4757; transform:scale(1.1); }
        .theme-toggle { right:25px; color:var(--profile-color); }

        .main-card { width:380px; background:var(--card-bg); backdrop-filter:blur(30px); border-radius:40px; border:1px solid rgba(255,255,255,0.1); box-shadow:0 30px 60px rgba(0,0,0,0.5); overflow:hidden; }
        .banner-box { height:160px; } .banner-img { width:100%; height:100%; object-fit:cover; }

        .profile-content { padding: 0 25px 25px; text-align:center; }
        .avatar-wrap { position:relative; width:100px; height:100px; margin:-55px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card-bg); }
        .decor-img { position:absolute; inset:-15%; width:130%; z-index:11; }
        .status { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:4px solid var(--card-bg); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        .card { background:rgba(120,120,120,0.1); border-radius:20px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:10px; text-align:left; }
        .s-bar-container { height:5px; background:rgba(0,0,0,0.2); border-radius:10px; margin-top:8px; position:relative; }
        .s-bar-fill { height:100%; background:var(--profile-color); border-radius:10px; transition: width 0.5s; }
        .s-time { display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.5); margin-top:5px; }

        .socials { display:flex; justify-content:center; gap:40px; margin-top:20px; }
        .social-item { text-decoration:none; color:var(--text-color); font-size:11px; opacity:0.7; transition:0.3s; }
        .social-item:hover { opacity:1; color:var(--profile-color); transform:translateY(-3px); }

        .footer { margin-top:20px; font-size:11px; display:flex; justify-content:center; gap:15px; opacity:0.4; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    <div class="like-btn" id="like-btn"><i class="fa-solid fa-heart"></i></div>
    <div class="theme-toggle" id="theme-btn"><i class="fa-solid fa-moon"></i></div>

    <div class="main-card">
        <div class="banner-box"><img src="${BANNER_URL}" class="banner-img"></div>
        <div class="profile-content">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status"></div>
            </div>
            <h2 style="margin:0;">Valeinsiva</h2>
            <div style="font-size:13px; opacity:0.5; margin-bottom:15px;">@valeinsiva.</div>
            
            <div id="act-stack"></div>

            <div class="socials">
                <a href="${BOT_PANEL_URL}" target="_blank" class="social-item"><i class="fa-solid fa-layer-group fa-2xl"></i><br><br>Bot Panel</a>
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-item"><i class="fa-brands fa-discord fa-2xl"></i><br><br>Profil</a>
            </div>

            <div class="footer">
                <span><i class="fa-solid fa-eye"></i> ${stats.views}</span>
                <span><i class="fa-solid fa-heart"></i> <span id="like-count">${stats.likes}</span></span>
                <span><i class="fa-solid fa-location-dot"></i> Türkiye</span>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        const html = document.documentElement;

        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            return (h > 0 ? h + ":" : "") + (m < 10 ? "0" + m : m) + ":" + (sec < 10 ? "0" + sec : sec);
        }

        document.getElementById("like-btn").onclick = function() {
            fetch('/api/like').then(r => r.json()).then(data => {
                document.getElementById('like-count').innerText = data.likes;
                this.classList.add('liked');
            });
        };

        document.getElementById("theme-btn").onclick = function() {
            const isDark = html.getAttribute("data-theme") === "dark";
            html.setAttribute("data-theme", isDark ? "light" : "dark");
            this.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
        };

        socket.on("presence", data => {
            const u = data.discord_user;
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("status").className = "status " + data.discord_status;
            
            const decor = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            let acts = "";
            
            // SPOTIFY
            if(data.spotify) {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Date.now() - data.spotify.timestamps.start;
                const prog = Math.min((elapsed / total) * 100, 100);
                acts += \`
                <div class="card">
                    <img src="\${data.spotify.album_art_url}" style="width:50px; border-radius:10px;">
                    <div style="flex:1">
                        <div style="font-weight:700; font-size:13px;">\${data.spotify.song}</div>
                        <div style="font-size:11px; opacity:0.6;">\${data.spotify.artist}</div>
                        <div class="s-bar-container"><div class="s-bar-fill" style="width:\${prog}%"></div></div>
                        <div class="s-time"><span>\${formatTime(elapsed)}</span><span>\${formatTime(total)}</span></div>
                    </div>
                    <i class="fa-brands fa-spotify" style="color:#1db954; font-size:20px;"></i>
                </div>\`;
            }

            // PLAYSTATION & GAMES
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                const isPS = game.application_id === "710548135111163904" || (game.assets && game.assets.large_text && game.assets.large_text.includes("PlayStation"));
                const start = game.timestamps ? game.timestamps.start : null;
                const duration = start ? formatTime(Date.now() - start) : "Başladı";
                
                acts += \`
                <div class="card">
                    <div style="width:45px; height:45px; background:#003087; border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;">
                        <i class="\${isPS ? 'fa-brands fa-playstation' : 'fa-solid fa-gamepad'}" style="font-size:24px;"></i>
                    </div>
                    <div style="flex:1">
                        <div style="font-weight:700; font-size:13px;">\${game.name}</div>
                        <div style="font-size:11px; opacity:0.6;">\${game.details || 'Oynuyor'} • \${duration}</div>
                    </div>
                </div>\`;
            }

            document.getElementById("act-stack").innerHTML = acts || '<div style="font-size:12px; opacity:0.3; font-style:italic;">Şu an bir aktivite yok...</div>';
        });

        // Arka plan objeleri
        for(let i=0; i<4; i++){
            let o = document.createElement('div'); o.className='orb';
            o.style.width='500px'; o.style.height='500px';
            o.style.left=Math.random()*100+'%'; o.style.top=Math.random()*100+'%';
            o.style.animationDelay=(i*3)+'s'; document.getElementById('bg-canvas').appendChild(o);
        }
    </script>
</body>
</html>
    `);
});

server.listen(3000);
