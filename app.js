const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const DISCORD_ID = '877946035408891945'; 
let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++;
    let d = null;
    
    try {
        // API'yi her seferinde taze veri çekmeye zorlamak için zaman damgası ekliyoruz
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}?t=${Date.now()}`);
        d = response.data.data;
    } catch (err) {
        return res.status(500).send("Discord verisi alinamadi, Lanyard sunucusunda oldugunuzdan emin olun.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');
    
    // Gelişmiş Rozet Sistemi (Nitro, Boost ve Tüm Rozetler)
    let badgesHTML = '';
    const flags = user.public_flags;
    const badgeIcons = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };

    Object.keys(badgeIcons).forEach(flag => {
        if (flags & flag) {
            badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeIcons[flag]}.svg" class="badge-icon">`;
        }
    });

    // Nitro ve Boost Kontrolü
    if (user.avatar && user.avatar.startsWith('a_')) {
        badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge-icon">';
    }

    // Spotify Süre Hesaplama
    let spotifyProgress = 0;
    if (spotify) {
        const total = spotify.timestamps.end - spotify.timestamps.start;
        const current = Date.now() - spotify.timestamps.start;
        spotifyProgress = Math.min(100, Math.max(0, (current / total) * 100));
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.global_name || user.username} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #030303; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        
        .bg-glow { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #050505 100%); z-index: -1; }
        
        .profile-card { width: 480px; background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; }
        
        .header { text-align: center; margin-bottom: 25px; }
        .avatar-container { position: relative; display: inline-block; }
        .avatar { width: 100px; height: 100px; border-radius: 50%; border: 3px solid #111; }
        .status-dot { position: absolute; bottom: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #111; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .names { margin-top: 15px; }
        .display-name { font-size: 26px; font-weight: 800; }
        .badges-container { display: flex; justify-content: center; gap: 6px; margin-top: 8px; }
        .badge-icon { width: 20px; height: 20px; }

        /* Spotify Player Tasarımı */
        .spotify-card { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 15px; margin-top: 20px; border: 1px solid rgba(29, 185, 84, 0.2); }
        .spotify-info { display: flex; align-items: center; gap: 15px; }
        .spotify-info img { width: 60px; height: 60px; border-radius: 10px; animation: rotate 10s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .track-details h4 { font-size: 15px; color: #1DB954; }
        .track-details p { font-size: 13px; color: #aaa; }

        .progress-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 12px; }
        .progress-bar { height: 100%; background: #1DB954; border-radius: 2px; width: ${spotifyProgress}%; transition: width 1s linear; }

        /* Oyun/Aktivite */
        .activity-card { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 15px; margin-top: 10px; display: flex; align-items: center; gap: 15px; border: 1px solid rgba(88, 101, 242, 0.2); }
        .activity-card img { width: 50px; height: 50px; border-radius: 8px; }

        .footer { margin-top: 25px; display: flex; justify-content: space-between; align-items: center; opacity: 0.5; font-size: 12px; }
        .dc-btn { color: #fff; font-size: 20px; transition: 0.3s; }
        .dc-btn:hover { color: #5865F2; transform: scale(1.1); }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="profile-card">
        <div class="header">
            <div class="avatar-container">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512">
                <div class="status-dot ${d.discord_status}"></div>
            </div>
            <div class="names">
                <div class="display-name">${user.global_name || user.username}</div>
                <div class="badges-container">${badgesHTML}</div>
            </div>
        </div>

        ${spotify ? `
        <div class="spotify-card">
            <div class="spotify-info">
                <img src="${spotify.album_art_url}">
                <div class="track-details">
                    <h4><i class="fab fa-spotify"></i> Spotify Dinleniyor</h4>
                    <p><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                </div>
            </div>
            <div class="progress-container"><div class="progress-bar"></div></div>
        </div>
        ` : ''}

        ${activities.map(act => `
        <div class="activity-card">
            <img src="https://i.imgur.com/vHExl6m.png">
            <div class="track-details">
                <h4 style="color: #5865F2;">Oynuyor: ${act.name}</h4>
                <p>${act.details || 'Aktif'}</p>
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-btn"><i class="fab fa-discord"></i></a>
            <div><i class="fas fa-eye"></i> ${viewsCount} görüntülenme</div>
        </div>
    </div>
    <script>
        // Sayfaya her odaklanildiginda veya 15 saniyede bir taze veri icin yenile
        document.addEventListener("visibilitychange", () => { if (!document.hidden) location.reload(); });
        setInterval(() => { location.reload(); }, 15000);
    </script>
</body>
</html>
    `);
});

app.listen(port);
