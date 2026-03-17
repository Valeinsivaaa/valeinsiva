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

let db = { views: 0, likes: 0, lastSpotify: null, lastGame: null, messages: [] };
let cachedData = null;
let lastMessageTime = {}; 

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
            await axios.put(url, { message: "💎 Elite Sync v6", content: newContent, sha: sha }, { headers });
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
        if (lastMessageTime[userIp] && (now - lastMessageTime[userIp] < 300000)) return;

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
        :root { --accent: #7289da; --bg: #030303; --card: rgba(18, 18, 18, 0.98); --text: #fff; --dev: #00d2ff; }
        
        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg); color:var(--text); transition: 0.5s; overflow-x:hidden; display:flex; flex-direction:column; align-items:center; }
        .wrapper { width:100%; max-width:420px; padding:80px 12px 40px; box-sizing: border-box; }
        
        .main-card { background:var(--card); border-radius:40px; border:1px solid rgba(255,255,255,0.06); overflow:hidden; position:relative; width: 100%; box-shadow: 0 0 40px rgba(0,210,255,0.05); }
        .banner-container { height:170px; width:100%; background-size:cover; background-position:center; position:relative; background-color: #111; }
        
        .avatar-area { position:relative; width:110px; height:110px; margin:-55px auto 10px; }
        .avatar { width:100%; height:100%; border-radius:50%; border:5px solid var(--card); z-index:2; position:relative; object-fit: cover; }
        .decoration { position:absolute; inset:-12%; width:124%; z-index:3; pointer-events:none; }

        /* Spotify Mobil Uyum */
        .spot-card { background:rgba(255,255,255,0.02); border-radius:22px; padding:15px; margin:15px; border:1px solid rgba(255,255,255,0.04); }
        .bar-bg { height:5px; background:rgba(255,255,255,0.1); border-radius:10px; margin:12px 0 6px; overflow:hidden; }
        .bar-fill { height:100%; background:#1db954; width:0%; transition: width 0.5s linear; }
        .time-txt { display:flex; justify-content:space-between; font-size:10px; font-weight:800; opacity:0.4; }

        /* Mesaj Alanı */
        .msg-section { background:var(--card); border-radius:35px; padding:20px; margin-top:15px; width:100%; box-sizing: border-box; border:1px solid rgba(255,255,255,0.06); }
        .msg-item { background:rgba(255,255,255,0.02); padding:12px 15px; border-radius:18px; margin-bottom:10px; border-left: 3px solid var(--dev); animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        .input-box { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:15px; padding:12px; color:var(--text); margin-bottom:10px; outline:none; box-sizing: border-box; font-family: inherit; }
        
        #send-btn { width:100%; background:var(--dev); color:#000; border:none; padding:14px; border-radius:15px; cursor:pointer; font-weight:800; transition:0.3s; }
        #send-btn:disabled { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); cursor: not-allowed; }

        /* Nav */
        .top-nav { position:fixed; top:20px; width:100%; max-width:420px; display:flex; justify-content:space-between; padding:0 20px; z-index:1000; box-sizing: border-box; }
        .nav-icon { width:48px; height:48px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); color:#666; cursor:pointer; }
        .nav-icon.active { color:#ff4757; border-color:#ff4757; }

        .status-dot { position:absolute; bottom:6px; right:6px; width:20px; height:20px; border-radius:50%; border:4px solid var(--card); z-index:4; }
        .online { background:#23a55a; } .idle { background:#f0b232; } .dnd { background:#f23f43; } .offline { background:#80848e; }
    </style>
</head>
<body>
    <div class="top-nav">
        <div class="nav-icon" id="like-btn"><i class="fa-solid fa-heart"></i></div>
        <div class="nav-icon" onclick="document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')"><i class="fa-solid fa-circle-half-stroke"></i></div>
    </div>

    <div class="wrapper">
        <div class="main-card">
            <div id="u-banner" class="banner-container"></div>
            <div style="padding:0 0 20px; text-align:center;">
                <div class="avatar-area">
                    <img id="u-avatar" class="avatar" src="">
                    <img id="u-decor" class="decoration" src="">
                    <div id="u-status" class="status-dot"></div>
                </div>
                <h2 id="u-name" style="margin:0; font-weight:800; letter-spacing:-1px;">Valeinsiva</h2>
                <div id="u-tag" style="font-size:12px; opacity:0.3; margin-bottom:15px;">@valeinsiva.</div>

                <div id="spotify-box"></div>

                <div style="display:flex; justify-content:center; gap:35px; margin:20px 0;">
                    <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" style="color:var(--accent); text-decoration:none;"><i class="fa-brands fa-discord fa-xl"></i></a>
                    <a href="${INSTAGRAM_LINK}" target="_blank" style="color:#E1306C; text-decoration:none;"><i class="fa-brands fa-instagram fa-xl"></i></a>
                    <a href="${BOT_PANEL_LINK}" target="_blank" style="color:var(--dev); text-decoration:none;"><i class="fa-solid fa-code fa-xl"></i></a>
                </div>

                <div style="display:flex; justify-content:center; gap:25px; font-size:11px; font-weight:700; opacity:0.3;">
                    <span><i class="fa-solid fa-eye"></i> <span id="v-count">0</span></span>
                    <span><i class="fa-solid fa-heart"></i> <span id="l-count">0</span></span>
                </div>
            </div>
        </div>

        <div class="msg-section">
            <h4 style="margin:0 0 15px 0; font-size:13px; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">Mesajlar</h4>
            <div id="msg-list"></div>
            <div style="margin-top:20px;">
                <input id="in-name" class="input-box" placeholder="İsminiz">
                <textarea id="in-text" class="input-box" style="height:70px; resize:none;" placeholder="Mesajınızı buraya bırakın..."></textarea>
                <button id="send-btn" onclick="handleSend()">GÖNDER</button>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let lanyard = null;
        let cooldown = 0;

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
            
            // BANNER KESİN ÇÖZÜM
            const bannerDiv = document.getElementById("u-banner");
            if(u.banner) {
                const isGif = u.banner.startsWith("a_");
                bannerDiv.style.backgroundImage = \`url(https://cdn.discordapp.com/banners/\${u.id}/\${u.banner}.\${isGif ? 'gif' : 'png'}?size=1024)\`;
            } else if(u.banner_color) {
                bannerDiv.style.backgroundColor = u.banner_color;
                bannerDiv.style.backgroundImage = "none";
            }

            const decor = document.getElementById("u-decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            document.getElementById("u-status").className = "status-dot " + data.discord_status;
            
            const s = data.spotify || data.lastSpotify;
            if(s) {
                document.getElementById("spotify-box").innerHTML = \`
                <div class="spot-card">
                    <div style="display:flex; gap:12px; align-items:center; text-align:left;">
                        <img src="\${s.album_art_url}" style="width:50px; height:50px; border-radius:12px;">
                        <div style="overflow:hidden;">
                            <div style="font-size:9px; font-weight:800; color:#1db954;">\${data.spotify ? 'DİNLENİYOR' : 'SON DİNLENEN'}</div>
                            <div style="font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${s.song}</div>
                            <div style="font-size:11px; opacity:0.5;">\${s.artist}</div>
                        </div>
                    </div>
                    <div class="bar-bg"><div id="s-fill" class="bar-fill"></div></div>
                    <div class="time-txt"><span id="s-cur">00:00</span><span id="s-tot">00:00</span></div>
                </div>\`;
            }
        });

        setInterval(() => {
            if(lanyard?.spotify) {
                const total = lanyard.spotify.timestamps.end - lanyard.spotify.timestamps.start;
                const elapsed = Date.now() - lanyard.spotify.timestamps.start;
                const pct = Math.max(0, Math.min((elapsed / total) * 100, 100));
                if(document.getElementById("s-fill")) document.getElementById("s-fill").style.width = pct + "%";
                if(document.getElementById("s-cur")) document.getElementById("s-cur").innerText = fmt(elapsed);
                if(document.getElementById("s-tot")) document.getElementById("s-tot").innerText = fmt(total);
            }
            // Geri sayım motoru
            if(cooldown > 0) {
                cooldown -= 1000;
                const btn = document.getElementById("send-btn");
                btn.disabled = true;
                btn.innerText = fmt(cooldown);
            } else if(cooldown <= 0) {
                const btn = document.getElementById("send-btn");
                btn.disabled = false;
                btn.innerText = "GÖNDER";
            }
        }, 1000);

        function handleSend() {
            const n = document.getElementById('in-name').value;
            const t = document.getElementById('in-text').value;
            if(n && t && cooldown <= 0) { 
                socket.emit('send_msg', {user:n, text:t});
                cooldown = 300000; // 5 Dakika
            }
        }

        socket.on('init_messages', r);
        socket.on('new_msg', r);
        function r(arr) {
            document.getElementById("msg-list").innerHTML = arr.map(x => \`
                <div class="msg-item">
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                        <b style="color:var(--dev)">\${x.user}</b>
                        <span style="opacity:0.3">\${new Date(x.time).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.8;">\${x.text}</div>
                </div>\`).join('');
        }

        document.getElementById("like-btn").onclick = function() {
            fetch('/api/like').then(res=>res.json()).then(d => {
                document.getElementById("l-count").innerText = d.likes;
                this.classList.add('active');
            });
        };

        window.onload = () => {
            fetch('/api/view').then(res=>res.json()).then(d => document.getElementById("v-count").innerText = d.views);
        };
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
