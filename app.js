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
const BANNER_URL = "https://cdn.discordapp.com/attachments/1475226794943844432/1482767286732328980/SPOILER_Screenshot_20260315_182002_Gallery-1.jpg?ex=69b82625&is=69b6d4a5&hm=1823322bd44acc69d7e1897fe92b195d20a849423d75daf4c3f809f4d07e7994&"; 
const BOT_PANEL_URL = "https://valeinsiva.com.tr";
const DB_FILE = "./views.json";
// ---------------

// Veritabanı Kontrolü
function getStats() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ views: 0, likes: 0 }));
        return { views: 0, likes: 0 };
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE));
    } catch (e) { return { views: 0, likes: 0 }; }
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
setInterval(updateCache, 2000);

// Kalp Atma İsteği
app.get("/api/like", (req, res) => {
    let stats = getStats();
    stats.likes = (stats.likes || 0) + 1;
    fs.writeFileSync(DB_FILE, JSON.stringify(stats));
    res.json({ success: true, likes: stats.likes });
});

app.get("/", (req, res) => {
    // Sayfa her yüklendiğinde görüntülenmeyi arttır
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

        :root { 
            --profile-color: #7289da;
            --bg-color: #050505;
            --card-bg: rgba(15, 15, 15, 0.75);
            --text-color: #ffffff;
            --sub-text: rgba(255, 255, 255, 0.4);
        }

        [data-theme="light"] {
            --bg-color: #ffffff;
            --card-bg: rgba(240, 240, 240, 0.8);
            --text-color: #1a1a1a;
            --sub-text: rgba(0, 0, 0, 0.5);
        }

        body {
            margin: 0; padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--bg-color); color: var(--text-color);
            display: flex; justify-content: center; align-items: center;
            height: 100vh; overflow: hidden;
            transition: all 0.5s ease;
        }

        .bg-wrap { position: fixed; inset: 0; z-index: -1; background: var(--bg-color); overflow: hidden; }
        .orb {
            position: absolute; border-radius: 50%;
            filter: blur(100px); opacity: 0.3;
            background: var(--profile-color);
            animation: moveOrb 15s infinite alternate ease-in-out;
        }
        @keyframes moveOrb {
            0% { transform: translate(-20%, -20%) scale(1); }
            100% { transform: translate(120%, 120%) scale(1.6); }
        }

        /* SOL ÜST KALP BUTONU */
        .like-btn {
            position: fixed; top: 25px; left: 25px;
            width: 55px; height: 55px;
            background: var(--card-bg); backdrop-filter: blur(10px);
            border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 1000;
            transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .like-btn i { font-size: 22px; color: #888; transition: 0.3s; }
        .like-btn.liked i { color: #ff4757; animation: heartPop 0.4s ease; }
        @keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        .like-btn:hover { transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 71, 87, 0.3); }

        /* SAĞ ÜST TEMA TOGGLE */
        .theme-toggle {
            position: fixed; top: 25px; right: 25px;
            width: 55px; height: 55px;
            background: var(--card-bg); backdrop-filter: blur(10px);
            border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 1000; transition: 0.6s;
        }

        .main-card {
            width: 380px; background: var(--card-bg);
            backdrop-filter: blur(30px); border-radius: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 40px -10px var(--profile-color);
            position: relative; overflow: hidden;
        }

        .banner-box { width: 100%; height: 165px; overflow: hidden; }
        .banner-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8); }

        .profile-content { padding: 0 25px 25px; text-align: center; }

        .avatar-wrap {
            position: relative; width: 110px; height: 110px;
            margin: -65px auto 15px; z-index: 10;
        }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 6px solid var(--card-bg); transition: 0.3s; }
        .decor-img { position: absolute; inset: -16%; width: 132%; height: 132%; z-index: 11; }

        .status {
            position: absolute; bottom: 8px; right: 8px; width: 18px; height: 18px;
            border-radius: 50%; border: 4px solid var(--card-bg); z-index: 12;
        }
        .online { background: #23a55a; } .idle { background: #f0b232; } .dnd { background: #f23f43; } .offline { background: #80848e; }

        .display-name { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
        .username { font-size: 14px; color: var(--sub-text); margin-bottom: 20px; }

        .card {
            background: rgba(120, 120, 120, 0.1); border-radius: 20px;
            padding: 15px; display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(255,255,255,0.05); text-align: left;
            margin-bottom: 10px; transition: 0.3s;
        }
        .card:hover { background: rgba(120, 120, 120, 0.15); }
        .s-bar-container { height: 5px; background: rgba(0,0,0,0.2); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .s-bar-fill { height: 100%; background: var(--profile-color); border-radius: 10px; }

        .socials { display: flex; justify-content: center; gap: 45px; margin-top: 25px; }
        .social-item { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: var(--text-color); transition: 0.3s; }
        .social-item:hover { color: var(--profile-color); transform: translateY(-5px); }

        .footer { margin-top: 25px; font-size: 11px; color: var(--sub-text); display: flex; justify-content: center; gap: 15px; }
        .stat-item { display: flex; align-items: center; gap: 5px; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>

    <div class="like-btn" id="like-btn" title="Kalp At">
        <i class="fa-solid fa-heart"></i>
    </div>

    <div class="theme-toggle" id="theme-btn" title="Temayı Değiştir">
        <i class="fa-solid fa-moon"></i>
    </div>

    <div class="main-card">
        <div class="banner-box"><img src="${BANNER_URL}" class="banner-img"></div>
        <div class="profile-content">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status offline"></div>
            </div>
            <div id="display-name" class="display-name">Valeinsiva</div>
            <div class="username">@valeinsiva.</div>
            
            <div id="act-stack" style="min-height: 80px;">
                <div style="font-size: 13px; color: var(--sub-text); font-style: italic;">Yükleniyor...</div>
            </div>

            <div class="socials">
                <a href="${BOT_PANEL_URL}" target="_blank" class="social-item"><i class="fa-solid fa-layer-group fa-xl"></i><span>Bot Panel</span></a>
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-item"><i class="fa-brands fa-discord fa-xl"></i><span>Profil</span></a>
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
        const themeBtn = document.getElementById("theme-btn");
        const likeBtn = document.getElementById("like-btn");
        const html = document.documentElement;

        // Kalp Atma Fonksiyonu
        likeBtn.onclick = () => {
            if(likeBtn.classList.contains('liked')) return;
            fetch('/api/like').then(r => r.json()).then(data => {
                if(data.success) {
                    document.getElementById('like-count').innerText = data.likes;
                    likeBtn.classList.add('liked');
                }
            });
        };

        // Tema Değiştirme
        themeBtn.onclick = () => {
            const isDark = html.getAttribute("data-theme") === "dark";
            html.setAttribute("data-theme", isDark ? "light" : "dark");
            themeBtn.style.transform = "rotate(360deg)";
            themeBtn.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
            setTimeout(() => themeBtn.style.transform = "rotate(0deg)", 600);
        };

        // Arka plan animasyon topları
        const bg = document.getElementById('bg-canvas');
        for(let i=0; i<5; i++) {
            let orb = document.createElement('div');
            orb.className = 'orb';
            orb.style.width = (400 + Math.random() * 200) + 'px';
            orb.style.height = orb.style.width;
            orb.style.left = Math.random() * 80 + '%';
            orb.style.top = Math.random() * 80 + '%';
            orb.style.animationDelay = (i * 2) + 's';
            bg.appendChild(orb);
        }

        socket.on("presence", data => {
            const u = data.discord_user;
            const themeColor = u.accent_color ? '#' + u.accent_color.toString(16).padStart(6, '0') : '#7289da';
            document.documentElement.style.setProperty('--profile-color', themeColor);
            document.getElementById("avatar").src = \`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png?size=256\`;
            document.getElementById("status").className = "status " + data.discord_status;
            
            const decor = document.getElementById("decor");
            if(u.avatar_decoration_data) {
                decor.src = \`https://cdn.discordapp.com/avatar-decoration-presets/\${u.avatar_decoration_data.asset}.png\`;
                decor.style.display = "block";
            } else { decor.style.display = "none"; }

            let acts = "";
            if(data.spotify) {
                const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
                const elapsed = Math.min(Date.now() - data.spotify.timestamps.start, total);
                acts += \`<div class="card"><img src="\${data.spotify.album_art_url}" style="width:50px; border-radius:10px;"><div style="flex:1"><div style="font-weight:700; font-size:13px;">\${data.spotify.song}</div><div style="font-size:11px; color:var(--sub-text)">\${data.spotify.artist}</div><div class="s-bar-container"><div class="s-bar-fill" style="width:\${(elapsed/total)*100}%"></div></div></div><i class="fa-brands fa-spotify" style="color:#1db954; font-size:18px"></i></div>\`;
            }
            const game = data.activities.find(a => a.type === 0);
            if(game) acts += \`<div class="card"><div style="width:45px; height:45px; background:var(--profile-color); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;"><i class="fa-solid fa-gamepad"></i></div><div style="flex:1"><div style="font-weight:700; font-size:13px;">\${game.name}</div><div style="font-size:11px; color:var(--sub-text)">\${game.details || 'Oynuyor'}</div></div></div>\`;
            
            document.getElementById("act-stack").innerHTML = acts || '<div style="font-size: 13px; color: var(--sub-text); font-style: italic;">Şu an bir aktivite yok...</div>';
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log("Site 3000 portunda aktif!"));
