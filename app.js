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
const BANNER_URL = "https://cdn.discordapp.com/attachments/1475226794943844432/1482766630663754016/SPOILER_Baslksz86_20260315183407.png?ex=69b82589&is=69b6d409&hm=e24ab15c66257729a7089f34df0423b6dd7f498db96d6178de5835fc17adb580&";
const BOT_PANEL_LINK = "https://valeinsiva.com.tr"; 
// ---------------

let stats = { views: 0, likes: 0 };
let cachedData = null;

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
            --card-bg: rgba(15, 15, 15, 0.75); 
            --text-color: #ffffff;
            --sub-text: rgba(255, 255, 255, 0.5);
        }
        [data-theme="light"] { 
            --bg-color: #f5f7fa; 
            --card-bg: rgba(255, 255, 255, 0.8); 
            --text-color: #1a1a1a;
            --sub-text: rgba(0, 0, 0, 0.5);
        }

        /* AKICI TEMA GEÇİŞİ İÇİN CSS */
        * { transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease; }

        body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:var(--bg-color); color:var(--text-color); display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; }
        .bg-wrap { position:fixed; inset:0; z-index:-1; overflow:hidden; }
        .orb { position:absolute; border-radius:50%; filter:blur(100px); opacity:0.3; background:var(--profile-color); animation:move 15s infinite alternate linear; }
        @keyframes move { 0% { transform: translate(-10%,-10%); } 100% { transform: translate(100%,100%); } }
        
        .main-card { 
            width:380px; background:var(--card-bg); backdrop-filter:blur(30px); border-radius:40px; 
            border:1px solid rgba(255, 255, 255, 0.1); box-shadow:0 30px 60px rgba(0,0,0,0.4); 
            overflow:hidden; position:relative; 
        }
        
        /* TEMA TOGGLE BUTONU - CSS */
        .theme-toggle { 
            position:fixed; top:25px; right:25px; width:52px; height:52px; background:var(--card-bg); 
            border-radius:50%; display:flex; align-items:center; justify-content:center; 
            cursor:pointer; z-index:100; border:1px solid rgba(255,255,255,0.1);
            /* Animasyon hızı ve pürüzsüzlüğü buradadır */
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-toggle i { font-size: 22px; color:var(--profile-color); transition: 0.3s ease; }
        .theme-toggle:active { transform: scale(0.9); } /* Tıklayınca hafifçe küçülme efekti */

        .social-link { text-decoration:none; color:var(--text-color); opacity:0.7; transition:0.3s; text-align:center; font-size:10px; display:flex; flex-direction:column; align-items:center; gap:5px; }
        .social-link:hover { opacity:1; color:var(--profile-color); transform:translateY(-3px); }
        .social-link span { font-size:10px; font-weight:bold; }
    </style>
</head>
<body>
    <div class="bg-wrap" id="bg-canvas"></div>
    <div class="like-btn" id="like-btn"><i class="fa-solid fa-heart fa-lg"></i></div>
    
    <div class="theme-toggle" id="theme-btn" title="Temayı Değiştir">
        <i class="fa-solid fa-moon"></i>
    </div>

    <div class="main-card">
        <div style="height:160px;"><img src="${BANNER_URL}" style="width:100%; height:100%; object-fit:cover;"></div>
        <div style="padding:0 25px 25px; text-align:center;">
            <div class="avatar-wrap">
                <img id="avatar" class="avatar">
                <img id="decor" class="decor-img" style="display:none;">
                <div id="status" class="status"></div>
            </div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-1px;">Valeinsiva</h2>
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
        const themeBtn = document.getElementById("theme-btn");
        const html = document.documentElement;
        let currentPresence = null;

        // --- TEMA DEĞİŞTİRME ANIMASYONU VE MANTIĞI ---
        themeBtn.addEventListener("click", () => {
            const isDark = html.getAttribute("data-theme") === "dark";
            
            // 1. Butonu tam 360 derece döndür
            themeBtn.style.transform = "rotate(360deg)";
            
            // 2. Dönüşün tam ortasında (0.3 saniye sonra) ikon ve temayı değiştir
            setTimeout(() => {
                html.setAttribute("data-theme", isDark ? "light" : "dark");
                themeBtn.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
            }, 300); // 300ms, dönüşün yarısıdır.

            // 3. Animasyon bittikten sonra dönüş açısını sıfırla (tekrar dönebilmesi için)
            setTimeout(() => {
                themeBtn.style.transition = "none"; // Sıfırlarken animasyonu kapat
                themeBtn.style.transform = "rotate(0deg)";
                // Transition'ı tekrar açmak için kısa bir gecikme
                setTimeout(() => themeBtn.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", 50);
            }, 600); // 600ms animasyon süresidir.
        });

        // Görüntü kodlarının geri kalanı aynı kalıyor...
        // ... (Lanyard Soket ve Sayaç Scriptleri) ...
    </script>
</body>
</html>
    `);
});

server.listen(process.env.PORT || 3000);
