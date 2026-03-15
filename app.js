const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// AYARLAR
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

    // Avatar ve Banner Hazırlığı
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.startsWith('a_') ? 'gif' : 'png'}?size=512`;
    
    // Rozet Sistemi
    let badgesHTML = '';
    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };
    Object.keys(badgeMap).forEach(f => { if (user.public_flags & f) badgesHTML += `<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg" class="badge">`; });
    if (user.avatar?.startsWith('a_')) badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">';

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.global_name || user.username} | Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --spotify: #1DB954; --discord: #5865F2; --bg: #050505; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        body { background: var(--bg); color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        
        /* Hareketli Arka Plan Parçacıkları */
        .bg-glow { position: fixed; width: 400px; height: 400px; background: radial-gradient(circle, rgba(88,101,242,0.15) 0%, transparent 70%); top: -100px; left: -100px; z-index: -1; animation: move 20s infinite alternate; }
        @keyframes move { from { transform: translate(0,0); } to { transform: translate(100vw, 100vh); } }

        /* Kart Tasarımı */
        .card { width: 420px; background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: 30px; position: relative; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        
        /* Banner & Profil Üstü */
        .banner { position: absolute; top: 0; left: 0; width: 100%; height: 100px; background: linear-gradient(to bottom, var(--discord), transparent); opacity: 0.3; z-index: 0; }
        
        .profile-header { position: relative; z-index: 1; text-align: center; }
        .avatar-wrapper { position: relative; width: 110px; height: 110px; margin: 0 auto 15px; }
        .avatar { width: 100%; height: 100%; border-radius: 38% 62% 63% 37% / 41% 44% 56% 59%; border: 3px solid rgba(255,255,255,0.1); object-fit: cover; animation: morph 8s ease-in-out infinite; }
        @keyframes morph { 0%, 100% { border-radius: 38% 62% 63% 37% / 41% 44% 56% 59%; } 50% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; } }
        
        .status-dot { position: absolute; bottom: 5px; right: 5px; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #141414; }
        .online { background: #43b581; box-shadow: 0 0 15px #43b581; }
        .dnd { background: #f04747; box-shadow: 0 0 15px #f04747; }
        .idle { background: #faa61a; box-shadow: 0 0 15px #faa61a; }
        .offline { background: #747f8d; }

        .username { font-size: 26px; font-weight: 800; margin-bottom: 5px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .badges-container { display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 20px; width: fit-content; margin: 0 auto 25px; }
        .badge { width: 20px; height: 20px; }

        /* Aktivite Bölümü */
        .activity-section { margin-top: 20px; }
        .act-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 15px; margin-bottom: 12px; display: flex; align-items: center; gap: 15px; position: relative; overflow: hidden; }
        .act-card img { width: 60px; height: 60px; border-radius: 12px; z-index: 1; }
        
        /* Spotify Özel */
        .spotify-border { border-left: 4px solid var(--spotify); }
        .spotify-info { flex: 1; z-index: 1; }
        .spotify-info h4 { font-size: 12px; color: var(--spotify); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .song-name { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
        .artist-name { font-size: 13px; color: #aaa; margin-bottom: 8px; }

        .progress-wrapper { display: flex; align-items: center; gap: 8px; font-size: 10px; color: #888; }
        .bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; }
        .bar-fill { height: 100%; background: var(--spotify); border-radius: 2px; transition: width 1s linear; box-shadow: 0 0 8px var(--spotify); }

        /* Oyun/App Kartı */
        .game-border { border-left: 4px solid var(--discord); }
        .timestamp { font-size: 11px; color: #888; font-style: italic; }

        /* Alt Bilgi */
        .footer { margin-top: 25px; display: flex; justify-content: space-between; align-items: center; padding: 15px 5px 0; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #666; }
        .social-link { color: #fff; font-size: 18px; opacity: 0.5; transition: 0.3s; }
        .social-link:hover { opacity: 1; transform: translateY(-2px); color: var(--discord); }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body>
    <div class="bg-glow"></div>
    
    <div class="card">
        <div class="banner"></div>
        
        <div class="profile-header">
            <div class="avatar-wrapper">
                <img src="${avatarUrl}" class="avatar">
                <div class="status-dot ${d.discord_status}"></div>
            </div>
            <h1 class="username">${user.global_name || user.username}</h1>
            <div class="badges-container">${badgesHTML}</div>
        </div>

        <div class="activity-section">
            ${spotify ? `
            <div class="act-card spotify-border">
                <img src="${spotify.album_art_url}" id="spotify-art">
                <div class="spotify-info">
                    <h4><i class="fab fa-spotify"></i> Listening</h4>
                    <div class="song-name">${spotify.song}</div>
                    <div class="artist-name">${spotify.artist}</div>
                    <div class="progress-wrapper">
                        <span id="curr-time">0:00</span>
                        <div class="bar-bg"><div id="spotify-bar" class="bar-fill"></div></div>
                        <span id="end-time">0:00</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="act-card game-border">
                <img src="${act.assets?.large_image ? `https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png` : 'https://i.imgur.com/vHExl6m.png'}">
                <div class="spotify-info">
                    <h4 style="color:var(--discord)"><i class="fas fa-gamepad"></i> Playing</h4>
                    <div class="song-name">${act.name}</div>
                    <div class="artist-name">${act.details || 'In-game'}</div>
                    <div class="timestamp" id="act-${act.id}">00:00:00 elapsed</div>
                </div>
            </div>
            `).join('')}

            ${(!spotify && activities.length === 0) ? '<p style="text-align:center; color:#444; font-size:14px; margin:20px 0;">Sleeping or doing nothing...</p>' : ''}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-link"><i class="fab fa-discord"></i></a>
            <span><i class="fas fa-eye"></i> ${viewsCount} views</span>
            <span>v2.0 Beta</span>
        </div>
    </div>

    <script>
        // Spotify Dinamik Bar ve Zaman
        const spotifyData = ${JSON.stringify(spotify)};
        if(spotifyData) {
            const start = spotifyData.timestamps.start;
            const end = spotifyData.timestamps.end;
            
            function updateSpotify() {
                const now = Date.now();
                const total = end - start;
                const current = now - start;
                const progress = Math.min(100, (current / total) * 100);
                
                document.getElementById('spotify-bar').style.width = progress + '%';
                
                const formatTime = (ms) => {
                    const s = Math.floor((ms / 1000) % 60);
                    const m = Math.floor((ms / (1000 * 60)) % 60);
                    return m + ":" + (s < 10 ? '0' : '') + s;
                };

                document.getElementById('curr-time').innerText = formatTime(current);
                document.getElementById('end-time').innerText = formatTime(total);
            }
            setInterval(updateSpotify, 1000);
            updateSpotify();
        }

        // Oyun Süresi Sayacı
        const activities = ${JSON.stringify(activities)};
        activities.forEach(act => {
            if(act.timestamps && act.timestamps.start) {
                function updateTimer() {
                    const elapsed = Date.now() - act.timestamps.start;
                    const h = Math.floor(elapsed / 3600000);
                    const m = Math.floor((elapsed % 3600000) / 60000);
                    const s = Math.floor((elapsed % 60000) / 1000);
                    const timeStr = (h > 0 ? h + 'h ' : '') + m + 'm ' + s + 's elapsed';
                    const el = document.getElementById('act-' + act.id);
                    if(el) el.innerText = timeStr;
                }
                setInterval(updateTimer, 1000);
                updateTimer();
            }
        });

        // 60 saniyede bir tam yenileme (yeni şarkıya geçiş vb. için)
        setTimeout(() => { location.reload(); }, 60000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Server ${port} portunda aktif.`));
