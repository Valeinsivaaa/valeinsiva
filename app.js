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
        return res.status(500).send("Discord API hatası.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
    const badgeSource = "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/";

    let badgesHTML = '';
    const flags = user.public_flags;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };

    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="${badgeSource}${badgeMap[f]}.svg" class="badge">`; });
    
    // Manuel Rozetler
    badgesHTML += `<img src="${badgeSource}discordnitro.svg" class="badge">`;
    badgesHTML += `<img src="${badgeSource}discordboost9.svg" class="badge">`;
    badgesHTML += `<img src="${badgeSource}discordcompletedquest.svg" class="badge">`;

    // Client tarafına gönderilecek veriler
    const clientData = JSON.stringify({ spotify, activities });

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.global_name || user.username} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background: #080808; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        .bg-animate { position: fixed; inset: 0; background: linear-gradient(-135deg, #1a0033, #001233, #000); background-size: 400% 400%; animation: grad 20s infinite; z-index: -1; }
        @keyframes grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .card { width: 450px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; padding: 35px; text-align: center; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
        .avatar { width: 120px; height: 120px; border-radius: 50%; border: 4px solid #000; margin-bottom: 15px; }
        .name { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        .badges-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 25px; }
        .badge { width: 22px; height: 22px; }
        .act-card { background: rgba(0,0,0,0.3); border-radius: 18px; padding: 15px; display: flex; align-items: center; gap: 15px; border: 1px solid rgba(255,255,255,0.05); text-align: left; margin-bottom: 12px; }
        .act-card img { width: 65px; height: 65px; border-radius: 12px; }
        .info h4 { font-size: 15px; color: #1DB954; }
        .info p { font-size: 13px; color: #bbb; }
        .progress-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 8px; }
        .progress-bar { height: 100%; background: #1DB954; width: 0%; transition: width 1s linear; }
        .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 12px; opacity: 0.5; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="card">
        <img class="avatar" src="${avatarUrl}">
        <div class="name">${user.global_name || user.username}</div>
        <div class="badges-row">${badgesHTML}</div>
        <div class="activities">
            ${spotify ? `
            <div class="act-card">
                <img src="${spotify.album_art_url}">
                <div class="info" style="width: 100%;">
                    <h4><i class="fab fa-spotify"></i> Dinliyor</h4>
                    <p style="color:#fff"><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                    <div class="progress-container"><div id="s-bar" class="progress-bar"></div></div>
                </div>
            </div>
            ` : ''}
            ${activities.map(act => {
                const img = act.assets && act.assets.large_image ? "https://cdn.discordapp.com/app-assets/" + act.application_id + "/" + act.assets.large_image + ".png" : "https://i.imgur.com/vHExl6m.png";
                return `
                <div class="act-card">
                    <img src="${img}">
                    <div class="info">
                        <h4 style="color:#5865F2"><i class="fas fa-gamepad"></i> Oynuyor</h4>
                        <p style="color:#fff"><strong>${act.name}</strong></p>
                        <p>${act.details || ''}</p>
                    </div>
                </div>`;
            }).join('')}
        </div>
        <div class="footer">
            <span><i class="fas fa-eye"></i> ${viewsCount}</span>
            <span>discord.gg/profil</span>
        </div>
    </div>

    <script>
        const data = ${clientData};
        if (data.spotify) {
            const start = data.spotify.timestamps.start;
            const end = data.spotify.timestamps.end;
            setInterval(() => {
                const now = Date.now();
                const progress = Math.min(100, ((now - start) / (end - start)) * 100);
                document.getElementById('s-bar').style.width = progress + '%';
            }, 1000);
        }
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port);
