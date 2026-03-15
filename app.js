const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const DISCORD_ID = '877946035408891945'; 

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discord Profile | Live</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #050505;
            --card-bg: rgba(18, 18, 18, 0.8);
            --spotify: #1DB954;
            --discord: #5865F2;
            --text-main: #ffffff;
            --text-dim: #a0a0a0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        
        body { 
            background: var(--bg); 
            color: var(--text-main); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            background-image: radial-gradient(circle at 50% 50%, #12122b 0%, #050505 100%);
        }

        .profile-card { 
            width: 420px; 
            background: var(--card-bg); 
            backdrop-filter: blur(20px); 
            border: 1px solid rgba(255,255,255,0.1); 
            border-radius: 28px; 
            padding: 25px; 
            box-shadow: 0 30px 60px rgba(0,0,0,0.6);
            transition: transform 0.3s ease;
        }

        /* Avatar & Status */
        .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .avatar-wrapper { position: relative; }
        .avatar { width: 85px; height: 85px; border-radius: 24px; object-fit: cover; border: 2px solid rgba(255,255,255,0.1); }
        .status-dot { 
            position: absolute; bottom: -5px; right: -5px; 
            width: 20px; height: 20px; border-radius: 50%; 
            border: 4px solid #121212; 
        }

        .online { background: #43b581; box-shadow: 0 0 15px #43b581; }
        .dnd { background: #f04747; box-shadow: 0 0 15px #f04747; }
        .idle { background: #faa61a; box-shadow: 0 0 15px #faa61a; }
        .offline { background: #747f8d; }

        .user-info h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .badges { display: flex; gap: 5px; margin-top: 5px; min-height: 20px; }
        .badge-icon { width: 18px; height: 18px; opacity: 0.9; }

        /* Spotify Section */
        #spotify-container { display: none; margin-top: 15px; }
        .spotify-card { 
            background: rgba(29, 185, 84, 0.1); 
            border: 1px solid rgba(29, 185, 84, 0.2);
            padding: 15px; border-radius: 20px; 
        }
        .track-info { display: flex; gap: 12px; align-items: center; }
        .album-art { width: 55px; height: 55px; border-radius: 12px; animation: pulse 2s infinite ease-in-out; }
        
        .track-details b { display: block; color: var(--spotify); font-size: 14px; margin-bottom: 2px; }
        .track-details span { font-size: 13px; color: var(--text-dim); display: block; }

        /* Activity Section */
        #activity-container { display: none; margin-top: 10px; }
        .activity-card { 
            background: rgba(255,255,255,0.03); 
            padding: 15px; border-radius: 20px; 
            display: flex; gap: 12px; align-items: center;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .activity-icon { width: 45px; height: 45px; border-radius: 10px; }

        .progress-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--spotify); width: 0%; transition: width 1s linear; }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
    </style>
</head>
<body>

    <div class="profile-card">
        <div class="header">
            <div class="avatar-wrapper">
                <img id="avatar" class="avatar" src="">
                <div id="status" class="status-dot"></div>
            </div>
            <div class="user-info">
                <h1 id="username">Yükleniyor...</h1>
                <div id="badges" class="badges"></div>
            </div>
        </div>

        <div id="spotify-container">
            <div class="spotify-card">
                <div class="track-info">
                    <img id="spotify-album" class="album-art" src="">
                    <div class="track-details">
                        <b><i class="fab fa-spotify"></i> Dinliyor</b>
                        <span id="spotify-track" style="color: #fff; font-weight: 600;"></span>
                        <span id="spotify-artist"></span>
                    </div>
                </div>
                <div class="progress-bg"><div id="spotify-progress" class="progress-fill"></div></div>
            </div>
        </div>

        <div id="activity-container"></div>
    </div>

    <script>
        const userId = "${DISCORD_ID}";
        const badgeList = {
            STAFF: 1, PARTNER: 2, HYPESQUAD: 4, BUG_HUNTER_LEVEL_1: 8,
            HYPESQUAD_ONLINE_HOUSE_1: 64, HYPESQUAD_ONLINE_HOUSE_2: 128, HYPESQUAD_ONLINE_HOUSE_3: 256,
            PREMIUM_EARLY_SUPPORTER: 512, BUG_HUNTER_LEVEL_2: 16384, VERIFIED_DEVELOPER: 131072, ACTIVE_DEVELOPER: 4194304
        };

        const socket = new WebSocket('wss://api.lanyard.rest/socket');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.op === 1) { // Hello
                socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
                setInterval(() => socket.send(JSON.stringify({ op: 3 })), data.d.heartbeat_interval);
            }

            if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
                updateUI(data.d);
            }
        };

        function updateUI(d) {
            const user = d.discord_user;
            
            // Temel Bilgiler
            document.getElementById('username').innerText = user.global_name || user.username;
            document.getElementById('avatar').src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.\${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256\`;
            document.getElementById('status').className = \`status-dot \${d.discord_status}\`;

            // Rozetler
            let badgesHTML = '';
            if (user.avatar && user.avatar.startsWith('a_')) {
                badgesHTML += '<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge-icon">';
            }
            // Diğer rozetler için d.public_flags kontrolü buraya eklenebilir (Basitleştirildi)
            document.getElementById('badges').innerHTML = badgesHTML;

            // Spotify
            const spotCont = document.getElementById('spotify-container');
            if (d.listening_to_spotify) {
                spotCont.style.display = 'block';
                document.getElementById('spotify-album').src = d.spotify.album_art_url;
                document.getElementById('spotify-track').innerText = d.spotify.song;
                document.getElementById('spotify-artist').innerText = d.spotify.artist;
                
                const progress = ((Date.now() - d.spotify.timestamps.start) / (d.spotify.timestamps.end - d.spotify.timestamps.start)) * 100;
                document.getElementById('spotify-progress').style.width = Math.min(100, progress) + '%';
            } else {
                spotCont.style.display = 'none';
            }

            // Aktiviteler (Oyunlar)
            const actCont = document.getElementById('activity-container');
            const acts = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');
            
            if (acts.length > 0) {
                actCont.style.display = 'block';
                actCont.innerHTML = acts.map(a => \`
                    <div class="activity-card">
                        <img class="activity-icon" src="\${a.assets?.large_image ? \`https://cdn.discordapp.com/app-assets/\${a.application_id}/\${a.assets.large_image}.png\` : 'https://i.imgur.com/vHExl6m.png'}">
                        <div class="track-details">
                            <b style="color: var(--discord)">\${a.name}</b>
                            <span>\${a.details || 'Oynuyor'}</span>
                            <span>\${a.state || ''}</span>
                        </div>
                    </div>
                \`).join('');
            } else {
                actCont.style.display = 'none';
            }
        }
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
