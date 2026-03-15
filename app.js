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
const BANNER_URL = "https://i.ibb.co/L5k6t0r/1000055681.jpg";
// ---------------

let stats = { views: 0, likes: 0 };

// GitHub'dan Veri Çekme ve Güncelleme Fonksiyonları
async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };

        // Dosyanın mevcut durumunu al (SHA için gerekli)
        const getRes = await axios.get(url, { headers }).catch(() => null);
        
        if (!isUpdate && getRes) {
            const content = Buffer.from(getRes.data.content, 'base64').toString();
            stats = JSON.parse(content);
            return;
        }

        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(stats, null, 2)).toString('base64');
            await axios.put(url, {
                message: "📊 İstatistik Güncelleme",
                content: newContent,
                sha: sha
            }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error:", e.message); }
}

// Lanyard Verisi
let cachedData = null;
setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        io.emit("presence", cachedData);
    } catch (e) {}
}, 1000);

// İlk açılışta veriyi çek
syncWithGithub();

app.get("/api/like", async (req, res) => {
    stats.likes++;
    res.json({ success: true, likes: stats.likes });
    await syncWithGithub(true); 
});

app.get("/", async (req, res) => {
    stats.views++;
    // Render her girişte GitHub'ı tetiklemesin diye beklemeden yanıt ver
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
        :root { --profile-color: #7289da; --bg-color: #050505; --card-bg: rgba(15, 15, 15, 0.85); --text-color: #fff; }
        [data-theme="light"] { --bg-color: #ffffff; --card-bg: rgba(240, 240, 240, 0.9); --text-color: #1a1a1a; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg-color); color:var(--text-color); display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; transition:0.5s; }
        .bg-wrap { position:fixed; inset:0; z-index:-1; overflow:hidden; }
        .orb { position:absolute; border-radius:50%; filter:blur(100px); opacity:0.3; background:var(--profile-color); animation:move 15s infinite alternate linear; }
        @keyframes move { 0% { transform: translate(-10%,-10%); } 100% { transform: translate(100%,100%); } }

        .like-btn, .theme-toggle { position:fixed; top:25px; width:52px; height:52px; background:var(--card-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100; border:1px solid rgba(255,255,255,0.1); transition:0.3s; }
        .like-btn { left:25px; color:#888; } .like-btn.liked { color:#ff4757; transform:scale(1.1); box-shadow: 0 0 15px rgba(255,71,87,0.4); }
        .theme-toggle { right:25px; color:var(--profile-color); }

        .main-card { width:380px; background:var(--card-bg); backdrop-filter:blur(30px); border-radius:40px; border:1px solid rgba(255,255,255,0.1); box-shadow:0 30px 60px rgba(0,0,0,0.5); overflow:hidden; position:relative; }
        .banner-box { height:160px; } .banner-img { width:100%; height:100%; object-fit:cover; }

        .profile-content { padding: 0 25px 25px; text-align:center; }
        .avatar-wrap { position:relative; width:105px; height:105px; margin:-55px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card-bg); }
        .decor-img { position:absolute; inset:-15%; width:130%; z-index:11; }
        .status { position:absolute; bottom:5px; right:5px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card-bg); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        .card { background:rgba(120,120,120,0.1); border-radius:22px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:12px; text-align:left; border:1px solid rgba(255,255,255,0.05); }
        .s-bar-container { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:10px; width:100%; overflow:hidden; }
        .s-bar-fill { height:100%; background:var(--profile-color); transition: width 0.4s ease; }
        .s-time { display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.4); margin-top:6px; font-weight:600; }

        .footer { margin-top:20px; font-size:11px; display:flex; justify-content:center; gap:20px; opacity:0.6; font-weight:bold; }
        .stat-item { display:flex; align-items:center; gap:6px; }
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
            <h2 style="margin:0; letter-spacing:-1px; font-weight:800;">Valeinsiva</h2>
            <div style="font-size:13px; opacity:0.5; margin-bottom:18px;">@valeinsiva.</div>
            
            <div id="act-stack"></div>

            <div style="display:flex; justify-content:center; gap:30px; margin-top:20px;">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="text-decoration:none; color:var(--text-color); font-size:24px; opacity:0.7;"><i class="fa-brands fa-discord"></i></a>
                <a href="#" style="text-decoration:none; color:var(--text-color); font-size:24px; opacity:0.7;"><i class="fa-solid fa-code"></i></a>
            </div>

            <div class="footer">
                <div class="stat-item"><i class="fa-solid fa-eye"></i> <span>${stats.views}</span></div>
                <div class="stat-item"><i class="fa-solid fa-heart"></i> <span id="like-count">${stats.likes}</span></div>
                <div class="stat-item"><i class="fa-solid fa-location-dot"></i> Türkiye</div>
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
            if(this.classList.contains('liked')) return;
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
            
            if(u.avatar_decoration_data) {
                document.getElementById("decor").src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                document.getElementById("decor").style.display = "block";
            } else { document.getElementById("decor").style.display = "none"; }

            let acts = "";
            if(data.spotify) {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Date.now() - data.spotify.timestamps.start;
                const prog = Math.min((elapsed / total) * 100, 100);
                acts += \`
                <div class="card">
                    <img src="\${data.spotify.album_art_url}" style="width:55px; border-radius:12px;">
                    <div style="flex:1">
                        <div style="font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:180px;">\${data.spotify.song}</div>
                        <div style="font-size:11px; opacity:0.5; font-weight:600;">\${data.spotify.artist}</div>
                        <div class="s-bar-container"><div class="s-bar-fill" style="width:\${prog}%"></div></div>
                        <div class="s-time"><span>\${formatTime(elapsed)}</span><span>\${formatTime(total)}</span></div>
                    </div>
                    <i class="fa-brands fa-spotify" style="color:#1db954; font-size:24px;"></i>
                </div>\`;
            }

            const game = data.activities.find(a => a.type === 0);
            if(game) {
                const isPS = game.application_id === "710548135111163904" || (game.assets && game.assets.large_text && game.assets.large_text.includes("PlayStation"));
                const start = game.timestamps ? game.timestamps.start : null;
                const dur = start ? formatTime(Date.now() - start) : "Oynuyor";
                acts += \`
                <div class="card">
                    <div style="width:55px; height:55px; background:#003087; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                        <i class="\${isPS ? 'fa-brands fa-playstation' : 'fa-solid fa-gamepad'}" style="font-size:28px; color:white;"></i>
                    </div>
                    <div style="flex:1">
                        <div style="font-weight:800; font-size:13px;">\${game.name}</div>
                        <div style="font-size:11px; opacity:0.5;">\${game.details || 'Oynuyor'}</div>
                        <div style="font-size:10px; margin-top:5px; font-weight:bold; color:var(--profile-color)">\${dur} süredir</div>
                    </div>
                </div>\`;
            }
            document.getElementById("act-stack").innerHTML = acts || '<div style="font-size:12px; opacity:0.3; font-style:italic; padding:15px;">Aktivite yok...</div>';
        });

        for(let i=0; i<5; i++){
            let o = document.createElement('div'); o.className='orb';
            o.style.width='400px'; o.style.height='400px';
            o.style.left=Math.random()*100+'%'; o.style.top=Math.random()*100+'%';
            o.style.animationDelay=(i*3)+'s'; document.getElementById('bg-canvas').appendChild(o);
        }
    </script>
</body>
</html>
    `);
    // Görüntülenmeyi GitHub'a işle
    syncWithGithub(true);
});

server.listen(process.env.PORT || 3000);
