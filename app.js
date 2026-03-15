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
        return res.status(500).send("Veri baglantisi kurulamadi.");
    }

    const { discord_user: user, spotify, activities, discord_status } = d;
    
    // Oyun/Uygulama Filtreleme
    const filteredActivities = activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // Avatar ve Banner logic
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.startsWith('a_') ? 'gif' : 'png'}?size=512`;
    
    // Rozetler
    const flags = user.public_flags || 0;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 131072: 'developer', 4194304: 'active_developer'
    };
    let badgesHTML = '';
    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });
    if (user.avatar?.startsWith('a_')) badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">';

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.global_name || user.username} | Profil</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #050505;
            --card-bg: rgba(15, 15, 15, 0.7);
            --accent-blue: #5865F2;
            --accent-green: #1DB954;
            --text-main: #ffffff;
            --text-dim: #a0a0a0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: var(--bg-color); color: var(--text-main); display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        
        /* Hareketli Arka Plan */
        .bg-glow { position: fixed; width: 100vw; height: 100vh; background: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #050505 100%); z-index: -1; }
        .bg-glow::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, transparent, var(--accent-blue), transparent 30%); animation: rotate 20s linear infinite; opacity: 0.1; }
        @keyframes rotate { 100% { transform: rotate(360deg); } }

        .card { width: 420px; background: var(--card-bg); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 40px 30px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; }
        
        /* Avatar & Status */
        .avatar-wrap { position: relative; width: 120px; margin: 0 auto 20px; }
        .avatar { width: 120px; height: 120px; border-radius: 40px; object-fit: cover; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
        .status-dot { position: absolute; bottom: -5px; right: -5px; width: 24px; height: 24px; border-radius: 50%; border: 4px solid #111; }
        .online { background: #23a55a; } .idle { background: #f0b232; } .dnd { background: #f23f43; } .offline { background: #80848e; }

        .name { font-size: 28px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .badges-row { display: flex; justify-content: center; gap: 6px; margin-bottom: 25px; min-height: 22px; }
        .badge { width: 20px; height: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }

        /* Aktivite Bölümü */
        .section-title { font-size: 11px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 2px; margin-bottom: 12px; font-weight: 700; text-align: left; }
        
        .activity-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 15px; display: flex; align-items: center; gap: 15px; margin-bottom: 12px; transition: 0.3s; }
        .activity-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
        
        .act-img { width: 60px; height: 60px; border-radius: 14px; object-fit: cover; }
        .act-info { flex: 1; text-align: left; overflow: hidden; }
        .act-info h4 { font-size: 14px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-info p { font-size: 12px; color: var(--text-dim); }

        /* Spotify Progress */
        .spotify-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .spotify-progress { height: 100%; background: var(--accent-green); transition: width 1s linear; }

        /* Footer */
        .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .dc-btn { background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 12px; color: #fff; text-decoration: none; font-size: 13px; font-weight: 600; transition: 0.3s; }
        .dc-btn:hover { background: var(--accent-blue); }
        .views { font-size: 12px; color: var(--text-dim); display: flex; align-items: center; gap: 5px; }

        @media (max-width: 450px) { .card { width: 90%; padding: 30px 20px; } }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="card">
        <div class="avatar-wrap">
            <img class="avatar" src="${avatarUrl}" alt="Avatar">
            <div class="status-dot ${discord_status}"></div>
        </div>

        <div class="name">${user.global_name || user.username}</div>
        <div class="badges-row">${badgesHTML}</div>

        <div class="content">
            ${spotify ? `
                <div class="section-title">Spotify</div>
                <div class="activity-card">
                    <img class="act-img" src="${spotify.album_art_url}">
                    <div class="act-info">
                        <h4>${spotify.song}</h4>
                        <p>${spotify.artist}</p>
                        <div class="spotify-bar">
                            <div class="spotify-progress" style="width: ${((Date.now() - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start)) * 100}%"></div>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${filteredActivities.length > 0 ? '<div class="section-title">Aktivite</div>' : ''}
            ${filteredActivities.map(act => {
                const gameImg = act.assets?.large_image 
                    ? (act.assets.large_image.startsWith('mp:external') 
                        ? act.assets.large_image.replace(/.*https\//, 'https://') 
                        : `https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png`)
                    : 'https://i.imgur.com/vHExl6m.png';
                
                return `
                <div class="activity-card">
                    <img class="act-img" src="${gameImg}">
                    <div class="act-info">
                        <h4>${act.name}</h4>
                        <p>${act.details || 'Oynuyor'}</p>
                        <p style="font-size: 10px; opacity: 0.7;">${act.state || ''}</p>
                    </div>
                </div>
                `;
            }).join('')}

            ${(!spotify && filteredActivities.length === 0) ? '<p style="font-size: 12px; color: #444;">Şu an sessiz...</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-btn">
                <i class="fab fa-discord"></i> Profili Gör
            </a>
            <div class="views">
                <i class="far fa-eye"></i> ${viewsCount}
            </div>
        </div>
    </div>

    <script>
        // Sayfayı yenilemeden Spotify barını hareket ettirmek için basit bir script
        setInterval(() => {
            const progressBar = document.querySelector('.spotify-progress');
            if (progressBar) {
                // Sadece görsel bir akıcılık için sayfa yenilenene kadar küçük artış yapılabilir
                // Ancak lanyard taze veri verdiği için reload en sağlıklısıdır.
            }
        }, 1000);

        // 30 saniyede bir tam yenileme
        setTimeout(() => { location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Site ${port} portunda hazır!`));
