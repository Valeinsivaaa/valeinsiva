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
    <title>Live Activity | Pro</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --spotify: #1DB954;
            --ps: #003087;
            --discord: #5865F2;
            --glass: rgba(255, 255, 255, 0.05);
        }

        body { 
            background: #050505; color: white; height: 100vh; 
            display: flex; justify-content: center; align-items: center; 
            font-family: 'Segoe UI', system-ui, sans-serif;
            margin: 0;
        }

        .container {
            width: 380px; padding: 20px; border-radius: 24px;
            background: linear-gradient(145deg, #111, #080808);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        /* Profil Header */
        .profile { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .avatar { width: 64px; height: 64px; border-radius: 18px; position: relative; }
        .avatar img { width: 100%; border-radius: 18px; }
        .status { 
            position: absolute; bottom: -4px; right: -4px; width: 16px; height: 16px; 
            border-radius: 50%; border: 3px solid #0a0a0a; 
        }

        /* Widgetlar */
        .widget {
            background: var(--glass); border-radius: 16px; padding: 12px;
            margin-top: 12px; border: 1px solid rgba(255,255,255,0.03);
            display: none; transform-origin: top;
            animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        .widget-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .widget-img { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; }
        
        /* Spotify Özel */
        .spotify-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; }
        .spotify-progress { height: 100%; background: var(--spotify); border-radius: 2px; transition: width 0.1s linear; }
        
        .title { font-size: 14px; font-weight: 700; color: #eee; margin: 0; }
        .subtitle { font-size: 12px; color: #999; margin: 2px 0; }
        .time { font-size: 10px; color: #666; display: flex; justify-content: space-between; margin-top: 4px; }

        /* Dönen Spotify Resmi */
        .rotating { animation: rotate 8s linear infinite; border-radius: 50% !important; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    </style>
</head>
<body>

    <div class="container">
        <div class="profile">
            <div class="avatar">
                <img id="pfp" src="">
                <div id="status-dot" class="status"></div>
            </div>
            <div>
                <div id="name" style="font-weight: 800; font-size: 18px;">Yükleniyor...</div>
                <div id="custom-text" style="font-size: 12px; color: #777;">Bağlantı kuruluyor...</div>
            </div>
        </div>

        <div id="spotify-widget" class="widget">
            <div class="widget-header">
                <img id="sp-img" class="widget-img rotating" src="">
                <div style="flex:1">
                    <p class="title" id="sp-title"></p>
                    <p class="subtitle" id="sp-artist"></p>
                </div>
                <i class="fab fa-spotify" style="color: var(--spotify); font-size: 20px;"></i>
            </div>
            <div class="spotify-bar"><div id="sp-progress" class="spotify-progress"></div></div>
            <div class="time"><span id="sp-current">0:00</span><span id="sp-total">0:00</span></div>
        </div>

        <div id="game-widget" class="widget">
            <div class="widget-header">
                <img id="gm-img" class="widget-img" src="">
                <div style="flex:1">
                    <p class="title" id="gm-title"></p>
                    <p class="subtitle" id="gm-detail"></p>
                </div>
                <i id="gm-icon" class="fas fa-gamepad" style="color: var(--discord); font-size: 18px;"></i>
            </div>
            <div id="gm-time" style="font-size: 11px; color: #888; text-align: right;"></div>
        </div>
    </div>

    <script>
        const userId = "${DISCORD_ID}";
        let socket;
        
        function connect() {
            socket = new WebSocket('wss://api.lanyard.rest/socket');
            
            socket.onmessage = (m) => {
                const { op, t, d } = JSON.parse(m.data);
                if (op === 1) {
                    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
                    setInterval(() => socket.send(JSON.stringify({ op: 3 })), d.heartbeat_interval);
                }
                if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') update(d);
            };

            socket.onclose = () => setTimeout(connect, 3000); // Bağlantı koparsa 3 sn sonra tekrar dene
        }

        function format(ms) {
            const min = Math.floor(ms / 60000);
            const sec = Math.floor((ms % 60000) / 1000);
            return \`\${min}:\${sec < 10 ? '0' : ''}\${sec}\`;
        }

        function update(d) {
            // Profil
            document.getElementById('pfp').src = \`https://cdn.discordapp.com/avatars/\${d.discord_user.id}/\${d.discord_user.avatar}.png\`;
            document.getElementById('name').innerText = d.discord_user.global_name;
            const statusColors = { online: '#43b581', idle: '#faa61a', dnd: '#f04747', offline: '#747f8d' };
            document.getElementById('status-dot').style.background = statusColors[d.discord_status];
            
            // Spotify
            const sp = d.spotify;
            const spWidget = document.getElementById('spotify-widget');
            if (d.listening_to_spotify) {
                spWidget.style.display = 'block';
                document.getElementById('sp-img').src = sp.album_art_url;
                document.getElementById('sp-title').innerText = sp.song;
                document.getElementById('sp-artist').innerText = sp.artist;
                
                // Progress saniyelik güncelleme
                const updateBar = () => {
                    const now = Date.now();
                    const current = now - sp.timestamps.start;
                    const total = sp.timestamps.end - sp.timestamps.start;
                    const pct = Math.min(100, (current / total) * 100);
                    document.getElementById('sp-progress').style.width = pct + '%';
                    document.getElementById('sp-current').innerText = format(current);
                    document.getElementById('sp-total').innerText = format(total);
                };
                updateBar();
            } else {
                spWidget.style.display = 'none';
            }

            // Oyun / PS
            const game = d.activities.find(a => a.type === 0);
            const gmWidget = document.getElementById('game-widget');
            if (game) {
                gmWidget.style.display = 'block';
                document.getElementById('gm-title').innerText = game.name;
                document.getElementById('gm-detail').innerText = game.details || 'Oynuyor';
                
                // PlayStation kontrolü
                if (game.name.includes('PlayStation')) {
                    document.getElementById('gm-icon').className = 'fab fa-playstation';
                    document.getElementById('gm-icon').style.color = '#003087';
                }
                
                // Resim tespiti
                let imgUrl = 'https://i.imgur.com/vHExl6m.png';
                if (game.assets?.large_image) {
                    imgUrl = game.assets.large_image.startsWith('mp:') ? 
                        game.assets.large_image.replace('mp:', 'https://media.discordapp.net/') : 
                        \`https://cdn.discordapp.com/app-assets/\${game.application_id}/\${game.assets.large_image}.png\`;
                }
                document.getElementById('gm-img').src = imgUrl;
            } else {
                gmWidget.style.display = 'none';
            }
        }

        connect();
    </script>
</body>
</html>
    `);
});

app.listen(port);
