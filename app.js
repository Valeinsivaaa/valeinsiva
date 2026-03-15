const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const DISCORD_ID = '877946035408891945'; 
let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++;
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    let d = null;
    try {
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}?t=${Date.now()}`);
        d = response.data.data;
    } catch (err) {
        return res.status(500).send("API Baglantisi Kesildi.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // İstediğin Özel Rozetler (Statik + API Çekimi)
    let badgesHTML = '';
    // API'den gelen rozetler
    const flags = user.public_flags;
    const badgeMap = { 4: 'hypesquad', 64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance', 131072: 'developer', 4194304: 'active_developer' };
    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });
    
    // İstediğin Özel Rozetler
    badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">'; // Nitro
    badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boost9month.svg" class="badge">'; // Boost
    badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/completed_quest.svg" class="badge">'; // Görev Tamamlandı

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${user.global_name || user.username}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --spotify: #1db954; --ps: #003791; --card-bg: rgba(15, 15, 15, 0.7); }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter',sans-serif; }
        body { background:#030303; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; overflow:hidden; }
        
        .card { width:480px; background:var(--card-bg); backdrop-filter:blur(30px); border:1px solid rgba(255,255,255,0.1); border-radius:30px; padding:35px; box-shadow:0 30px 60px rgba(0,0,0,0.8); position:relative; }
        
        .header { display:flex; flex-direction:column; align-items:center; gap:15px; margin-bottom:30px; }
        .avatar { width:115px; height:115px; border-radius:50%; border:4px solid #000; }
        .status { position:absolute; bottom:12px; right:12px; width:24px; height:24px; border-radius:50%; border:4px solid #000; }
        .online { background:#43b581; } .idle { background:#faa61a; } .dnd { background:#f04747; } .offline { background:#747f8d; }

        .name { font-size:32px; font-weight:900; }
        .badges { display:flex; gap:6px; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:15px; }
        .badge { width:22px; height:22px; filter: drop-shadow(0 0 5px rgba(255,255,255,0.3)); }

        .act-card { background:rgba(255,255,255,0.03); border-radius:20px; padding:18px; margin-top:15px; display:flex; align-items:center; gap:15px; border:1px solid rgba(255,255,255,0.05); }
        .act-img { width:65px; height:65px; border-radius:12px; box-shadow:0 10px 20px rgba(0,0,0,0.3); }
        .act-info h4 { font-size:14px; display:flex; align-items:center; gap:6px; margin-bottom:4px; }
        
        /* Bar ve Süreler */
        .progress-wrap { width:100%; margin-top:10px; }
        .bar-bg { width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; }
        .bar-fill { height:100%; width:0%; transition:width 1s linear; }
        .time-labels { display:flex; justify-content:space-between; font-size:11px; color:#777; margin-top:6px; font-variant-numeric: tabular-nums; }

        .dc-link { color:#fff; font-size:24px; opacity:0.4; transition:0.3s; position:absolute; bottom:30px; left:35px; }
        .dc-link:hover { opacity:1; color:#5865f2; }
        .views { position:absolute; bottom:30px; right:35px; font-size:12px; opacity:0.4; display:flex; align-items:center; gap:5px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div style="position:relative">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512">
                <div class="status ${d.discord_status}"></div>
            </div>
            <h1 class="name">${user.global_name || user.username}</h1>
            <div class="badges">${badgesHTML}</div>
        </div>

        ${spotify ? `
        <div class="act-card" style="border-left: 4px solid var(--spotify)">
            <img src="${spotify.album_art_url}" class="act-img">
            <div class="act-info" style="flex:1">
                <h4 style="color:var(--spotify)"><i class="fab fa-spotify"></i> Spotify</h4>
                <p style="font-size:14px; font-weight:bold">${spotify.song}</p>
                <p style="font-size:12px; color:#aaa">${spotify.artist}</p>
                <div class="progress-wrap">
                    <div class="bar-bg"><div id="s-bar" class="bar-fill" style="background:var(--spotify)"></div></div>
                    <div class="time-labels"><span id="s-start">0:00</span><span id="s-end">0:00</span></div>
                </div>
            </div>
        </div>
        ` : ''}

        ${activities.map(act => `
        <div class="act-card" style="border-left: 4px solid var(--ps)">
            <img src="https://i.imgur.com/vHExl6m.png" class="act-img">
            <div class="act-info" style="flex:1">
                <h4 style="color:#5865f2"><i class="fas fa-gamepad"></i> PlayStation</h4>
                <p style="font-size:14px; font-weight:bold">${act.name}</p>
                <p style="font-size:12px; color:#aaa">${act.details || 'Oynuyor'}</p>
                <div class="progress-wrap">
                    <div class="time-labels"><span>Geçen Süre:</span><span id="ps-time">00:00:00</span></div>
                </div>
            </div>
        </div>
        `).join('')}

        <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-link"><i class="fab fa-discord"></i></a>
        <div class="views"><i class="fas fa-eye"></i> ${viewsCount}</div>
    </div>

    <script>
        // Spotify Zaman Hesaplayıcı
        ${spotify ? `
        const sStart = ${spotify.timestamps.start};
        const sEnd = ${spotify.timestamps.end};
        function updateSpotify() {
            const now = Date.now();
            const total = sEnd - sStart;
            const current = Math.max(0, now - sStart);
            const progress = Math.min(100, (current / total) * 100);
            document.getElementById('s-bar').style.width = progress + "%";
            const fmt = (ms) => {
                const s = Math.floor((ms/1000)%60);
                return Math.floor(ms/60000) + ":" + (s<10?"0"+s:s);
            };
            document.getElementById('s-start').innerText = fmt(current);
            document.getElementById('s-end').innerText = fmt(total);
        }
        setInterval(updateSpotify, 1000); updateSpotify();
        ` : ''}

        // PlayStation Süre Hesaplayıcı
        ${activities.length > 0 && activities[0].timestamps ? `
        const psStart = ${activities[0].timestamps.start};
        function updatePS() {
            const diff = Date.now() - psStart;
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff%3600000)/60000);
            const s = Math.floor((diff%60000)/1000);
            document.getElementById('ps-time').innerText = (h>0?h+":":"") + (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s);
        }
        setInterval(updatePS, 1000); updatePS();
        ` : ''}

        setTimeout(() => location.reload(), 20000); // 20 saniyede bir taze veri
    </script>
</body>
</html>
    `);
});
app.listen(port);
