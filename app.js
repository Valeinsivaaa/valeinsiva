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
        // Her girişte taze veri çekmek için zaman damgası ekliyoruz
        const response = await axios.get('https://api.lanyard.rest/v1/users/' + DISCORD_ID + '?t=' + Date.now());
        d = response.data.data;
    } catch (err) {
        return res.status(500).send("Discord API verisi su an alinamiyor.");
    }

    const user = d.discord_user;
    const displayName = user.global_name || user.username; // Kullanıcı adı değil, Görünen Ad
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');
    
    // Rozetleri profesyonel SVG'ler ile çekiyoruz
    let badgesHTML = '';
    const flags = user.public_flags;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };

    Object.keys(badgeMap).forEach(flag => {
        if (flags & flag) {
            badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[flag]}.svg" class="badge">`;
        }
    });
    if (user.avatar && user.avatar.startsWith('a_')) {
        badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">';
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow-x: hidden; }
        
        /* Guns.lol Stili Hareketli Arka Plan */
        .bg { position: fixed; inset: 0; background: linear-gradient(125deg, #050505, #121212, #0a0a2e); z-index: -1; }
        .bg-glow { position: fixed; width: 600px; height: 600px; background: radial-gradient(circle, rgba(88,101,242,0.15) 0%, transparent 70%); top: -10%; right: -10%; z-index: -1; animation: pulse 8s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }

        .card { width: 500px; max-width: 90%; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; padding: 35px; box-shadow: 0 50px 100px rgba(0,0,0,0.9); text-align: center; }
        
        .profile-section { margin-bottom: 30px; }
        .avatar-wrap { position: relative; display: inline-block; }
        .avatar { width: 110px; height: 110px; border-radius: 50%; border: 4px solid #000; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .status { position: absolute; bottom: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%; border: 4px solid #000; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .name-box { margin-top: 15px; }
        .display-name { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
        .badges-row { display: flex; justify-content: center; gap: 6px; margin-top: 10px; background: rgba(0,0,0,0.3); padding: 5px 12px; border-radius: 12px; width: fit-content; margin-inline: auto; }
        .badge { width: 22px; height: 22px; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2)); }

        /* Aktivite Tasarımları */
        .activity-container { display: flex; flex-direction: column; gap: 15px; text-align: left; }
        .act-card { background: rgba(255,255,255,0.04); border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 18px; border: 1px solid rgba(255,255,255,0.05); }
        .act-card img { width: 65px; height: 65px; border-radius: 14px; object-fit: cover; }
        .act-info h4 { font-size: 15px; color: #fff; margin-bottom: 2px; }
        .act-info p { font-size: 13px; color: #888; }
        
        .spotify-style { border-bottom: 3px solid #1DB954; }
        .game-style { border-bottom: 3px solid #5865F2; }

        .footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }
        .dc-icon { font-size: 24px; color: #fff; opacity: 0.5; transition: 0.3s; }
        .dc-icon:hover { opacity: 1; color: #5865F2; transform: scale(1.1); }
        .views { font-size: 13px; color: #444; display: flex; align-items: center; gap: 8px; }
    </style>
</head>
<body>
    <div class="bg"></div>
    <div class="bg-glow"></div>
    <div class="card">
        <div class="profile-section">
            <div class="avatar-wrap">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512">
                <div class="status ${d.discord_status}"></div>
            </div>
            <div class="name-box">
                <div class="display-name">${displayName}</div>
                ${badgesHTML ? `<div class="badges-row">${badgesHTML}</div>` : ''}
            </div>
        </div>

        <div class="activity-container">
            ${spotify ? `
            <div class="act-card spotify-style">
                <img src="${spotify.album_art_url}">
                <div class="act-info">
                    <h4 style="color:#1DB954"><i class="fab fa-spotify"></i> Dinliyor</h4>
                    <p><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="act-card game-style">
                <img src="https://i.imgur.com/vHExl6m.png">
                <div class="act-info">
                    <h4 style="color:#5865F2"><i class="fas fa-gamepad"></i> Oynuyor</h4>
                    <p><strong>${act.name}</strong></p>
                    <p>${act.details || ''}</p>
                </div>
            </div>
            `).join('')}

            ${(!spotify && activities.length === 0) ? '<p style="text-align:center; color:#333; font-size:13px;">Su an aktif bir durum yok.</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-icon">
                <i class="fab fa-discord"></i>
            </a>
            <div class="views">
                <i class="fas fa-eye"></i> <span>${viewsCount}</span>
            </div>
        </div>
    </div>

    <script>
        // Sayfa her 30 saniyede bir arkada sessizce yenilenir
        setInterval(() => { window.location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port);
