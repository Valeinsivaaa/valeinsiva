Const express = require("express");
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
// ---------------

let stats = { views: 0, likes: 0 };
let cachedData = null;

app.get('/favicon.ico', (req, res) => res.status(204).end());

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

app.get("/api/view", async (req, res) => {
    stats.views++;
    await syncWithGithub(true);
    res.json({ success: true, views: stats.views });
});

app.get("/", async (req, res) => {
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
        :root { --profile-color: #7289da; --bg-color: #050505; --card-bg: rgba(15, 15, 15, 0.9); --text-color: #fff; --btn-inactive: #888; }
        [data-theme="light"] { --bg-color: #f0f2f5; --card-bg: rgba(255, 255, 255, 0.95); --text-color: #1a1a1a; --btn-inactive: #555; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg-color); color:var(--text-color); display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; transition: background 0.4s ease; }
        .bg-wrap { position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events: none; }
        
        /* Performans İçin Optimize Edilmiş Orblar */
        .orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.2; background:var(--profile-color); will-change: transform; animation:move 20s infinite alternate ease-in-out; }
        @keyframes move { 0% { transform: translate3d(-5%, -5%, 0); } 100% { transform: translate3d(50%, 50%, 0); } }
        
        .main-card { width:380px; background:var(--card-bg); border-radius:40px; border:1px solid rgba(255,255,255,0.08); box-shadow:0 20px 40px rgba(0,0,0,0.4); overflow:hidden; position:relative; z-index:10; }
        .avatar-wrap { position:relative; width:105px; height:105px; margin:-55px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card-bg); }
        .decor-img { position:absolute; inset:-15%; width:130%; z-index:11; pointer-events:none; }
        .status { position:absolute; bottom:5px; right:5px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card-bg); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
        
        .card { background:rgba(120,120,120,0.08); border-radius:22px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:12px; }
        .s-bar-container { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:10px; overflow:hidden; }
        .s-bar-fill { height:100%; background:var(--profile-color); transition: width 0.6s ease; }
        
        .social-link { text-decoration:none; color:var(--text-color); opacity:0.6; transition:0.2s; text-align:center; font-size:10px; }
        .social-link:hover { opacity:1; transform:translateY(-2px); color:var(--profile-color); }

        .like-btn, .theme-toggle { 
            position:fixed; top:25px; width:52px; height:52px; background:var(--card-bg); border-radius:50%; 
            display:flex; align-items:center; justify-content:center; cursor:pointer; 
            border:1px solid rgba(255,255,255,0.1); color: var(--btn-inactive); z-index: 100;
        }
        .like-btn { left:25px; } .theme-toggle { right:25px; }
        .like-btn.liked { color:#ff4757 !important; }

        .theme-toggle.rotating i { animation: rotateIcon 0.5s ease-in-out; }
        @keyframes rotateIcon { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    <div class="like-btn" id="like-btn"><i class="fa-solid fa-heart"></i></div>
    <div class="theme-toggle" id="theme-btn"><i class="fa-solid fa-moon"></i></div>

    <div class="main-card">
        <div style="height:160px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
        <div class="profile-content" style="padding:0 25px 25px; text-align:center;">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar" src="">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status"></div>
            </div>
            <h2 style="margin:0; font-weight:800;">Valeinsiva</h2>
            <div style="font-size:13px; opacity:0.5; margin-bottom:18px;">@valeinsiva.</div>
            
            <div id="act-stack"></div>

            <div style="display:flex; justify-content:center; gap:35px; margin-top:20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-link"><i class="fa-brands fa-discord fa-2xl"></i><br><span style="display:block; margin-top:8px; font-weight:600;">Discord</span></a>
                <a href="${INSTAGRAM_LINK}" target="_blank" class="social-link"><i class="fa-brands fa-instagram fa-2xl"></i><br><span style="display:block; margin-top:8px; font-weight:600;">Instagram</span></a>
                <a href="${BOT_PANEL_LINK}" target="_blank" class="social-link"><i class="fa-solid fa-code fa-2xl"></i><br><span style="display:block; margin-top:8px; font-weight:600;">Bot Panel</span></a>
            </div>
            <div style="font-size: 9px; opacity: 0.3; margin-top: 10px; letter-spacing: 1px; text-transform: uppercase;">Sosyal Medya</div>

            <div style="margin-top:25px; font-size:11px; display:flex; justify-content:center; gap:20px; opacity:0.5;">
                <div><i class="fa-solid fa-eye"></i> <span id="view-count">${stats.views}</span></div>
                <div><i class="fa-solid fa-heart"></i> <span id="like-count">${stats.likes}</span></div>
                <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentPresence = null;

        window.addEventListener('load', () => {
            if (!sessionStorage.getItem('viewed')) {
                fetch('/api/view').then(r => r.json()).then(data => {
                    sessionStorage.setItem('viewed', 'true');
                    document.getElementById('view-count').innerText = data.views;
                });
            }
        });

        function formatTime(ms) {
            if (ms < 0) ms = 0;
            const s = Math.floor(ms / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            return (h > 0 ? h + ":" : "") + (m < 10 ? "0" + m : m) + ":" + (sec < 10 ? "0" + sec : sec);
        }

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
            if (game && game.timestamps && gameTime) {
                gameTime.innerText = formatTime(Date.now() - game.timestamps.start) + " süredir";
            }
        }, 1000);

        socket.on("presence", data => {
            const u = data.discord_user;
            
            // Dekor ve Avatar
            const decorEl = document.getElementById("decor");
            const newDecorUrl = u.avatar_decoration_data ? \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\` : null;
            if (newDecorUrl) {
                if (decorEl.src !== newDecorUrl) { decorEl.src = newDecorUrl; decorEl.style.display = "block"; }
            } else { decorEl.style.display = "none"; }

            const avatarImg = document.getElementById("avatar");
            const newAvatar = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            if(avatarImg.src !== newAvatar) avatarImg.src = newAvatar;
            document.getElementById("status").className = "status " + data.discord_status;

            // Aktivite Değişim Kontrolü
            const oldKey = JSON.stringify(currentPresence?.spotify?.song_id || '') + JSON.stringify(currentPresence?.activities?.find(a=>a.type===0)?.name || '');
            const newKey = JSON.stringify(data?.spotify?.song_id || '') + JSON.stringify(data?.activities?.find(a=>a.type===0)?.name || '');

            if (oldKey !== newKey) {
                let actsHTML = "";
                if(data.spotify) {
                    actsHTML += \`
                    <div class="card">
                        <img src="\${data.spotify.album_art_url}" style="width:55px; border-radius:12px;">
                        <div style="flex:1; text-align:left;">
                            <div style="font-weight:800; font-size:13px; width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${data.spotify.song}</div>
                            <div style="font-size:11px; opacity:0.5;">\${data.spotify.artist}</div>
                            <div class="s-bar-container"><div id="spotify-bar" class="s-bar-fill"></div></div>
                            <div id="spotify-time" style="font-size:10px; margin-top:5px; opacity:0.4;"></div>
                        </div>
                        <i class="fa-brands fa-spotify" style="color:#1db954; font-size:24px;"></i>
                    </div>\`;
                }
                const game = data.activities.find(a => a.type === 0);
                if(game) {
                    actsHTML += \`
                    <div class="card">
                        <div style="width:55px; height:55px; background:var(--profile-color); border-radius:12px; display:flex; align-items:center; justify-content:center; opacity:0.8;">
                            <i class="fa-solid fa-gamepad" style="font-size:28px; color:white;"></i>
                        </div>
                        <div style="flex:1; text-align:left;">
                            <div style="font-weight:800; font-size:13px;">\${game.name}</div>
                            <div id="game-duration" style="font-size:10px; margin-top:5px; opacity:0.6; font-weight:bold;"></div>
                        </div>
                    </div>\`;
                }
                // Düzeltilmiş Sessiz Mod Yazısı
                document.getElementById("act-stack").innerHTML = actsHTML || '<div style="font-size:11px; opacity:0.3; padding:15px; letter-spacing:1px; text-transform:uppercase; font-weight:600;">Şu an sessiz modda...</div>';
            }
            currentPresence = data;
        });

        document.getElementById("like-btn").onclick = function() {
            if(this.classList.contains('liked')) return;
            fetch('/api/like').then(r => r.json()).then(data => {
                document.getElementById('like-count').innerText = data.likes;
                this.classList.add('liked');
            });
        };
        
        document.getElementById("theme-btn").onclick = function() {
            const html = document.documentElement;
            const isDark = html.getAttribute("data-theme") === "dark";
            const icon = this.querySelector("i");
            this.classList.add('rotating');
            setTimeout(() => {
                if (isDark) {
                    html.setAttribute("data-theme", "light");
                    icon.className = "fa-solid fa-sun";
                    icon.style.color = "#f39c12";
                } else {
                    html.setAttribute("data-theme", "dark");
                    icon.className = "fa-solid fa-moon";
                    icon.style.color = "";
                }
            }, 250);
            setTimeout(() => this.classList.remove('rotating'), 500);
        };

        // Performans İçin Orb Oluşturucu
        const bg = document.getElementById('bg-canvas');
        for(let i=0; i<3; i++){ // Sayı 5'ten 3'e indirildi (Performans)
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




