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
const FILE_PATH = "data.json";
const DISCORD_ID = "877946035408891945";
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
            await axios.put(url, { message: "💎 Premium Update", content: newContent, sha: sha }, { headers });
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
}, 1000);

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

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Pro Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #5865F2; --bg: #050505; --card: rgba(15,15,15,0.95); --text: #fff; }
        [data-theme="light"] { --bg: #f0f2f5; --card: rgba(255,255,255,0.98); --text: #111; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); display:flex; justify-content:center; align-items:center; min-height:100vh; overflow-x:hidden; transition: 0.5s; }
        .bg-wrap { position:fixed; inset:0; z-index:-1; pointer-events:none; }
        .orb { position:absolute; border-radius:50%; filter:blur(120px); opacity:0.1; background:var(--accent); animation:move 20s infinite alternate linear; }
        @keyframes move { 0% { transform: translate(-10%,-10%); } 100% { transform: translate(100%,100%); } }

        .container { display:flex; gap:30px; max-width:1100px; width:95%; align-items:flex-start; }

        /* Mesaj Bölümü */
        .dm-section { width:300px; background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.05); padding:25px; box-shadow:0 10px 40px rgba(0,0,0,0.5); }
        .msg-bubble { background:rgba(120,120,120,0.05); padding:12px; border-radius:18px; margin-bottom:12px; font-size:12px; border-left:4px solid var(--accent); animation: pop 0.4s ease; }
        @keyframes pop { from { transform: scale(0.8); opacity:0; } to { transform: scale(1); opacity:1; } }

        /* Ana Kart */
        .main-card { width:420px; background:var(--card); border-radius:45px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative; box-shadow:0 40px 80px rgba(0,0,0,0.6); }
        .banner { height:180px; width:100%; object-fit:cover; background:#111; }
        .avatar-wrap { position:relative; width:115px; height:115px; margin:-60px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:6px solid var(--card); }
        .status { position:absolute; bottom:8px; right:8px; width:22px; height:22px; border-radius:50%; border:4px solid var(--card); }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }

        /* Spotify & PS Card Tasarımı */
        .activity-card { background:rgba(120,120,120,0.08); border-radius:24px; padding:15px; display:flex; align-items:center; gap:15px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.03); }
        .s-bar { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin-top:10px; overflow:hidden; }
        .s-fill { height:100%; background:var(--accent); transition: width 1s linear; }

        /* İkonlar ve Butonlar */
        .insta-icon { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .dev-icon { color: #00d2ff; }
        
        .floating-btn { width:55px; height:55px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid rgba(255,255,255,0.1); color:var(--text); transition:0.3s; font-size:20px; }
        
        /* Kalp Atışı Animasyonu */
        .heart-pulse { animation: heartBeat 1.5s infinite; color: #ff4757; }
        @keyframes heartBeat { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        
        /* Tema Döngüsü Animasyonu */
        .spin-loop { animation: rotateLoop 4s infinite linear; }
        @keyframes rotateLoop { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .input-pro { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:15px; padding:12px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; }

        @media (max-width: 900px) { .container { flex-direction: column; align-items: center; } .dm-section { width:420px; order:2; } }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    
    <div style="position:fixed; top:30px; left:30px; right:30px; display:flex; justify-content:space-between; z-index:100;">
        <div class="floating-btn heart-pulse" onclick="like()"><i class="fa-solid fa-heart"></i></div>
        <div class="floating-btn spin-loop" id="theme-btn"><i class="fa-solid fa-circle-notch"></i></div>
    </div>

    <div class="container">
        <div class="dm-section">
            <h3 style="margin:0 0 20px 0; font-weight:800; opacity:0.8;"><i class="fa-solid fa-feather-pointed"></i> Bir İz Bırak</h3>
            <div id="msg-list"></div>
            <div style="margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:20px;">
                <input type="text" id="msg-user" class="input-pro" placeholder="Sizi tanıyabilmek adına isminiz...">
                <textarea id="msg-text" class="input-pro" style="resize:none;" placeholder="Mesajınız nedir?"></textarea>
                <button onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:14px; border-radius:15px; cursor:pointer; font-weight:bold; transition:0.3s;">Gönder</button>
            </div>
        </div>

        <div class="main-card">
            <div id="banner-container"><img id="banner-img" class="banner" src=""></div>
            <div style="padding:0 30px 30px; text-align:center;">
                <div class="avatar-wrap">
                    <img id="avatar" class="avatar" src="">
                    <div id="status" class="status"></div>
                </div>
                <h2 style="margin:0; font-weight:800; font-size:26px; letter-spacing:-1px;">Valeinsiva</h2>
                <div style="font-size:14px; opacity:0.4; margin-bottom:25px;">@valeinsiva.</div>
                
                <div id="act-stack"></div>

                <div style="display:flex; justify-content:center; gap:35px; margin:25px 0; padding:20px 0; border-top:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05);">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="color:var(--accent); font-size:28px;"><i class="fa-brands fa-discord"></i></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="insta-icon" style="font-size:28px;"><i class="fa-brands fa-instagram"></i></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="dev-icon" style="font-size:28px;"><i class="fa-solid fa-code"></i></a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:12px; opacity:0.6; font-weight:600;">
                    <div><i class="fa-solid fa-heart" style="color:#ff4757;"></i> <span id="like-count">${db.stats.likes}</span></div>
                    <div><i class="fa-solid fa-eye"></i> <span id="view-count">${db.stats.views}</span></div>
                    <div><i class="fa-solid fa-location-dot"></i> Türkiye</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentPresence = null;

        // Banner & Avatar Fetcher (Discord API v9)
        async function fetchDiscordProfile() {
            try {
                const r = await fetch('https://api.lanyard.rest/v1/users/${DISCORD_ID}');
                const d = await r.json();
                const u = d.data.discord_user;
                
                // Banner Logic
                const bannerImg = document.getElementById("banner-img");
                if(u.banner) {
                    const ext = u.banner.startsWith("a_") ? "gif" : "png";
                    bannerImg.src = \`https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${ext}?size=600\`;
                } else {
                    bannerImg.style.background = u.banner_color || "#111";
                }
                
                document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.\${u.avatar.startsWith("a_") ? "gif" : "png"}?size=256\`;
            } catch(e) {}
        }
        fetchDiscordProfile();

        window.onload = () => {
            if(!sessionStorage.viewed) {
                fetch('/api/view').then(r => r.json()).then(d => {
                    document.getElementById('view-count').innerText = d.views;
                    sessionStorage.viewed = 1;
                });
            }
        };

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
                <div class="msg-bubble">
                    <b style="color:var(--accent)">\${m.user}</b> <span style="opacity:0.3; font-size:9px; float:right;">\${m.date}</span><br>
                    <div style="margin-top:5px; opacity:0.8;">\${m.text}</div>
                </div>
            \`).join('') || '<div style="opacity:0.2; text-align:center; font-size:12px;">Henüz kimse iz bırakmadı...</div>';
        }

        function like() {
            fetch('/api/like').then(r => r.json()).then(d => {
                document.getElementById('like-count').innerText = d.likes;
                const btn = document.querySelector('.heart-pulse');
                btn.style.transform = "scale(1.5)";
                setTimeout(() => btn.style.transform = "scale(1)", 200);
            });
        }

        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            return (m < 10 ? "0" + m : m) + ":" + (sec < 10 ? "0" + sec : sec);
        }

        socket.on("presence", data => {
            currentPresence = data;
            document.getElementById("status").className = "status " + data.discord_status;
            
            let actsHTML = "";
            
            // Spotify Card (Orijinal Tasarım)
            if(data.spotify) {
                actsHTML += \`
                <div class="activity-card">
                    <img src="\${data.spotify.album_art_url}" style="width:55px; border-radius:12px; animation: spin 10s linear infinite;">
                    <div style="flex:1; text-align:left;">
                        <div style="font-weight:800; font-size:13px; color:var(--accent);">LISTENING TO SPOTIFY</div>
                        <div style="font-weight:bold; font-size:12px; margin-top:2px;">\${data.spotify.song}</div>
                        <div style="font-size:11px; opacity:0.6;">by \${data.spotify.artist}</div>
                        <div class="s-bar"><div id="spotify-bar" class="s-fill"></div></div>
                        <div id="spotify-time" style="font-size:10px; margin-top:5px; opacity:0.4; font-weight:bold;">00:00 / 00:00</div>
                    </div>
                </div>\`;
            }

            // Game Card
            const game = data.activities.find(a => a.type === 0);
            if(game) {
                actsHTML += \`
                <div class="activity-card">
                    <div style="width:55px; height:55px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px var(--accent);">
                        <i class="fa-solid fa-gamepad" style="color:white; font-size:24px;"></i>
                    </div>
                    <div style="flex:1; text-align:left;">
                        <div style="font-weight:800; font-size:13px; color:var(--accent);">PLAYING A GAME</div>
                        <div style="font-weight:bold; font-size:14px; margin-top:2px;">\${game.name}</div>
                        <div id="game-duration" style="font-size:11px; opacity:0.6; font-weight:bold;">00:00:00 süredir</div>
                    </div>
                </div>\`;
            }

            document.getElementById("act-stack").innerHTML = actsHTML || '<div style="font-size:11px; opacity:0.3; padding:15px; letter-spacing:1.5px; text-transform:uppercase; font-weight:800;">Sessiz modda...</div>';
        });

        setInterval(() => {
            if(currentPresence?.spotify) {
                const total = currentPresence.spotify.timestamps.end - currentPresence.spotify.timestamps.start;
                const elapsed = Date.now() - currentPresence.spotify.timestamps.start;
                const prog = Math.min((elapsed / total) * 100, 100);
                document.getElementById('spotify-bar').style.width = prog + "%";
                document.getElementById('spotify-time').innerText = formatTime(elapsed) + " / " + formatTime(total);
            }
            const game = currentPresence?.activities?.find(a => a.type === 0);
            if(game && game.timestamps) {
                const diff = Date.now() - game.timestamps.start;
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                document.getElementById('game-duration').innerText = \`\${h}:\${m < 10 ? '0' + m : m}:\${s < 10 ? '0' + s : s} süredir\`;
            }
        }, 1000);

        document.getElementById("theme-btn").onclick = function() {
            const h = document.documentElement;
            const isDark = h.getAttribute("data-theme") === "dark";
            h.setAttribute("data-theme", isDark ? "light" : "dark");
        };

        const bg = document.getElementById('bg-canvas');
        for(let i=0; i<3; i++){
            let o = document.createElement('div'); o.className='orb';
            o.style.width='350px'; o.style.height='350px';
            o.style.left=Math.random()*80+'%'; o.style.top=Math.random()*80+'%';
            o.style.animationDelay=(i*4)+'s'; bg.appendChild(o);
        }
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
