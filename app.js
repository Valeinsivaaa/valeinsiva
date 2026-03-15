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
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        d = response.data.data;
    } catch (err) {
        return res.send("Lanyard API baglantisi kurulamadi. Lutfen Lanyard sunucusuna katilin.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom'); 
    
    // Rozetleri Lanyard flags üzerinden eşleştirme (Basit temsil)
    const badges = [];
    if (user.public_flags & 1) badges.push('https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordstaff.svg');
    if (user.public_flags & 128) badges.push('https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbravery.svg');
    if (user.public_flags & 256) badges.push('https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbrilliance.svg');
    if (user.public_flags & 512) badges.push('https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbalance.svg');
    if (user.avatar && user.avatar.startsWith('a_')) badges.push('https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg');

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.username} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-glass: rgba(15, 15, 20, 0.6); --border-glass: rgba(255, 255, 255, 0.1); }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
        
        body { 
            background: #000; 
            color: #fff; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            overflow: hidden;
        }

        /* Estetik Hareketli Arka Plan */
        .bg-animate {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e, #0f0c29);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            z-index: -1;
        }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        /* Ana Panel Tasarımı */
        .main-container {
            width: 550px;
            max-width: 95%;
            background: var(--bg-glass);
            backdrop-filter: blur(25px);
            border: 1px solid var(--border-glass);
            border-radius: 24px;
            padding: 30px;
            box-shadow: 0 50px 100px rgba(0,0,0,0.5);
            position: relative;
            overflow: hidden;
        }

        /* Üst Profil Kısmı */
        .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .avatar-wrap { position: relative; }
        .avatar { width: 100px; height: 100px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.1); }
        .status-dot { position: absolute; bottom: 5px; right: 5px; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #111; }
        .online { background: #43b581; box-shadow: 0 0 10px #43b581; }
        .idle { background: #faa61a; box-shadow: 0 0 10px #faa61a; }
        .dnd { background: #f04747; box-shadow: 0 0 10px #f04747; }
        .offline { background: #747f8d; }

        .user-info { text-align: left; }
        .name-row { display: flex; align-items: center; gap: 10px; }
        .name-row h1 { font-size: 28px; font-weight: 800; }
        .badges { display: flex; gap: 5px; }
        .badges img { width: 22px; height: 22px; }

        /* Aktivite Izgarası (Guns.lol stili) */
        .activity-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        
        .activity-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-glass);
            border-radius: 18px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: 0.3s;
        }
        .activity-card:hover { background: rgba(255, 255, 255, 0.08); transform: translateY(-2px); }
        .activity-card img { width: 70px; height: 70px; border-radius: 12px; }
        .activity-details h4 { font-size: 15px; margin-bottom: 4px; color: #fff; }
        .activity-details p { font-size: 13px; color: #aaa; line-height: 1.4; }

        .spotify-bar { position: relative; width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden; }
        .spotify-progress { height: 100%; background: #1DB954; width: 45%; } /* Simülasyon */

        /* Alt Bilgi */
        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--border-glass); }
        .dc-btn { color: #fff; text-decoration: none; font-size: 24px; opacity: 0.6; transition: 0.3s; }
        .dc-btn:hover { opacity: 1; color: #5865f2; transform: scale(1.1); }
        .views { font-size: 13px; color: #666; display: flex; align-items: center; gap: 8px; }

        .no-activity { color: #555; font-size: 14px; padding: 20px; }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="main-container">
        <div class="profile-header">
            <div class="avatar-wrap">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512">
                <div class="status-dot ${d.discord_status}"></div>
            </div>
            <div class="user-info">
                <div class="name-row">
                    <h1>${user.username}</h1>
                    <div class="badges">
                        ${badges.map(b => `<img src="${b}">`).join('')}
                    </div>
                </div>
                <p style="color: #666; font-size: 14px;">discord.gg/valeinsiva</p>
            </div>
        </div>

        <div class="activity-grid">
            ${spotify ? `
            <div class="activity-card" style="border-left: 4px solid #1DB954;">
                <img src="${spotify.album_art_url}">
                <div class="activity-details" style="width: 100%;">
                    <h4 style="color:#1DB954;">Dinliyor: Spotify</h4>
                    <p><strong>${spotify.song}</strong></p>
                    <p>${spotify.artist}</p>
                    <div class="spotify-bar"><div class="spotify-progress"></div></div>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="activity-card" style="border-left: 4px solid #5865f2;">
                <img src="${act.assets && act.assets.large_image ? (act.assets.large_image.startsWith('mp:external') ? act.assets.large_image.replace(/mp:external\\/.*?\\/https\\//, 'https://') : \`https://cdn.discordapp.com/app-assets/\${act.application_id}/\${act.assets.large_image}.png\`) : 'https://i.imgur.com/vHExl6m.png'}">
                <div class="activity-details">
                    <h4 style="color:#5865f2;">Oynuyor: ${act.name}</h4>
                    <p>${act.details || ''}</p>
                    <p>${act.state || ''}</p>
                </div>
            </div>
            `).join('')}

            ${(!spotify && activities.length === 0) ? '<p class="no-activity">Şu an aktif bir şey yok.</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-btn">
                <i class="fab fa-discord"></i>
            </a>
            <div class="views">
                <i class="fas fa-eye"></i>
                <span>${viewsCount} görüntülenme</span>
            </div>
        </div>
    </div>

    <script>
        // Sayfa otomatik yenileme
        setInterval(() => { location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log('Dashboard Aktif!'));
