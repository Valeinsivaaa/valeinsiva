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
    <title>Live Profile | v3</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg: #0a0a0c;
            --card-bg: #121214;
            --accent-blue: #5865F2;
            --spotify: #1DB954;
            --border: rgba(255, 255, 255, 0.05);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: var(--bg); color: #fff; height: 100vh; display: flex; justify-content: center; align-items: center; }

        /* Arka Plan Hareketli Işıklar */
        .bg-gradient {
            position: fixed; width: 100%; height: 100%; top: 0; left: 0;
            background: radial-gradient(circle at 10% 20%, rgba(88, 101, 242, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(29, 185, 84, 0.05) 0%, transparent 40%);
            z-index: -1;
        }

        .card {
            width: 440px; background: var(--card-bg); border-radius: 24px;
            border: 1px solid var(--border); padding: 32px;
            box-shadow: 0 40px 80px rgba(0,0,0,0.6); position: relative;
            overflow: hidden;
        }

        /* Üst Header */
        .header { display: flex; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
        .avatar-area { position: relative; }
        .avatar { width: 90px; height: 90px; border-radius: 22px; object-fit: cover; border: 2px solid var(--border); }
        .status-badge { 
            position: absolute; bottom: -6px; right: -6px; width: 22px; height: 22px; 
            border-radius: 50%; border: 4px solid var(--card-bg);
        }

        .user-meta h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
        
        /* Rozetler */
        .badges-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .badge { width: 22px; height: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }

        /* Widgetlar */
        .widget-label { font-size: 11px; font-weight: 800; color: #444; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .widget-label span { height: 1px; flex: 1; background: var(--border); }

        .widget-content { 
            background: rgba(255,255,255,0.02); border: 1px solid var(--border);
            border-radius: 16px; padding: 16px; margin-bottom: 16px;
            display: none; transition: 0.3s;
        }
        .widget-content.active { display: block; animation: fadeIn 0.5s ease; }

        /* Spotify Özel */
        .spotify-info { display: flex; gap: 14px; align-items: center; }
        .album-cover { width: 54px; height: 54px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .track-name { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px; }
        .artist-name { font-size: 12px; color: #888; }
        
        .progress-container { margin-top: 14px; }
        .bar-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; position: relative; }
        .bar-fill { height: 100%; background: var(--spotify); border-radius: 2px; width: 0%; }
        .time-labels { display: flex; justify-content: space-between; font-size: 10px; color: #555; margin-top: 6px; font-weight: 600; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="card">
        <div class="header">
            <div class="avatar-area">
                <img id="avatar" class="avatar" src="">
                <div id="status" class="status-badge"></div>
            </div>
            <div class="user-meta">
                <h1 id="username">...</h1>
                <div id="badges" class="badges-row"></div>
            </div>
        </div>

        <div id="spotify-widget" class="widget-content">
            <div class="widget-label">Dinliyor <span></span></div>
            <div class="spotify-info">
                <img id="sp-art" class="album-cover" src="">
                <div style="overflow: hidden;">
                    <div id="sp-name" class="track-name"></div>
                    <div id="sp-artist" class="artist-name"></div>
                </div>
            </div>
            <div class="progress-container">
                <div class="bar-bg"><div id="sp-bar" class="bar-fill"></div></div>
                <div class="time-labels"><span id="sp-start">0:00</span><span id="sp-end">0:00</span></div>
            </div>
        </div>

        <div id="game-widget" class="widget-content">
            <div class="widget-label">Oynuyor <span></span></div>
            <div id="game-info" class="spotify-info">
                </div>
        </div>
    </div>

    <script>
        const userId = "${DISCORD_ID}";
        
        // Rozetleri her zaman doğru göstermek için gelişmiş liste
        const badgeIcons = {
            'STAFF': 'discordstaff', 'PARTNER': 'discordpartner',
            'HYPESQUAD': 'hypesquad', 'BUG_HUNTER_LEVEL_1': 'bughunter_level_1',
            'HYPESQUAD_ONLINE_HOUSE_1': 'hypesquadbravery', 'HYPESQUAD_ONLINE_HOUSE_2': 'hypesquadbrilliance',
            'HYPESQUAD_ONLINE_HOUSE_3': 'hypesquadbalance', 'PREMIUM_EARLY_SUPPORTER': 'earlysupporter',
            'VERIFIED_DEVELOPER': 'developer', 'ACTIVE_DEVELOPER': 'active_developer'
        };

        const socket = new WebSocket('wss://api.lanyard.rest/socket');
        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.op === 1) {
                socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
                setInterval(() => socket.send(JSON.stringify({ op: 3 })), data.d.heartbeat_interval);
            }
            if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') update(data.d);
        };

        function format(ms) {
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
        }

        function update(d) {
            const user = d.discord_user;
            document.getElementById('avatar').src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
            document.getElementById('username').innerText = user.global_name || user.username;
            
            // Durum Renkleri
            const statusMap = { online: '#43b581', idle: '#faa61a', dnd: '#f04747', offline: '#747f8d' };
            document.getElementById('status').style.background = statusMap[d.discord_status];

            // Rozet İşleme
            let bHtml = '';
            // Nitro tespiti (Animasyonsuz profil olsa bile banner varsa nitro ihtimali yüksektir)
            if (user.avatar_decoration_data || user.banner) {
                 bHtml += \`<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge">\`;
            }
            
            if (user.public_flags_array) {
                user.public_flags_array.forEach(flag => {
                    if (badgeIcons[flag]) {
                        bHtml += \`<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/\${badgeIcons[flag]}.svg" class="badge">\`;
                    }
                });
            }
            document.getElementById('badges').innerHTML = bHtml;

            // Spotify
            const spWidget = document.getElementById('spotify-widget');
            if (d.listening_to_spotify) {
                spWidget.classList.add('active');
                document.getElementById('sp-art').src = d.spotify.album_art_url;
                document.getElementById('sp-name').innerText = d.spotify.song;
                document.getElementById('sp-artist').innerText = d.spotify.artist;
                
                const total = d.spotify.timestamps.end - d.spotify.timestamps.start;
                const now = Date.now() - d.spotify.timestamps.start;
                document.getElementById('sp-bar').style.width = Math.min(100, (now/total)*100) + '%';
                document.getElementById('sp-start').innerText = format(now);
                document.getElementById('sp-end').innerText = format(total);
            } else {
                spWidget.classList.remove('active');
            }

            // Oyunlar (PS5 vb.)
            const gameWidget = document.getElementById('game-widget');
            const game = d.activities.find(a => a.type === 0);
            if (game) {
                gameWidget.classList.add('active');
                let img = 'https://i.imgur.com/vHExl6m.png';
                if (game.assets?.large_image) {
                    img = game.assets.large_image.startsWith('mp:') ? 
                        game.assets.large_image.replace('mp:', 'https://media.discordapp.net/') : 
                        \`https://cdn.discordapp.com/app-assets/\${game.application_id}/\${game.assets.large_image}.png\`;
                }
                document.getElementById('game-info').innerHTML = \`
                    <img src="\${img}" class="album-cover">
                    <div>
                        <div class="track-name">\${game.name}</div>
                        <div class="artist-name">\${game.details || 'Oynuyor'}</div>
                        <div class="artist-name" style="color:var(--accent-blue); font-weight:bold; margin-top:4px;">\${game.state || ''}</div>
                    </div>
                \`;
            } else {
                gameWidget.classList.remove('active');
            }
        }
    </script>
</body>
</html>
    `);
});

app.listen(port);
