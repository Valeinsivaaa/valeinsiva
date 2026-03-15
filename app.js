const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// SADECE ID GİRİN
const DISCORD_ID = '877946035408891945'; 

let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++;
    let d = null;
    
    try {
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        d = response.data.data;
    } catch (err) {
        return res.send("Lutfen Lanyard Discord sunucusuna katilin.");
    }

    // Rozetleri ve Avatarı API'den Hazırla
    const user = d.discord_user;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
    const spotify = d.spotify;
    const activity = d.activities.find(a => a.type !== 2);

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.username} | Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #030303; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        
        .bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, #0f0c29, #302b63, #24243e); background-size: 400% 400%; animation: grad 15s infinite; z-index: -1; filter: blur(60px); opacity: 0.6; }
        @keyframes grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .card { width: 460px; background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; padding: 40px; text-align: center; box-shadow: 0 40px 100px rgba(0,0,0,0.9); }
        
        .avatar-box { position: relative; display: inline-block; margin-bottom: 20px; }
        .avatar { width: 130px; height: 130px; border-radius: 50%; border: 4px solid #030303; }
        .status-dot { position: absolute; bottom: 12px; right: 10px; width: 30px; height: 30px; border-radius: 50%; border: 4px solid #030303; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .name { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 30px; }
        
        /* Aktiflik Alanları */
        .status-card { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 18px; margin-bottom: 15px; text-align: left; }
        .status-card img { width: 65px; height: 65px; border-radius: 12px; }
        .text h4 { font-size: 16px; margin-bottom: 4px; }
        .text p { font-size: 13px; color: #888; }
        .spotify-theme { border-left: 5px solid #1DB954; }
        .game-theme { border-left: 5px solid #5865F2; }

        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; opacity: 0.7; }
        .dc-icon { color: #fff; font-size: 24px; transition: 0.3s; }
        .dc-icon:hover { color: #5865F2; transform: scale(1.2); }
        .view-cnt { font-size: 13px; display: flex; align-items: center; gap: 8px; }
    </style>
</head>
<body>
    <div class="bg"></div>
    <div class="card">
        <div class="avatar-box">
            <img class="avatar" src="${avatarUrl}">
            <div class="status-dot ${d.discord_status}"></div>
        </div>

        <div class="name">${user.username}</div>

        <div class="activities">
            ${spotify ? `
            <div class="status-card spotify-theme">
                <img src="${spotify.album_art_url}">
                <div class="text">
                    <h4>${spotify.song}</h4>
                    <p>${spotify.artist}</p>
                    <p style="color:#1DB954"><i class="fab fa-spotify"></i> Spotify</p>
                </div>
            </div>
            ` : ''}

            ${activity ? `
            <div class="status-card game-theme">
                <img src="https://i.imgur.com/vHExl6m.png"> <div class="text">
                    <h4>${activity.name}</h4>
                    <p>${activity.details || ''}</p>
                    <p>${activity.state || 'Aktif'}</p>
                </div>
            </div>
            ` : ''}

            ${(!spotify && !activity) ? '<p style="color:#444">Şu an aktif bir şey yok.</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-icon">
                <i class="fab fa-discord"></i>
            </a>
            <div class="view-cnt">
                <i class="fas fa-eye"></i> ${viewsCount}
            </div>
        </div>
    </div>
    <script>setInterval(() => location.reload(), 30000);</script>
</body>
</html>
    `);
});

app.listen(port);
