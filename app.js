const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// SADECE ID GİRİN
const DISCORD_ID = '877946035408891945'; 
let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++;
    
    // Her girişte taze veri çekmek için Cache-Control başlıkları ve zaman damgası ekliyoruz
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    let d = null;
    
    try {
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}?t=${Date.now()}`);
        d = response.data.data;
    } catch (err) {
        return res.status(500).send("Discord API verisi su an alinamiyor.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    
    // PlayStation veya diğer oyun aktivitelerini filtreleme
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // Rozetleri ve Avatarı API'den Hazırla
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
    
    // Rozet Sistemi (Flags üzerinden otomatik)
    let badgesHTML = '';
    const flags = user.public_flags;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };
    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });
    if (user.avatar && user.avatar.startsWith('a_')) badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">';

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
        body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        
        /* Guns.lol Estetiği Hareketli Arka Plan */
        .bg-animate { position: fixed; inset: 0; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 400% 400%; animation: grad 15s infinite; z-index: -1; filter: blur(50px); opacity: 0.6; }
        @keyframes grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* Ana Kart Tasarımı (Cam Efekti) */
        .card { width: 480px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; padding: 35px; text-align: center; box-shadow: 0 40px 100px rgba(0,0,0,0.8); position: relative; }
        
        .avatar-box { position: relative; display: inline-block; margin-bottom: 20px; }
        .avatar { width: 120px; height: 120px; border-radius: 50%; border: 4px solid #000; }
        .status { position: absolute; bottom: 10px; right: 8px; width: 28px; height: 28px; border-radius: 50%; border: 4px solid #000; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .name { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px; }
        .badges-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 25px; }
        .badge { width: 22px; height: 22px; }

        /* Aktivite Kartları */
        .act-card { background: rgba(0,0,0,0.4); border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 18px; border: 1px solid rgba(255,255,255,0.05); text-align: left; margin-bottom: 15px; }
        .act-card img { width: 65px; height: 65px; border-radius: 12px; }
        .info h4 { font-size: 15px; margin-bottom: 3px; }
        .info p { font-size: 12px; color: #aaa; }

        .spotify-style { border-left: 4px solid #1DB954; }
        .game-style { border-left: 4px solid #5865F2; }

        /* Spotify İlerleme Çubuğu */
        .progress-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden; }
        .progress-bar { height: 100%; background: #1DB954; width: ${spotifyProgress}%; }

        /* Alt Bilgi */
        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 18px; opacity: 0.6; font-size: 13px; }
        .dc-icon { color: #fff; text-decoration: none; font-size: 20px; transition: 0.3s; }
        .dc-icon:hover { color: #5865F2; transform: scale(1.1); }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="card">
        <div class="avatar-box">
            <img class="avatar" src="${avatarUrl}">
            <div class="status ${d.discord_status}"></div>
        </div>

        <div class="name">${user.global_name || user.username}</div>
        <div class="badges-row">${badgesHTML}</div>

        <div class="activities">
            ${spotify ? `
            <div class="act-card spotify-style">
                <img src="${spotify.album_art_url}">
                <div class="info" style="width: 100%;">
                    <h4 style="color:#1DB954"><i class="fab fa-spotify"></i> Dinliyor</h4>
                    <p><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                    <div class="progress-container"><div class="progress-bar"></div></div>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="act-card game-style">
                <img src="https://i.imgur.com/vHExl6m.png">
                <div class="info">
                    <h4 style="color:#5865F2"><i class="fas fa-gamepad"></i> Oynuyor</h4>
                    <p><strong>${act.name}</strong></p>
                    <p>${act.details || ''}</p>
                    <p>${act.state || 'Aktif'}</p>
                </div>
            </div>
            `).join('')}

            ${(!spotify && activities.length === 0) ? '<p style="text-align:center; color:#333; font-size:13px;">Şu an aktif bir durum yok.</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-icon">
                <i class="fab fa-discord"></i>
            </a>
            <div>
                <i class="fas fa-eye"></i> <span>${viewsCount}</span>
            </div>
        </div>
    </div>
    <script>
        // Sayfayı her 30 saniyede bir sessizce yenileyerek API'den taze veri çeker
        setInterval(() => { location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port);
