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
    <title>Live Profile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --spotify-green: #1DB954;
            --playstation-blue: #003087;
            --discord-blurple: #5865F2;
            --bg-dark: #080808;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
        
        body { 
            background: var(--bg-dark); 
            height: 100vh; display: flex; justify-content: center; align-items: center; 
            color: white; overflow: hidden;
        }

        /* Arka Plan Hareketli Işık */
        body::before {
            content: ''; position: absolute; width: 300px; height: 300px;
            background: var(--discord-blurple); filter: blur(150px);
            opacity: 0.2; animation: move 10s infinite alternate; z-index: -1;
        }
        @keyframes move { from { transform: translate(-50%, -50%); } to { transform: translate(50%, 50%); } }

        .card {
            width: 400px; background: rgba(20, 20, 20, 0.6);
            backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px; padding: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }

        /* Avatar & Status */
        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .avatar-box { position: relative; }
        .avatar { width: 70px; height: 70px; border-radius: 20px; border: 2px solid rgba(255,255,255,0.1); }
        .status-circle { 
            position: absolute; bottom: -5px; right: -5px; width: 18px; height: 18px; 
            border-radius: 50%; border: 3px solid #141414; 
        }

        /* Spotify & Activities */
        .widget { 
            background: rgba(255,255,255,0.03); border-radius: 18px; padding: 15px; 
            margin-top: 15px; border-left: 4px solid transparent;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .spotify { border-color: var(--spotify-green); }
        .playstation { border-color: var(--playstation-blue); }

        .flex { display: flex; align-items: center; gap: 12px; }
        .icon-main { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; }
        
        .details h4 { font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px; }
        .details p { font-size: 12px; color: #aaa; }

        /* Progress Bar Animasyonu */
        .bar-container { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 10px; position: relative; }
        .bar-fill { height: 100%; background: var(--spotify-green); border-radius: 10px; width: 0%; transition: width 1s linear; }
        
        .time-info { display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-top: 5px; }

    </style>
</head>
<body>

    <div class="card">
        <div class="header">
            <div class="avatar-box">
                <img id="avatar" class="avatar" src="">
                <div id="status" class="status-circle"></div>
            </div>
            <div>
                <h2 id="username" style="font-size: 18px;">Yükleniyor...</h2>
                <p id="custom-status" style="font-size: 12px; color: #888;"></p>
            </div>
        </div>

        <div id="content"></div>
    </div>

    <script>
        const userId = "${DISCORD_ID}";
        const socket = new WebSocket('wss://api.lanyard.rest/socket');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.op === 1) {
                socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
                setInterval(() => socket.send(JSON.stringify({ op: 3 }), data.d.heartbeat_interval));
            }
            if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') render(data.d);
        };

        function formatTime(ms) {
            const s = Math.floor((ms / 1000) % 60);
            const m = Math.floor((ms / (1000 * 60)) % 60);
            return \`\${m}:\${s < 10 ? '0' + s : s}\`;
        }

        function render(d) {
            const { discord_user, discord_status, activities, listening_to_spotify, spotify } = d;
            
            // Profil Güncelleme
            document.getElementById('username').innerText = discord_user.global_name || discord_user.username;
            document.getElementById('avatar').src = \`https://cdn.discordapp.com/avatars/\${discord_user.id}/\${discord_user.avatar}.png?size=256\`;
            document.getElementById('status').style.background = { online: '#43b581', dnd: '#f04747', idle: '#faa61a', offline: '#747f8d' }[discord_status];

            let html = '';

            // 1. Spotify Bölümü
            if (listening_to_spotify) {
                const total = spotify.timestamps.end - spotify.timestamps.start;
                const current = Date.now() - spotify.timestamps.start;
                const progress = Math.min(100, (current / total) * 100);

                html += \`
                <div class="widget spotify">
                    <div class="flex">
                        <img class="icon-main" src="\${spotify.album_art_url}" style="animation: spin 12s linear infinite; border-radius: 50%">
                        <div class="details">
                            <h4 style="color: var(--spotify-green)"><i class="fab fa-spotify"></i> Spotify</h4>
                            <h4>\${spotify.song}</h4>
                            <p>\${spotify.artist}</p>
                        </div>
                    </div>
                    <div class="bar-container"><div class="bar-fill" style="width: \${progress}%"></div></div>
                    <div class="time-info"><span>\${formatTime(current)}</span><span>\${formatTime(total)}</span></div>
                </div>\`;
            }

            // 2. Oyun/PlayStation Bölümü
            activities.filter(a => a.type !== 2 && a.id !== 'custom').forEach(act => {
                const isPS = act.name === "PlayStation 5" || act.name === "PlayStation 4";
                const start = act.timestamps?.start;
                let timeText = 'Oynuyor';
                
                if (start) {
                    const diff = Date.now() - start;
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    timeText = \`\${h > 0 ? h + 'sa ' : ''}\${m}dk'dır oynuyor\`;
                }

                html += \`
                <div class="widget \${isPS ? 'playstation' : ''}" style="border-left-color: \${isPS ? '#003087' : '#5865F2'}">
                    <div class="flex">
                        <img class="icon-main" src="\${act.assets?.large_image ? (act.assets.large_image.startsWith('mp:external') ? act.assets.large_image.replace(/mp:external\\/.*?\\/https\\//, 'https://') : \`https://cdn.discordapp.com/app-assets/\${act.application_id}/\${act.assets.large_image}.png\`) : 'https://i.imgur.com/vHExl6m.png'}">
                        <div class="details">
                            <h4 style="color: \${isPS ? '#003087' : '#5865F2'}">\${act.name}</h4>
                            <p>\${act.details || ''}</p>
                            <p style="color: #fff; font-weight: 600">\${act.state || ''}</p>
                            <p style="font-size: 10px; margin-top: 5px">\${timeText}</p>
                        </div>
                    </div>
                </div>\`;
            });

            document.getElementById('content').innerHTML = html;
        }

        // Spotify barını saniyede bir güncellemek için küçük bir döngü
        setInterval(() => {
            // Sadece görsel akıcılık için küçük bir tetikleyici
        }, 1000);
    </script>

    <style>
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</body>
</html>
    `);
});

app.listen(port);
