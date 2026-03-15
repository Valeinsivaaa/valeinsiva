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
        return res.status(500).send("Discord API verisi su an alinamiyor.");
    }

    const { discord_user: user, spotify, activities, discord_status } = d;
    
    // Oyun/Uygulama Filtreleme (Spotify hariç aktiviteler)
    const filteredActivities = activities.filter(a => a.type !== 2 && a.id !== 'custom');

    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.startsWith('a_') ? 'gif' : 'png'}?size=512`;
    
    // Rozet Sistemi
    const flags = user.public_flags || 0;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 131072: 'developer', 4194304: 'active_developer'
    };
    let badgesHTML = '';
    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.global_name || user.username} | Bio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #08080c;
            --card-bg: rgba(20, 20, 25, 0.6);
            --accent-blue: #5865F2;
            --accent-green: #1DB954;
            --text-main: #ffffff;
            --text-dim: #949ba4;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: var(--bg-color); color: var(--text-main); display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        
        .bg-animate { position: fixed; inset: 0; background: radial-gradient(circle at top right, #1e1e3f, transparent), radial-gradient(circle at bottom left, #121212, transparent); z-index: -1; }

        .card { width: 440px; background: var(--card-bg); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; padding: 35px; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        
        .avatar-box { position: relative; width: 110px; margin: 0 auto 15px; }
        .avatar { width: 110px; height: 110px; border-radius: 35px; border: 3px solid rgba(255,255,255,0.1); }
        .status-dot { position: absolute; bottom: -4px; right: -4px; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #141419; }
        .online { background: #23a55a; } .idle { background: #f0b232; } .dnd { background: #f23f43; } .offline { background: #80848e; }

        .name { font-size: 26px; font-weight: 800; margin-bottom: 5px; }
        .badges-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 25px; height: 20px; }
        .badge { width: 20px; height: 20px; }

        .section-label { font-size: 10px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 1.5px; text-align: left; margin: 15px 0 8px 5px; font-weight: 700; }

        /* Aktivite Kartları */
        .act-card { background: rgba(0,0,0,0.3); border-radius: 22px; padding: 16px; display: flex; align-items: center; gap: 16px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 12px; text-align: left; }
        .act-img { width: 64px; height: 64px; border-radius: 14px; object-fit: cover; }
        .act-info { flex: 1; overflow: hidden; }
        .act-info h4 { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-info p { font-size: 12px; color: var(--text-dim); margin: 2px 0; }

        /* Spotify Akıcı Bar */
        .spotify-progress-bg { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 10px; overflow: hidden; }
        .spotify-progress-fill { height: 100%; background: var(--accent-green); width: 0%; transition: width 0.5s linear; }

        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; color: var(--text-dim); font-size: 12px; }
        .dc-link { color: #fff; text-decoration: none; font-size: 20px; transition: 0.2s; }
        .dc-link:hover { color: var(--accent-blue); transform: scale(1.1); }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="card">
        <div class="avatar-box">
            <img class="avatar" src="${avatarUrl}">
            <div class="status-dot ${discord_status}"></div>
        </div>

        <div class="name">${user.global_name || user.username}</div>
        <div class="badges-row">${badgesHTML}</div>

        <div class="activities-container">
            ${spotify ? `
                <div class="section-label">Dinliyor</div>
                <div class="act-card" style="border-left: 4px solid var(--accent-green)">
                    <img class="act-img" src="${spotify.album_art_url}">
                    <div class="act-info">
                        <h4 style="color: var(--accent-green)">${spotify.song}</h4>
                        <p>by ${spotify.artist}</p>
                        <div class="spotify-progress-bg">
                            <div id="spotify-bar" class="spotify-progress-fill"></div>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${filteredActivities.map(act => {
                // Discord API'den gelen resim yolunu oluşturma
                let gameImg = 'https://i.imgur.com/vHExl6m.png';
                if (act.assets && act.assets.large_image) {
                    if (act.assets.large_image.startsWith('mp:external')) {
                        gameImg = act.assets.large_image.replace(/.*https\//, 'https://');
                    } else {
                        gameImg = `https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png`;
                    }
                }

                // Oynama süresi hesaplama
                const startTime = act.timestamps?.start;
                const timeStr = startTime ? `<span class="play-time" data-start="${startTime}">00:00</span>'dır oynuyor` : 'Aktif';

                return `
                <div class="section-label">Oynuyor</div>
                <div class="act-card" style="border-left: 4px solid var(--accent-blue)">
                    <img class="act-img" src="${gameImg}">
                    <div class="act-info">
                        <h4 style="color: var(--accent-blue)">${act.name}</h4>
                        <p>${act.details || ''}</p>
                        <p style="font-size: 11px;">${timeStr}</p>
                    </div>
                </div>
                `;
            }).join('')}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-link"><i class="fab fa-discord"></i></a>
            <div><i class="fas fa-eye"></i> <span>${viewsCount}</span></div>
        </div>
    </div>

    <script>
        // Spotify Akıcı İlerleme Çubuğu Mantığı
        ${spotify ? `
            const start = ${spotify.timestamps.start};
            const end = ${spotify.timestamps.end};
            
            function updateSpotify() {
                const now = Date.now();
                const total = end - start;
                const progress = Math.min(100, Math.max(0, ((now - start) / total) * 100));
                document.getElementById('spotify-bar').style.width = progress + '%';
            }
            setInterval(updateSpotify, 1000);
            updateSpotify();
        ` : ''}

        // Oyun Oynama Süresi Sayacı
        function updateTimers() {
            document.querySelectorAll('.play-time').forEach(el => {
                const start = parseInt(el.getAttribute('data-start'));
                const diff = Math.floor((Date.now() - start) / 1000);
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                el.innerText = (h > 0 ? h + ':' : '') + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
            });
        }
        setInterval(updateTimers, 1000);
        updateTimers();

        // 30 saniyede bir veriyi tazelemek için sayfayı yenile
        setTimeout(() => { location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port);
