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
        return res.status(500).send("Discord API verisi şu an alınamıyor.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // Rozet Sistemi
    let badgesHTML = '';
    const flags = user.public_flags;
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };
    
    Object.keys(badgeMap).forEach(f => { if (flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });
    
    // Manuel Eklenen Rozetler (Nitro, Boost, Quest)
    badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">`;
    badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordboost9.svg" class="badge">`;
    badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordcompletedquest.svg" class="badge">`;

    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;

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
        body { background: #080808; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        
        .bg-animate { position: fixed; inset: 0; background: linear-gradient(135deg, #121212, #1a1a1a, #000); z-index: -1; }

        .card { width: 450px; background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        
        .avatar-box { position: relative; margin-bottom: 15px; text-align: center; }
        .avatar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.1); }
        .status { position: absolute; bottom: 5px; right: 165px; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #000; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .name { font-size: 28px; font-weight: 800; text-align: center; margin-bottom: 5px; }
        .badges-row { display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
        .badge { width: 20px; height: 20px; }

        .act-card { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 15px; display: flex; align-items: center; gap: 15px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .act-card img { width: 60px; height: 60px; border-radius: 10px; }
        
        .info { flex: 1; min-width: 0; }
        .info h4 { font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
        .info p { font-size: 12px; color: #bbb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Spotify Progress */
        .progress-container { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 8px; position: relative; }
        .progress-bar { height: 100%; background: #1DB954; width: 0%; border-radius: 10px; transition: width 1s linear; }
        .time-row { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 4px; font-family: monospace; }

        .footer { margin-top: 20px; display: flex; justify-content: space-between; opacity: 0.5; font-size: 12px; }
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

        <div id="activities-container">
            ${spotify ? `
            <div class="act-card">
                <img src="${spotify.album_art_url}">
                <div class="info">
                    <h4 style="color:#1DB954"><i class="fab fa-spotify"></i> Spotify</h4>
                    <p style="color:#fff; font-weight:bold;">${spotify.song}</p>
                    <p>by ${spotify.artist}</p>
                    <div class="progress-container"><div id="spotify-bar" class="progress-bar"></div></div>
                    <div class="time-row">
                        <span id="spotify-start">00:00</span>
                        <span id="spotify-end">00:00</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="act-card">
                <img src="${act.assets && act.assets.large_image ? `https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png` : 'https://i.imgur.com/vHExl6m.png'}">
                <div class="info">
                    <h4 style="color:#5865F2"><i class="fas fa-gamepad"></i> ${act.name}</h4>
                    <p style="color:#fff;">${act.details || 'Oynuyor'}</p>
                    <p id="game-time-${act.id}">${act.state || ''}</p>
                </div>
            </div>
            `).join('')}
        </div>

        <div class="footer">
            <span><i class="fas fa-eye"></i> ${viewsCount}</span>
            <span>discord.gg/profil</span>
        </div>
    </div>

    <script>
        function formatTime(ms) {
            if (ms < 0) ms = 0;
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }

        // Spotify Canlı Güncelleme
        const spotifyData = ${JSON.stringify(spotify)};
        if (spotifyData) {
            const start = spotifyData.timestamps.start;
            const end = spotifyData.timestamps.end;
            const total = end - start;

            function updateSpotify() {
                const now = Date.now();
                const elapsed = now - start;
                const progress = Math.min(100, (elapsed / total) * 100);
                
                document.getElementById('spotify-bar').style.width = progress + '%';
                document.getElementById('spotify-start').innerText = formatTime(elapsed);
                document.getElementById('spotify-end').innerText = formatTime(total);
            }
            setInterval(updateSpotify, 1000);
            updateSpotify();
        }

        // Sayfayı veri tazelemek için yenile
        setTimeout(() => { location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
