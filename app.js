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
const BOT_PANEL_LINK = "https://valeinsiva.com.tr"; 
// ---------------

let stats = { views: 0, likes: 0 };
let cachedData = null;

// GitHub Senkronizasyonu
async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (!isUpdate && getRes) {
            stats = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            return;
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(stats, null, 2)).toString('base64');
            await axios.put(url, { message: "📊 İstatistik Güncelleme", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        io.emit("presence", cachedData);
    } catch (e) {}
}, 2000);

syncWithGithub();

app.get("/api/like", async (req, res) => {
    stats.likes++;
    res.json({ success: true, likes: stats.likes });
    await syncWithGithub(true); 
});

app.get("/", async (req, res) => {
    stats.views++;
    syncWithGithub(true);
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
        
        :root { 
            --profile-color: #7289da; 
            --bg-color: #050505; 
            --card-bg: rgba(15, 15, 15, 0.85); 
            --text-color: #fff; 
        }
        [data-theme="light"] { 
            --bg-color: #f0f2f5; 
            --card-bg: rgba(255, 255, 255, 0.9); 
            --text-color: #1a1a1a; 
        }

        /* AKICI GEÇİŞLER */
        * { transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg-color); color:var(--text-color); display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; }
        
        .bg-wrap { position:fixed; inset:0; z-index:-1; overflow:hidden; }
        .orb { position:absolute; border-radius:50%; filter:blur(100px); opacity:0.3; background:var(--profile-color); animation:move 15s infinite alternate linear; }
        @keyframes move { 0% { transform: translate(-10%,-10%); } 100% { transform: translate(100%,100%); } }

        .main-card { width:380px; background:var(--card-bg); backdrop-filter:blur(30px); border-radius:40px; border:1px solid rgba(255,255,255,0.1); box-shadow:0 30px 60px rgba(0,0,0,0.5); overflow:hidden; }
        
        .avatar-wrap { position:relative; width:105px; height:105px; margin:-55px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card-bg); }
        .decor-img { position:absolute; inset:-15%; width:130%; z-index:11; pointer-events:none; }
        
        .status { position:absolute; bottom:5px; right:5px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card-bg); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
        
        .card { background:rgba(120,120,120,0.1); border-radius:22px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:12px; }
        .s-bar-container { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:10px; overflow:hidden; }
        .s-bar-fill { height:100%; background:var(--profile-color); transition: width 1s linear; }

        /* BUTON ANİMASYONLARI */
        .like-btn, .theme-toggle { 
            position:fixed; top:25px; width:54px; height:54px; background:var(--card-bg); 
            border-radius:50%; display:flex; align-items:center; justify-content:center; 
            cursor:pointer; border:1px solid rgba(255,255,255,0.1); z-index:100;
        }

        .like-btn { left:25px; color:#888; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.3s ease; }
        .like-btn.liked { 
            color:#ff4757; transform:scale(1.2); 
            box-shadow: 0 0 20px rgba(255,71,87,0.4); 
            border-color: rgba(255,71,87,0.3);
        }

        .theme-toggle { 
            right:25px; 
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .theme-toggle i { font-size: 22px; color:var(--profile-color); }

        .social-link { text-decoration:none; color:var(--text-color); opacity:0.7; transition:0.3s; text-align:center; font-size:10px; }
        .social-link:hover { opacity:1; transform:translateY(-3px); color:var(--profile-color); }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    <div class="like-btn" id="like-btn"><i class="fa-solid fa-heart fa-lg"></i></div>
    <div class="theme-toggle" id="theme-btn"><i class="fa-solid fa-moon"></i></div>

    <div class="main-card">
        <div style="height:160px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
        <div class="profile-content" style="padding:0 25px 25px; text-align:center;">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status"></div>
            </div>
            <h2 style="margin:0; font-weight:800;">Valeinsiva</h2>
            <div style="font-size:13px; opacity:0.5; margin-bottom:18px;">@valeinsiva.</div>
            
            <div id="act-stack"></div>

            <div style="display:flex; justify-content:center; gap:40px; margin-top:20px;">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-link"><i class="fa-brands fa-discord fa-2xl"></i><br><span>Profili Görüntüle</span></a>
                <a href="${BOT_PANEL_LINK}" target="_blank" class="social-link"><i class="fa-solid fa-code fa-2xl"></i><br><span>Bot Panel</span></a>
            </div>

            <div style="margin-top:20px; font-size:11px; display:flex; justify-content:center; gap:20px; opacity:0.6; font-weight:bold;">
                <div><i class="fa-solid fa-eye"></i> ${stats.views}</div>
                <div><i class="fa-solid fa-heart"></i> <span id="like-count">${stats.likes}</span></div>
                <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentPresence = null;
        const themeBtn = document.getElementById("theme-btn");
        const html = document.documentElement;

        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            return (h > 0 ? h + ":" : "") + (m < 10 ? "0" + m : m) + ":" + (sec < 10 ? "0" + sec : sec);
        }

        // Sayaçlar (Dekoru bozmadan sadece metin günceller)
        setInterval(() => {
            if (!currentPresence) return;
            if (currentPresence.spotify) {
                const total = currentPresence.spotify.timestamps.end - currentPresence.spotify.timestamps.start;
                const elapsed = Date.now() - currentPresence.spotify.timestamps.start;
                const prog = Math.min((elapsed / total) * 100, 100);
                const bar = document.getElementById('spotify-bar');
                const timeStr = document.getElementById('spotify-time');
                if (bar) bar.style.width = prog + "%";
                if (timeStr) timeStr.innerText = formatTime(elapsed) + " / " + formatTime(total);
            }
            const game = currentPresence.activities.find(a => a.type === 0);
            const gameTime = document.getElementById('game-duration');
            if (game?.timestamps && gameTime) {
                gameTime.innerText = formatTime(Date.now() - game.timestamps.start) + " süredir";
            }
        }, 1000);

        socket.on("presence", data => {
            const u = data.discord_user;
            const decorEl = document.getElementById("decor");
            const newDecorUrl = u.avatar_decoration_data ? \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\` : null;
            
            if (newDecorUrl && decorEl.src !== newDecorUrl) {
                decorEl.src = newDecorUrl;
                decorEl.style.display = "block";
            } else if (!newDecorUrl) {
                decorEl.style.display = "none";
            }

            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("status").className = "status " + data.discord_status;

            if (JSON.stringify(data.activities) !== JSON.stringify(currentPresence?.activities) || 
                JSON.stringify(data.spotify) !== JSON.stringify(currentPresence?.spotify)) {
                
                let actsHTML = "";
                if(data.spotify) {
                    actsHTML += \`
                    <div class="card">
                        <img src="\${data.spotify.album_art_url}" style="width:55px; border-radius:12px;">
                        <div style="flex:1; text-align:left;">
                            <div style="font-weight:800; font-size:13px; width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${data.spotify.song}</div>
                            <div style="font-size:11px; opacity:0.5;">\${data.spotify.artist}</div>
                            <div class="s-bar-container"><div id="spotify-bar" class="s-bar-fill"></div></div>
                            <div id="spotify-time" style="font-size:10px; margin-top:5px; opacity:0.4; font-weight:600;"></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:24px;"></i>
                    </div>\`;
                }
                const game = data.activities.find(a => a.type === 0);
                if(game) {
                    const isPS = game.application_id === "710548135111163904" || (game.assets?.large_text?.includes("PlayStation"));
                    actsHTML += \`
                    <div class="card">
                        <div style="width:55px; height:55px; background:#003087; border-radius:12px; display:flex; align-items:center; justify-content:center;"><i class="\${isPS ? 'fa-brands fa-playstation' : 'fa-solid fa-gamepad'}" style="font-size:28px; color:white;"></i></div>
                        <div style="flex:1; text-align:left;">
                            <div style="font-weight:800; font-size:13px;">\${game.name}</div>
                            <div style="font-size:11px; opacity:0.5;">\${game.details || 'Oynuyor'}</div>
                            <div id="game-duration" style="font-size:10px; margin-top:5px; font-weight:bold; color:var(--profile-color)"></div>
                        </div>
                    </div>\`;
                }
                document.getElementById("act-stack").innerHTML = actsHTML || '<div style="font-size:12px; opacity:0.3; padding:15px;">Aktivite yok...</div>';
            }
            currentPresence = data;
        });

        // BEĞENİ BUTONU ANİMASYONU
        document.getElementById("like-btn").onclick = function() {
            if(this.classList.contains('liked')) return;
            fetch('/api/like').then(r => r.json()).then(data => {
                document.getElementById('like-count').innerText = data.likes;
                this.classList.add('liked');
            });
        };

        // TEMA DEĞİŞTİRME (360 DERECE DÖNÜŞLÜ)
        themeBtn.addEventListener("click", () => {
            const isDark = html.getAttribute("data-theme") === "dark";
            themeBtn.style.transform = "rotate(360deg)";
            
            setTimeout(() => {
                html.setAttribute("data-theme", isDark ? "light" : "dark");
                themeBtn.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
            }, 300);

            setTimeout(() => {
                themeBtn.style.transition = "none";
                themeBtn.style.transform = "rotate(0deg)";
                setTimeout(() => themeBtn.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", 50);
            }, 600);
        });

        // Arka Plan Orbları
        const bg = document.getElementById('bg-canvas');
        for(let i=0; i<5; i++){
            let o = document.createElement('div'); o.className='orb';
            o.style.width='400px'; o.style.height='400px';
            o.style.left=Math.random()*100+'%'; o.style.top=Math.random()*100+'%';
            o.style.animationDelay=(i*3)+'s'; bg.appendChild(o);
        }
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
