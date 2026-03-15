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
        return res.status(500).send("API Baglantisi Kesildi.");
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // Manuel ve API Rozetleri
    let badgesHTML = `
        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbravery.svg" class="badge" title="HypeSquad Bravery">
        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg" class="badge" title="Discord Nitro">
        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boost9month.svg" class="badge" title="Server Booster">
        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/completed_quest.svg" class="badge" title="Quest Completed">
        <img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/active_developer.svg" class="badge" title="Active Developer">
    `;

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${user.global_name || user.username}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --spotify: #1db954; --ps: #003791; --discord: #5865f2; }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'gg sans', 'Inter', sans-serif; }
        
        body { 
            background: #000;
            background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://cdn.discordapp.com/banners/${user.id}/${user.banner}.gif?size=1024');
            background-size: cover;
            background-position: center;
            display: flex; justify-content: center; align-items: center; min-height: 100vh;
        }
        
        /* Discord Profil Kartı Estetiği */
        .card { 
            width:450px; background: #111214; border-radius:16px; overflow:hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);
        }

        .banner { height: 120px; background: #2b2d31; position: relative; }
        .banner img { width: 100%; height: 100%; object-fit: cover; }

        .profile-info { padding: 16px; position: relative; margin-top: 45px; }
        
        .avatar-container { 
            position: absolute; top: -60px; left: 16px; 
            background: #111214; padding: 6px; border-radius: 50%;
        }
        .avatar { width: 80px; height: 80px; border-radius: 50%; }
        .status { 
            position: absolute; bottom: 8px; right: 8px; 
            width: 20px; height: 20px; border-radius: 50%; border: 4px solid #111214; 
        }
        .online { background:#43b581; } .idle { background:#faa61a; } .dnd { background:#f04747; } .offline { background:#747f8d; }

        .badge-container { 
            background: #232428; border-radius: 8px; padding: 4px 8px; 
            display: flex; gap: 4px; position: absolute; top: 16px; right: 16px;
        }
        .badge { width: 18px; height: 18px; }

        .user-details { margin-top: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; }
        .display-name { font-size: 20px; font-weight: 700; color: #fff; }
        .username { font-size: 14px; color: #b5bac1; }

        /* Aktivite Bölümleri */
        .section-title { font-size: 12px; font-weight: 700; color: #b5bac1; text-transform: uppercase; margin: 15px 0 10px 0; }
        
        .activity-box { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; }
        .activity-img { width: 60px; height: 60px; border-radius: 8px; }
        .activity-text { flex: 1; overflow: hidden; }
        .activity-text h4 { font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .activity-text p { font-size: 13px; color: #b5bac1; }

        /* Spotify Bar */
        .bar-container { width: 100%; height: 4px; background: #4e5058; border-radius: 2px; margin-top: 8px; }
        .bar-fill { height: 100%; background: #fff; width: 0%; border-radius: 2px; }
        .time-labels { display: flex; justify-content: space-between; font-size: 11px; color: #b5bac1; margin-top: 4px; }

        .footer { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
        .dc-btn { color: #b5bac1; font-size: 20px; transition: 0.2s; }
        .dc-btn:hover { color: #fff; }
        .view-count { font-size: 12px; color: #b5bac1; }
    </style>
</head>
<body>
    <div class="card">
        <div class="banner">
            <img src="https://cdn.discordapp.com/banners/${user.id}/${user.banner}.gif?size=1024" onerror="this.src='https://i.imgur.com/vHExl6m.png'">
        </div>
        
        <div class="profile-info">
            <div class="avatar-container">
                <img class="avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512">
                <div class="status ${d.discord_status}"></div>
            </div>
            
            <div class="badge-container">${badgesHTML}</div>
            
            <div class="user-details">
                <div class="display-name">${user.global_name || user.username}</div>
                <div class="username">${user.username}</div>
            </div>

            ${spotify ? `
            <div class="section-title">Listening to Spotify</div>
            <div class="activity-box">
                <img src="${spotify.album_art_url}" class="activity-img">
                <div class="activity-text">
                    <h4>${spotify.song}</h4>
                    <p>by ${spotify.artist}</p>
                    <div class="bar-container"><div id="s-bar" class="bar-fill"></div></div>
                    <div class="time-labels"><span id="s-start">0:00</span><span id="s-end">0:00</span></div>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => `
            <div class="section-title">Playing ${act.name}</div>
            <div class="activity-box">
                <img src="https://i.imgur.com/vHExl6m.png" class="activity-img">
                <div class="activity-text">
                    <h4>${act.details || act.name}</h4>
                    <p>${act.state || ''}</p>
                    <p id="ps-time" style="font-size:12px; margin-top:4px;">00:00:00 elapsed</p>
                </div>
            </div>
            `).join('')}
        </div>

        <div class="footer">
            <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-btn"><i class="fab fa-discord"></i></a>
            <div class="view-count"><i class="fas fa-eye"></i> ${viewsCount}</div>
        </div>
    </div>

    <script>
        ${spotify ? `
        const sStart = ${spotify.timestamps.start};
        const sEnd = ${spotify.timestamps.end};
        function updateSpotify() {
            const now = Date.now();
            const total = sEnd - sStart;
            const current = Math.max(0, now - sStart);
            document.getElementById('s-bar').style.width = Math.min(100, (current/total)*100) + "%";
            const fmt = (ms) => {
                const s = Math.floor((ms/1000)%60);
                return Math.floor(ms/60000) + ":" + (s<10?"0"+s:s);
            };
            document.getElementById('s-start').innerText = fmt(current);
            document.getElementById('s-end').innerText = fmt(total);
        }
        setInterval(updateSpotify, 1000); updateSpotify();
        ` : ''}

        ${activities.length > 0 && activities[0].timestamps ? `
        const psStart = ${activities[0].timestamps.start};
        function updatePS() {
            const diff = Date.now() - psStart;
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff%3600000)/60000);
            const s = Math.floor((diff%60000)/1000);
            document.getElementById('ps-time').innerText = (h>0?h+":":"") + (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s) + " elapsed";
        }
        setInterval(updatePS, 1000); updatePS();
        ` : ''}

        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `);
});
app.listen(port);
