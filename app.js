const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const DISCORD_ID = '877946035408891945'; 

app.get('/', async (req, res) => {
    // API her çağrıldığında 'Cache-Control' başlıklarını ekleyerek tarayıcıyı taze veri almaya zorluyoruz.
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let d = null;
    try {
        // Lanyard API'sine taze istek gönderiyoruz
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}?t=${Date.now()}`);
        d = response.data.data;
    } catch (err) {
        return res.status(500).send("API Baglantisi Kesildi.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');
    
    // Rozet Sistemi: Nitro ve tüm özel rozetler
    let badgesHTML = '';
    const flags = user.public_flags;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 131072: 'developer', 4194304: 'active_developer'
    };
    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });
    if (user.avatar && user.avatar.startsWith('a_')) badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">';

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${user.global_name || user.username}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --accent: #5865f2; --spotify: #1db954; }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter',sans-serif; }
        body { background:#050505; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; overflow:hidden; }
        
        /* Guns.lol HQ Estetiği */
        .card { width:480px; background:rgba(20,20,25,0.6); backdrop-filter:blur(40px); border:1px solid rgba(255,255,255,0.1); border-radius:30px; padding:35px; box-shadow:0 30px 60px rgba(0,0,0,0.8); position:relative; z-index:1; }
        .bg-blur { position:fixed; width:500px; height:500px; background:radial-gradient(circle, rgba(88,101,242,0.1) 0%, transparent 70%); z-index:-1; filter:blur(80px); }

        .header { display:flex; flex-direction:column; align-items:center; gap:15px; margin-bottom:30px; }
        .avatar-wrap { position:relative; }
        .avatar { width:110px; height:110px; border-radius:50%; border:4px solid #050505; }
        .status { position:absolute; bottom:8px; right:8px; width:24px; height:24px; border-radius:50%; border:4px solid #050505; box-shadow:0 0 15px rgba(0,0,0,0.5); }
        .online { background:#43b581; } .idle { background:#faa61a; } .dnd { background:#f04747; } .offline { background:#747f8d; }

        .display-name { font-size:32px; font-weight:900; letter-spacing:-1px; }
        .badges { display:flex; gap:6px; background:rgba(255,255,255,0.03); padding:6px 12px; border-radius:14px; border:1px solid rgba(255,255,255,0.05); }
        .badge { width:22px; height:22px; }

        /* Spotify Gelişmiş Player */
        .spotify-container { background:rgba(255,255,255,0.03); border-radius:20px; padding:20px; border:1px solid rgba(29,185,84,0.15); margin-top:10px; }
        .spotify-header { display:flex; align-items:center; gap:15px; }
        .spotify-img { width:65px; height:65px; border-radius:12px; box-shadow:0 10px 20px rgba(0,0,0,0.4); }
        .track-info h4 { font-size:16px; color:var(--spotify); display:flex; align-items:center; gap:6px; }
        .track-info p { font-size:14px; color:rgba(255,255,255,0.6); }

        .progress-area { margin-top:15px; }
        .bar-bg { width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; }
        .bar-fill { height:100%; background:var(--spotify); width:0%; transition: width 1s linear; }
        .time-info { display:flex; justify-content:space-between; font-size:11px; color:#666; margin-top:6px; }

        .dc-btn { position:absolute; bottom:25px; left:35px; color:#fff; font-size:24px; opacity:0.3; transition:0.3s; }
        .dc-btn:hover { opacity:1; color:var(--accent); }
    </style>
</head>
<body>
    <div class="bg-blur"></div>
    <div class="card">
        <div class="header">
            <div class="avatar-wrap">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512">
                <div class="status ${d.discord_status}"></div>
            </div>
            <h1 class="display-name">${user.global_name || user.username}</h1>
            <div class="badges">${badgesHTML}</div>
        </div>

        ${spotify ? `
        <div class="spotify-container">
            <div class="spotify-header">
                <img src="${spotify.album_art_url}" class="spotify-img">
                <div class="track-info">
                    <h4><i class="fab fa-spotify"></i> Spotify</h4>
                    <p><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                </div>
            </div>
            <div class="progress-area">
                <div class="bar-bg"><div id="s-bar" class="bar-fill"></div></div>
                <div class="time-info">
                    <span id="s-start">0:00</span>
                    <span id="s-end">0:00</span>
                </div>
            </div>
        </div>
        ` : '<p style="text-align:center; color:#444; font-size:13px;">Şu an müzik dinlenmiyor.</p>'}

        <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-btn"><i class="fab fa-discord"></i></a>
    </div>

    <script>
        // Spotify Zaman Hesaplama
        ${spotify ? `
        const start = ${spotify.timestamps.start};
        const end = ${spotify.timestamps.end};
        
        function updateSpotify() {
            const now = Date.now();
            const total = end - start;
            const current = now - start;
            const progress = Math.min(100, (current / total) * 100);
            
            document.getElementById('s-bar').style.width = progress + "%";
            
            const formatTime = (ms) => {
                const s = Math.floor((ms / 1000) % 60);
                return Math.floor(ms / 60000) + ":" + (s < 10 ? "0"+s : s);
            };
            
            document.getElementById('s-start').innerText = formatTime(current > 0 ? current : 0);
            document.getElementById('s-end').innerText = formatTime(total);
        }
        setInterval(updateSpotify, 1000);
        updateSpotify();
        ` : ''}

        // Anlık Güncelleme: Her 10 saniyede bir tam sayfa yenileme yerine veriyi sormak daha hızlıdır
        // Ama en basit çözüm olarak sayfayı 15 saniyede bir yenileyelim:
        setTimeout(() => location.reload(), 15000);
    </script>
</body>
</html>
    `);
});

app.listen(port);
