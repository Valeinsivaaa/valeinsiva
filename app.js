const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// SADECE ID DEĞİŞTİRİN
const DISCORD_ID = '877946035408891945'; 

let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++;
    let d = null;
    
    try {
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        d = response.data.data;
    } catch (err) {
        return res.send("Discord verisi çekilemedi. Lütfen Lanyard sunucusuna katilin.");
    }

    const spotify = d.spotify;
    const activity = d.activities.find(a => a.type !== 2);
    // Rozetleri otomatik çekmek için (Lanyard'ın sağladığı flags üzerinden basit bir mantık)
    const hasNitro = d.discord_user.avatar && d.discord_user.avatar.startsWith('a_');

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${d.discord_user.username} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #050505; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        
        .bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); background-size: 400% 400%; animation: move 10s infinite; z-index: -1; filter: blur(50px); }
        @keyframes move { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .card { width: 440px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 30px; padding: 35px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
        
        .avatar-container { position: relative; display: inline-block; margin-bottom: 15px; }
        .avatar { width: 120px; height: 120px; border-radius: 50%; border: 5px solid #050505; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .status { position: absolute; bottom: 10px; right: 8px; width: 28px; height: 28px; border-radius: 50%; border: 5px solid #050505; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .username { font-size: 30px; font-weight: 800; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .nitro-icon { color: #ff73fa; font-size: 20px; }

        .activity-box { margin-top: 25px; display: flex; flex-direction: column; gap: 15px; text-align: left; }
        .item { background: rgba(0,0,0,0.4); padding: 15px; border-radius: 18px; display: flex; align-items: center; gap: 15px; border: 1px solid rgba(255,255,255,0.05); }
        .item img { width: 60px; height: 60px; border-radius: 12px; }
        .info h4 { font-size: 15px; margin-bottom: 2px; }
        .info p { font-size: 12px; color: #aaa; }

        .spotify { border-left: 4px solid #1DB954; }
        .game { border-left: 4px solid #5865F2; }

        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: center; opacity: 0.5; font-size: 13px; }
        .discord-link { color: #fff; text-decoration: none; font-size: 20px; transition: 0.3s; }
        .discord-link:hover { color: #5865F2; transform: scale(1.2); }
    </style>
</head>
<body>
    <div class="bg"></div>
    <div class="card">
        <div class="avatar-container">
            <img class="avatar" src="https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.png?size=256">
            <div class="status ${d.discord_status}"></div>
        </div>

        <div class="username">
            ${d.discord_user.username}
            ${hasNitro ? '<i class="fas fa-gem nitro-icon" title="Nitro"></i>' : ''}
        </div>

        <div class="activity-box">
            ${spotify ? `
                <div class="item spotify">
                    <img src="${spotify.album_art_url}">
                    <div class="info">
                        <h4>${spotify.song}</h4>
                        <p>${spotify.artist}</p>
                        <p style="color:#1DB954"><i class="fab fa-spotify"></i> Spotify</p>
                    </div>
                </div>
            ` : ''}

            ${activity ? `
                <div class="item game">
                    <img src="${activity.assets?.large_image ? (activity.assets.large_image.startsWith('mp:external') ? activity.assets.large_image.replace(/mp:external\\/.*?\\/https\\//, 'https://') : \`https://cdn.discordapp.com/app-assets/\${activity.application_id}/\${activity.assets.large_image}.png\`) : 'https://i.imgur.com/vHExl6m.png'}">
                    <div class="info">
                        <h4>${activity.name}</h4>
                        <p>${activity.details || ''}</p>
                        <p>${activity.state || 'Oynuyor'}</p>
                    </div>
                </div>
            ` : ''}

            ${(!spotify && !activity) ? '<p style="text-align:center; color:#555;">Şu an aktif bir durum yok.</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="discord-link">
                <i class="fab fa-discord"></i>
            </a>
            <div>
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
              
