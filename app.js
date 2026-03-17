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

let db = { views: 0, likes: 0, lastSpotify: null, messages: [] };
let cachedData = null;
let cooldowns = {}; 

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
            await axios.put(url, { message: "💎 Elite Sync Final", content: newContent, sha: sha }, { headers });
        }
    } catch (e) { console.error("GitHub Sync Error"); }
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
        if (cooldowns[userIp] && (Date.now() - cooldowns[userIp] < 300000)) return;
        if(!data.user || !data.text) return;
        
        db.messages.unshift({ user: data.user.substring(0,12), text: data.text.substring(0,60), time: Date.now() });
        db.messages = db.messages.slice(0, 4);
        cooldowns[userIp] = Date.now();
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
    <title>Valeinsiva | Profile</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        :root { --accent: #7289da; --bg: #030303; --card: rgba(18, 18, 18, 0.95); --text: #fff; --dev: #00d2ff; }
        [data-theme="light"] { --bg: #f0f0f2; --card: #ffffff; --text: #111; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; }
        .wrapper { width:100%; max-width:400px; padding:70px 15px 40px; box-sizing: border-box; }
        
        .main-card { background:var(--card); border-radius:35px; border:1px solid rgba(255,255,255,0.06); overflow:hidden; position:relative; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .banner { height:150px; width:100%; background-size:cover; background-position:center; background-color:#111; transition: 0.5s; }
        
        .avatar-area { position:relative; width:100px; height:100px; margin:-50px auto 10px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); z-index:2; position:relative; object-fit: cover; }
        .decoration { position:absolute; inset:-12%; width:124%; z-index:3; pointer-events:none; }

        /* Spotify Ufak & Sabit */
        .spot-mini { background:rgba(255,255,255,0.02); border-radius:20px; padding:12px; margin:10px 15px; border:1px solid rgba(255,255,255,0.05); }
        .bar-bg { height:4px; background:rgba(255,255,255,0.1); border-radius:10px; margin:10px 0 4px; overflow:hidden; }
        .bar-fill { height:100%; background:#1db954; width:0%; transition: width 1s linear; }

        /* Mesaj Kutusu Estetik */
        .msg-section { background:var(--card); border-radius:30px; padding:15px; margin-top:12px; border:1px solid rgba(255,255,255,0.05); }
        .msg-item { background:rgba(255,255,255,0.02); padding:10px 12px; border-radius:15px; margin-bottom:8px; border-left: 3px solid var(--dev); font-size:12px; }

        .input-mini { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px; color:var(--text); margin-bottom:8px; outline:none; font-family:inherit; font-size:13px; box-sizing: border-box; }
        
        #send-btn { width:100%; background:var(--dev); color:#000; border:none; padding:12px; border-radius:12px; cursor:pointer; font-weight:800; font-size:13px; }

        /* Sosyal Butonlar & Yazılar */
        .social-flex { display:flex; justify-content:center; gap:25px; margin:15px 0; }
        .s-box { text-align:center; text-decoration:none; color:inherit; opacity:0.7; transition:0.3s; }
        .s-box i { font-size:22px; display:block; margin-bottom:4px; }
        .s-box span { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .s-box:hover { opacity:1; transform:translateY(-2px); }

        /* Animasyonlu Tema Butonu */
        .nav-float { position:fixed; top:20px; width:100%; max-width:400px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; box-sizing: border-box; }
        .btn-circle { width:45px; height:45px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:0.5s; color:#777; }
        .btn-circle i { transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .active-heart { color:#ff4757 !important; transform: scale(1.1); }

        .status-dot { position:absolute; bottom:5px; right:5px; width:18px; height:18px; border-radius:50%; border:3px solid var(--card); z-index:4; }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
    </style>
</head>
<body>
    <div class="nav-float">
        <div class="btn-circle" id="like-btn"><i class="fa-solid fa-heart"></i></div>
        <div class="btn-circle" id="theme-btn"><i class="fa-solid fa-moon"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div id="u-banner" class="banner"></div>
            <div style="padding:0 0 15px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decoration" src="">
                    <div id="u-status" class="status-dot"></div>
                </div>
                <h3 id="u-name" style="margin:0; font-weight:800;">Valeinsiva</h3>
                <div style="font-size:11px; opacity:0.3; margin-bottom:10px;">@valeinsiva.</div>

                <div id="spotify-ui"></div>

                <div class="social-flex">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="s-box" style="color:var(--accent)">
                        <i class="fa-brands fa-discord"></i><span>Discord</span>
                    </a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" class="s-box" style="color:#E1306C">
                        <i class="fa-brands fa-instagram"></i><span>Instagram</span>
                    </a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" class="s-box" style="color:var(--dev)">
                        <i class="fa-solid fa-code"></i><span>Developer</span>
                    </a>
                </div>

                <div style="display:flex; justify-content:center; gap:20px; font-size:10px; font-weight:700; opacity:0.3; border-top:1px solid rgba(255,255,255,0.03); padding-top:10px;">
                    <span><i class="fa-solid fa-eye"></i> <span id="v-count">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="l-count">0</span> Beğeni</span>
                </div>
            </div>
        </div>

        <div class="msg-section">
            <div id="msg-list"></div>
            <div style="margin-top:15px;">
                <input id="in-name" class="input-mini" placeholder="Adınız">
                <textarea id="in-text" class="input-mini" style="height:50px; resize:none;" placeholder="Kısa bir not bırak..."></textarea>
                <button id="send-btn" onclick="handleSend()">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let lanyard = null;
        let cd = 0;

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
            
            // Banner Fix
            const b = document.getElementById("u-banner");
            if(u.banner) {
                const ext = u.banner.startsWith("a_") ? "gif" : "png";
                b.style.backgroundImage = \`url(https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${ext}?size=1024)\`;
            } else { b.style.backgroundColor = u.banner_color || "#111"; b.style.backgroundImage = "none"; }

            const d = document.getElementById("u-decor");
            if(u.avatar_decoration_data) {
                d.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                d.style.display = "block";
            } else { d.style.display = "none"; }

            document.getElementById("u-status").className = "status-dot " + data.discord_status;
            
            const s = data.spotify || data.lastSpotify;
            if(s) {
                document.getElementById("spotify-ui").innerHTML = \`
                <div class="spot-mini">
                    <div style="display:flex; gap:10px; align-items:center; text-align:left;">
                        <img src="\${s.album_art_url}" style="width:40px; height:40px; border-radius:10px;">
                        <div style="overflow:hidden; flex:1;">
                            <div style="font-size:12px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${s.song}</div>
                            <div style="font-size:10px; opacity:0.5;">\${s.artist}</div>
                        </div>
                    </div>
                    <div class="bar-bg"><div id="s-fill" class="bar-fill"></div></div>
                </div>\`;
            }
        });

        setInterval(() => {
            if(lanyard?.spotify) {
                const total = lanyard.spotify.timestamps.end - lanyard.spotify.timestamps.start;
                const elapsed = Date.now() - lanyard.spotify.timestamps.start;
                const pct = Math.max(0, Math.min((elapsed / total) * 100, 100));
                const bar = document.getElementById("s-fill");
                if(bar) bar.style.width = pct + "%";
            }
            if(cd > 0) {
                cd -= 1000;
                const b = document.getElementById("send-btn");
                b.disabled = true; b.innerText = fmt(cd);
            } else {
                const b = document.getElementById("send-btn");
                b.disabled = false; b.innerText = "GÖNDER";
            }
        }, 1000);

        function handleSend() {
            const n = document.getElementById('in-name').value;
            const t = document.getElementById('in-text').value;
            if(n && t && cd <= 0) { socket.emit('send_msg', {user:n, text:t}); cd = 300000; }
        }

        socket.on('init_messages', render);
        socket.on('new_msg', render);
        function render(arr) {
            document.getElementById("msg-list").innerHTML = arr.map(x => \`
                <div class="msg-item">
                    <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                        <b style="color:var(--dev)">\${x.user}</b>
                        <span style="opacity:0.3; font-size:9px;">\${new Date(x.time).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style="opacity:0.8;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("like-btn").onclick = function() {
            fetch('/api/like').then(r=>r.json()).then(d => {
                document.getElementById("l-count").innerText = d.likes;
                this.classList.add('active-heart');
            });
        };

        document.getElementById("theme-btn").onclick = function() {
            const h = document.documentElement;
            const i = this.querySelector('i');
            const isDark = h.getAttribute("data-theme") === "dark";
            
            i.style.transform = "rotate(360deg) scale(0)";
            setTimeout(() => {
                h.setAttribute("data-theme", isDark ? "light" : "dark");
                i.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                i.style.transform = "rotate(0deg) scale(1)";
            }, 250);
        };

        window.onload = () => {
            fetch('/api/view').then(r=>r.json()).then(d => {
                document.getElementById("v-count").innerText = d.views;
                document.getElementById("l-count").innerText = d.likes;
            });
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
