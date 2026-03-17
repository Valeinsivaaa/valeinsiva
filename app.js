const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = "Valeinsivaaa"; 
const REPO_NAME = "valeinsiva"; 
const FILE_PATH = "views.json";
const DISCORD_ID = "877946035408891945";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 

let db = { views: 0, likes: 0, lastSpotify: null, lastGame: null, messages: [] };
let cachedData = null;

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (getRes) {
            const remoteDb = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            if (!isUpdate) {
                db = remoteDb;
                return;
            }
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Elite Sync", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        if(cachedData.spotify) db.lastSpotify = cachedData.spotify;
        const game = cachedData.activities.find(a => a.type === 0);
        if(game) db.lastGame = game;
        io.emit("presence", { ...cachedData, lastSpotify: db.lastSpotify, lastGame: db.lastGame });
    } catch (e) {}
}, 5000);

// İlk açılışta verileri çek
syncWithGithub();

app.get("/api/stats", (req, res) => {
    res.json({ views: db.views, likes: db.likes });
});

app.get("/api/like", async (req, res) => {
    db.likes++; 
    await syncWithGithub(true);
    res.json({ success: true, likes: db.likes });
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
        db.messages.unshift({ user: data.user.substring(0,15), text: data.text.substring(0,80), time: Date.now() });
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Valeinsiva | Premium</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #050505; --card: rgba(15, 15, 15, 0.85); --text: #ffffff; --sub: rgba(255,255,255,0.4); }
        [data-theme="light"] { --bg: #f0f2f5; --card: rgba(255, 255, 255, 0.9); --text: #121212; --sub: rgba(0,0,0,0.5); }

        body { 
            margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); 
            transition: 0.5s; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; min-height:100vh;
        }

        /* Animasyonlu Arka Plan */
        .bg-animate {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, #050505, #1a1a1a, #050505);
            background-size: 400% 400%;
            z-index: -1;
            animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .wrapper { width:100%; max-width:420px; padding:100px 15px 40px; box-sizing:border-box; z-index: 1; }
        
        .main-card { 
            background:var(--card); border-radius:40px; border:1px solid rgba(255,255,255,0.08); 
            overflow:hidden; position:relative; box-shadow: 0 40px 80px rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
        }
        .banner { height:170px; width:100%; background-size:cover; background-position:center; transition: 0.8s ease-in-out; background-color: #222; }
        
        .avatar-area { position:relative; width:115px; height:115px; margin:-60px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:6px solid var(--card); position:relative; z-index:2; object-fit: cover; }
        .decoration { position:absolute; inset:-12%; width:124%; z-index:3; pointer-events:none; }

        .engine-box { padding:0 20px; }
        .spot-card { background:rgba(30, 215, 96, 0.1); border-radius:25px; padding:15px; margin-bottom:15px; border:1px solid rgba(30, 215, 96, 0.1); }
        .bar-bg { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin:12px 0 6px; position:relative; }
        .bar-fill { height:100%; background:#1db954; width:0%; border-radius:10px; transition: width 0.5s linear; }
        .time-info { display:flex; justify-content:space-between; font-size:10px; font-weight:800; opacity:0.6; }

        .social-grid { display:flex; justify-content:center; gap:25px; margin:30px 0; border-top:1px solid rgba(255,255,255,0.05); padding-top:25px; }
        .s-link { text-decoration:none; color:inherit; text-align:center; transition:0.3s; }
        .s-link:hover { transform: translateY(-3px); opacity: 0.8; }
        .s-link i { font-size:24px; margin-bottom:5px; display:block; }
        .s-desc { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:1px; opacity:0.4; }

        .msg-container { 
            background:var(--card); border-radius:35px; padding:25px; margin-top:20px; width:100%; 
            box-sizing:border-box; border:1px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px);
        }
        .msg-bubble { background:rgba(255,255,255,0.03); padding:15px; border-radius:22px; margin-bottom:12px; border-left:4px solid var(--accent); }

        .input-field { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:15px; padding:12px; color:var(--text); margin-bottom:10px; outline:none; font-family:inherit; box-sizing: border-box; }

        .nav-bar { position:fixed; top:25px; width:100%; max-width:420px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; box-sizing:border-box; }
        .nav-btn { width:52px; height:52px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:0.3s; color:#777; backdrop-filter: blur(5px); }
        .nav-btn.active { color:#ff4757; transform:scale(1.1); }

        .status-badge { position:absolute; bottom:8px; right:8px; width:22px; height:22px; border-radius:50%; border:4px solid var(--card); z-index:4; }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
        
        #theme-icon { transition: transform 0.5s ease; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="nav-bar">
        <div class="nav-btn" id="btn-like"><i class="fa-solid fa-heart"></i></div>
        <div class="nav-btn" id="btn-theme"><i id="theme-icon" class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div id="u-banner" class="banner"></div>
            <div style="padding:0 25px 30px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="https://via.placeholder.com/150">
                    <img id="u-decor" class="decoration" src="">
                    <div id="u-status" class="status-badge offline"></div>
                </div>
                <h2 id="u-nick" style="margin:0; font-weight:800; font-size:24px;">Valeinsiva</h2>
                <div id="u-tag" style="font-size:13px; opacity:0.4; margin-bottom:20px;">@valeinsiva.</div>

                <div class="engine-box" id="spot-area"></div>
                <div class="engine-box" id="game-area"></div>

                <div class="social-grid">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="s-link" style="color:var(--accent)">
                        <i class="fa-brands fa-discord"></i><span class="s-desc">Chat</span>
                    </a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="s-link" style="color:#E1306C">
                        <i class="fa-brands fa-instagram"></i><span class="s-desc">Social</span>
                    </a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="s-link" style="color:#00d2ff">
                        <i class="fa-solid fa-terminal"></i><span class="s-desc">Bot Panel</span>
                    </a>
                </div>

                <div style="display:flex; justify-content:space-around; font-size:11px; font-weight:700; opacity:0.4;">
                    <span><i class="fa-solid fa-eye"></i> <span id="view-txt">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="like-txt">0</span></span>
                    <span><i class="fa-solid fa-earth-americas"></i> TR</span>
                </div>
            </div>
        </div>

        <div class="msg-container">
            <h4 style="margin:0 0 15px 0; font-size:14px; opacity:0.6;"><i class="fa-solid fa-paper-plane"></i> Mesajlar</h4>
            <div id="msg-feed"></div>
            <div id="msg-form" style="margin-top:20px;">
                <input id="in-user" class="input-field" placeholder="Adınız...">
                <textarea id="in-text" class="input-field" style="height:70px; resize:none;" placeholder="Mesajınız..."></textarea>
                <button id="send-btn" onclick="sendMsg()" style="width:100%; background:var(--accent); color:white; border:none; padding:15px; border-radius:18px; cursor:pointer; font-weight:800; transition:0.3s;">MESAJ GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentData = null;

        // Sayfa yüklenince istatistikleri çek (Beğeni sayısının hep görünmesi için)
        function updateStats() {
            fetch('/api/stats').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes || 0;
                document.getElementById("view-txt").innerText = d.views || 0;
            });
        }

        const hasLiked = localStorage.getItem('v_liked');
        if(hasLiked) document.getElementById('btn-like').classList.add('active');

        function fmt(ms) {
            if(!ms || ms < 0) return "00:00";
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        function getTimeAgo(time) {
            const diff = Math.floor((Date.now() - time) / 1000);
            if(diff < 60) return 'şimdi';
            return Math.floor(diff/60) + ' dk önce';
        }

        socket.on("presence", data => {
            currentData = data;
            const u = data.discord_user;
            
            document.getElementById("u-nick").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            // Discord v9/v10 Banner API Fix
            const banner = document.getElementById("u-banner");
            if(u.banner) {
                const isGif = u.banner.startsWith("a_");
                const bannerUrl = \`https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${isGif ? 'gif' : 'png'}?size=1024\`;
                banner.style.backgroundImage = \`url('\${bannerUrl}')\`;
                banner.style.backgroundColor = "transparent";
            } else if(u.banner_color) {
                banner.style.backgroundImage = "none";
                banner.style.backgroundColor = u.banner_color;
            }

            // Dekor
            const decor = document.getElementById("u-decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            document.getElementById("u-status").className = "status-badge " + (data.discord_status || "offline");
            
            // Spotify UI
            const spot = data.spotify || data.lastSpotify;
            if(spot) {
                document.getElementById("spot-area").innerHTML = \`
                <div class="spot-card">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <img src="\${spot.album_art_url}" style="width:50px; height:50px; border-radius:15px;">
                        <div style="text-align:left; overflow:hidden;">
                            <div style="font-size:10px; font-weight:800; color:#1db954;">\${data.spotify ? 'DİNLENİYOR' : 'SON DİNLENEN'}</div>
                            <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${spot.song}</div>
                            <div style="font-size:11px; opacity:0.5;">\${spot.artist}</div>
                        </div>
                    </div>
                    <div class="bar-bg"><div id="s-fill" class="bar-fill"></div></div>
                    <div class="time-info"><span id="s-cur">00:00</span><span id="s-tot">00:00</span></div>
                </div>\`;
            }
        });

        setInterval(() => {
            if(currentData?.spotify) {
                const total = currentData.spotify.timestamps.end - currentData.spotify.timestamps.start;
                const elapsed = Date.now() - currentData.spotify.timestamps.start;
                const pct = Math.max(0, Math.min((elapsed / total) * 100, 100));
                if(document.getElementById("s-fill")) document.getElementById("s-fill").style.width = pct + "%";
                if(document.getElementById("s-cur")) document.getElementById("s-cur").innerText = fmt(elapsed);
                if(document.getElementById("s-tot")) document.getElementById("s-tot").innerText = fmt(total);
            }
        }, 1000);

        function sendMsg() {
            if(localStorage.getItem('v_msg_sent')) return;
            const u = document.getElementById('in-user').value;
            const t = document.getElementById('in-text').value;
            if(u && t) { 
                socket.emit('send_msg', {user:u, text:t});
                localStorage.setItem('v_msg_sent', 'true');
                document.getElementById('msg-form').innerHTML = '<div style="text-align:center; opacity:0.4; font-size:12px;">Mesajınız iletildi!</div>';
            }
        }

        socket.on('init_messages', renderMsgs);
        socket.on('new_msg', renderMsgs);
        function renderMsgs(m) {
            document.getElementById("msg-feed").innerHTML = m.map(x => \`
                <div class="msg-bubble">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <b style="color:var(--accent); font-size:12px;">\${x.user}</b>
                        <span style="font-size:9px; opacity:0.4;">\${getTimeAgo(x.time)}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.8;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("btn-like").onclick = function() {
            if(localStorage.getItem('v_liked')) return;
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("like-txt").innerText = d.likes;
                this.classList.add('active');
                localStorage.setItem('v_liked', 'true');
            });
        };

        document.getElementById("btn-theme").onclick = function() {
            const h = document.documentElement;
            const icon = document.getElementById("theme-icon");
            const isDark = h.getAttribute("data-theme") === "dark";
            h.setAttribute("data-theme", isDark ? "light" : "dark");
            icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
        };

        window.onload = () => {
            updateStats();
            fetch('/api/view').then(r=>r.json()).then(d => {
                document.getElementById("view-txt").innerText = d.views;
            });
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
