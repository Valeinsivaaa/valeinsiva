const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- KONFİGÜRASYON ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = "Valeinsivaaa"; 
const REPO_NAME = "valeinsiva"; 
const FILE_PATH = "views.json";
const DISCORD_ID = "877946035408891945";
const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com"; 
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo"; 

let db = { views: 0, likes: 0, lastSpotify: null, lastGame: null, messages: [] };
let cachedData = null;
let lastMessageTime = {}; // IP tabanlı 5 dakika sınırı için

async function syncWithGithub(isUpdate = false) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const headers = { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" };
        const getRes = await axios.get(url, { headers }).catch(() => null);
        if (!isUpdate && getRes) {
            db = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString());
            return;
        }
        if (isUpdate) {
            const sha = getRes ? getRes.data.sha : null;
            const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
            await axios.put(url, { message: "💎 Elite Sync v5", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Error"); }
}

setInterval(async () => {
    try {
        const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        cachedData = r.data.data;
        if(cachedData.spotify) db.lastSpotify = cachedData.spotify;
        io.emit("presence", { ...cachedData, lastSpotify: db.lastSpotify });
    } catch (e) {}
}, 4000);

syncWithGithub();

app.get("/api/like", async (req, res) => {
    db.likes++; await syncWithGithub(true);
    res.json({ success: true, likes: db.likes });
});

app.get("/api/view", async (req, res) => {
    db.views++; await syncWithGithub(true);
    res.json({ success: true, views: db.views });
});

io.on("connection", (socket) => {
    socket.emit("init_messages", db.messages);
    socket.on("send_msg", async (data) => {
        const userIp = socket.handshake.address;
        const now = Date.now();
        
        if (lastMessageTime[userIp] && (now - lastMessageTime[userIp] < 300000)) {
            return socket.emit("error_msg", "5 dakika beklemen gerekiyor!");
        }

        if(!data.user || !data.text) return;
        db.messages.unshift({ user: data.user.substring(0,15), text: data.text.substring(0,80), time: now });
        db.messages = db.messages.slice(0, 5);
        lastMessageTime[userIp] = now;
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
    <title>Valeinsiva | Developer</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #030303; --card: rgba(15, 15, 15, 0.98); --text: #fff; --dev: #00d2ff; }
        [data-theme="light"] { --bg: #f5f5f7; --card: #ffffff; --text: #111; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; }
        .wrapper { width:100%; max-width:420px; padding:90px 15px 40px; }
        
        .main-card { background:var(--card); border-radius:45px; border:1px solid rgba(255,255,255,0.05); overflow:hidden; position:relative; box-shadow: 0 0 50px rgba(0,210,255,0.1); }
        .banner { height:180px; width:100%; background-size:cover; background-position:center; transition: background 0.8s ease; }
        
        .avatar-area { position:relative; width:120px; height:120px; margin:-65px auto 15px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:6px solid var(--card); z-index:2; position:relative; }
        .decoration { position:absolute; inset:-12%; width:124%; z-index:3; pointer-events:none; }

        /* Spotify Bar Fix */
        .spot-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:28px; padding:20px; margin:0 20px 15px; }
        .bar-container { height:6px; background:rgba(255,255,255,0.1); border-radius:10px; margin:15px 0 8px; overflow:hidden; }
        .bar-fill { height:100%; background:#1db954; width:0%; transition: width 0.3s linear; box-shadow: 0 0 10px #1db954; }
        .time-flex { display:flex; justify-content:space-between; font-size:10px; font-weight:800; opacity:0.5; font-family:monospace; }

        /* Social v2 */
        .social-row { display:flex; justify-content:center; gap:30px; margin:25px 0; padding:20px 0; border-top:1px solid rgba(255,255,255,0.03); }
        .s-item { text-decoration:none; color:inherit; text-align:center; transition:0.4s; }
        .s-item i { font-size:26px; display:block; margin-bottom:6px; }
        .s-item span { font-size:9px; font-weight:800; opacity:0.3; text-transform:uppercase; letter-spacing:1px; }
        .s-item:hover { transform:translateY(-5px); filter: drop-shadow(0 0 8px var(--dev)); }

        /* Mesaj Alanı v5 */
        .msg-box { background:var(--card); border-radius:38px; padding:25px; margin-top:20px; width:100%; border:1px solid rgba(255,255,255,0.05); }
        .msg-item { background:rgba(255,255,255,0.02); padding:15px; border-radius:22px; margin-bottom:12px; border-left: 4px solid var(--dev); animation: slide 0.5s ease; }
        @keyframes slide { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }

        .input-ui { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:15px; color:var(--text); margin-bottom:12px; outline:none; transition:0.3s; }
        .input-ui:focus { border-color:var(--dev); background:rgba(255,255,255,0.05); }

        /* Nav */
        .nav-float { position:fixed; top:25px; width:100%; max-width:420px; display:flex; justify-content:space-between; padding:0 25px; z-index:1000; }
        .btn-round { width:52px; height:52px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; color:#777; transition:0.4s; }
        .btn-round.liked { color:#ff4757; border-color:#ff4757; transform: scale(1.1); animation: heartBeat 0.5s infinite alternate; }
        @keyframes heartBeat { to { transform: scale(1.2); } }

        .status-dot { position:absolute; bottom:8px; right:8px; width:22px; height:22px; border-radius:50%; border:4px solid var(--card); z-index:4; }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
    </style>
</head>
<body>
    <div class="nav-float">
        <div class="btn-round" id="like-trigger"><i class="fa-solid fa-heart"></i></div>
        <div class="btn-round" id="theme-trigger"><i class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div id="u-banner" class="banner"></div>
            <div style="padding:0 0 30px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decoration" src="">
                    <div id="u-status" class="status-dot"></div>
                </div>
                <h2 id="u-name" style="margin:0; font-weight:800; letter-spacing:-1px; font-size:26px;">Valeinsiva</h2>
                <div id="u-tag" style="font-size:12px; opacity:0.3; margin-bottom:20px;">@valeinsiva.</div>

                <div id="spotify-container"></div>

                <div class="social-row">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="s-item" style="color:var(--accent)">
                        <i class="fa-brands fa-discord"></i><span>Discord</span>
                    </a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="s-item" style="color:#E1306C">
                        <i class="fa-brands fa-instagram"></i><span>Instagram</span>
                    </a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="s-item" style="color:var(--dev)">
                        <i class="fa-solid fa-code"></i><span>Developer</span>
                    </a>
                </div>

                <div style="display:flex; justify-content:center; gap:30px; font-size:11px; font-weight:800; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="v-count">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="l-count">0</span></span>
                </div>
            </div>
        </div>

        <div class="msg-box">
            <h4 style="margin:0 0 15px 0; opacity:0.5; font-size:13px; letter-spacing:1px;">FEELING STATUS</h4>
            <div id="msg-render"></div>
            <div style="margin-top:20px;" id="form-area">
                <input id="in-name" class="input-ui" placeholder="Adın">
                <textarea id="in-msg" class="input-ui" style="height:80px; resize:none;" placeholder="Mesaj bırak... (5 dk'da bir)"></textarea>
                <button onclick="handleSend()" style="width:100%; background:var(--dev); color:#000; border:none; padding:16px; border-radius:18px; cursor:pointer; font-weight:800;">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let lanyard = null;

        function fmt(ms) {
            if(!ms || ms < 0) return "00:00";
            const s = Math.floor(ms / 1000);
            return Math.floor(s/60).toString().padStart(2,'0') + ":" + (s%60).toString().padStart(2,'0');
        }

        socket.on("presence", data => {
            lanyard = data;
            const u = data.discord_user;
            
            document.getElementById("u-name").innerText = u.global_name || u.username;
            document.getElementById("u-avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            
            // BANNER v9 FIX
            const banner = document.getElementById("u-banner");
            if(u.banner) {
                const isGif = u.banner.startsWith("a_");
                banner.style.backgroundImage = \`url(https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${isGif ? 'gif' : 'png'}?size=1024)\`;
            } else {
                banner.style.backgroundColor = u.banner_color || "#111";
                banner.style.backgroundImage = "none";
            }

            // DEKOR
            const decor = document.getElementById("u-decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            document.getElementById("u-status").className = "status-dot " + data.discord_status;
            
            // SPOTIFY
            const s = data.spotify || data.lastSpotify;
            if(s) {
                document.getElementById("spotify-container").innerHTML = \`
                <div class="spot-card">
                    <div style="display:flex; gap:15px; align-items:center;">
                        <img src="\${s.album_art_url}" style="width:55px; height:55px; border-radius:18px; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
                        <div style="text-align:left; overflow:hidden;">
                            <div style="font-size:9px; font-weight:900; color:#1db954; margin-bottom:4px;">\${data.spotify ? 'ACTIVE NOW' : 'RECENTLY PLAYED'}</div>
                            <div style="font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${s.song}</div>
                            <div style="font-size:11px; opacity:0.5; font-weight:600;">\${s.artist}</div>
                        </div>
                    </div>
                    <div class="bar-container"><div id="bar-id" class="bar-fill"></div></div>
                    <div class="time-flex"><span id="c-time">00:00</span><span id="t-time">00:00</span></div>
                </div>\`;
            }
        });

        // SPOTIFY MOTORU (BUG-FREE)
        setInterval(() => {
            if(lanyard?.spotify) {
                const total = lanyard.spotify.timestamps.end - lanyard.spotify.timestamps.start;
                const progress = Date.now() - lanyard.spotify.timestamps.start;
                const perc = Math.max(0, Math.min((progress / total) * 100, 100));
                
                const bar = document.getElementById("bar-id");
                if(bar) bar.style.width = perc + "%";
                if(document.getElementById("c-time")) document.getElementById("c-time").innerText = fmt(progress);
                if(document.getElementById("t-time")) document.getElementById("t-time").innerText = fmt(total);
            }
        }, 1000);

        function handleSend() {
            const n = document.getElementById('in-name').value;
            const m = document.getElementById('in-msg').value;
            if(n && m) { socket.emit('send_msg', {user:n, text:m}); }
        }

        socket.on('error_msg', msg => alert(msg));
        socket.on('init_messages', render);
        socket.on('new_msg', render);

        function render(arr) {
            document.getElementById("msg-render").innerHTML = arr.map(x => \`
                <div class="msg-item">
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:5px;">
                        <b style="color:var(--dev)">\${x.user}</b>
                        <span style="opacity:0.3">\${new Date(x.time).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.8; line-height:1.5;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("like-trigger").onclick = function() {
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("l-count").innerText = d.likes;
                this.classList.add('liked');
            });
        };

        document.getElementById("theme-trigger").onclick = () => {
            const h = document.documentElement;
            const isDark = h.getAttribute("data-theme") === "dark";
            h.setAttribute("data-theme", isDark ? "light" : "dark");
        };

        window.onload = () => {
            fetch('/api/view').then(r=>r.json()).then(d => document.getElementById("v-count").innerText = d.views);
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
