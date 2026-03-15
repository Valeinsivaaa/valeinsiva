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
        const response = await axios.get('https://api.lanyard.rest/v1/users/' + DISCORD_ID);
        d = response.data.data;
    } catch (err) {
        return res.send("Lanyard API baglantisi kurulamadi.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // Rozetleri API üzerinden çekme simülasyonu
    let badgeHTML = '';
    if (user.public_flags & 1) badgeHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordstaff.svg">';
    if (user.public_flags & 128) badgeHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbravery.svg">';
    if (user.avatar && user.avatar.startsWith('a_')) badgeHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg">';

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.username} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        
        .bg-animate { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 400% 400%; animation: grad 15s ease infinite; z-index: -1; filter: blur(40px); opacity: 0.7; }
        @keyframes grad { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .container { width: 520px; background: rgba(10, 10, 15, 0.5); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 30px; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
        .header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; }
        .avatar-box { position: relative; }
        .avatar { width: 90px; height: 90px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.1); }
        .status { position: absolute; bottom: 5px; right: 5px; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #111; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .user-meta h1 { font-size: 26px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
        .badges { display: flex; gap: 5px; margin-top: 5px; }
        .badges img { width: 20px; height: 20px; }

        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 15px; display: flex; align-items: center; gap: 15px; margin-bottom: 12px; }
        .card img { width: 65px; height: 65px; border-radius: 12px; }
        .card-info h4 { font-size: 15px; color: #fff; margin-bottom: 2px; }
        .card-info p { font-size: 13px; color: #aaa; }

        .footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .dc-link { color: #fff; font-size: 22px; opacity: 0.6; transition: 0.3s; }
        .dc-link:hover { opacity: 1; transform: scale(1.1); color: #5865f2; }
        .views { font-size: 13px; color: #555; display: flex; align-items: center; gap: 6px; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="container">
        <div class="header">
            <div class="avatar-box">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256">
                <div class="status ${d.discord_status}"></div>
            </div>
            <div class="user-meta">
                <h1>${user.username}</h1>
                <div class="badges">${badgeHTML}</div>
            </div>
        </div>

        <div class="activity-list">
            ${spotify ? `
            <div class="card" style="border-left: 4px solid #1DB954;">
                <img src="${spotify.album_art_url}">
                <div class="card-info">
                    <h4 style="color:#1DB954">Dinliyor: Spotify</h4>
                    <p><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="card" style="border-left: 4px solid #5865f2;">
                <img src="https://i.imgur.com/vHExl6m.png">
                <div class="card-info">
                    <h4 style="color:#5865f2">Oynuyor: ${act.name}</h4>
                    <p>${act.details || ''}</p>
                    <p>${act.state || ''}</p>
                </div>
            </div>
            `).join('')}

            ${(!spotify && activities.length === 0) ? '<p style="text-align:center; color:#444;">Şu an aktif bir durum yok.</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-link">
                <i class="fab fa-discord"></i>
            </a>
            <div class="views">
                <i class="fas fa-eye"></i> <span>${viewsCount}</span>
            </div>
        </div>
    </div>
    <script>setInterval(() => location.reload(), 30000);</script>
</body>
</html>
    `);
});

app.listen(port);
