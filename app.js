const express = require('express');
const axios = require('axios');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = express();
const port = process.env.PORT || 3000;

// ==============================
// 1. AYARLARINIZI BURAYA GİRİN
// ==============================
const DISCORD_ID = '877946035408891945'; 
const USER_NAME = 'Valeinsiva'; // Sitede görünecek isminiz
const USER_TAGLINE = 'Full-Stack Developer | Coffee Addict'; // Küçük alt yazı

// Discord Rozetlerinin İkonları (Unicode)
const badges = {
    // Örnek: HypeSquad Bravery, Developer, Nitro vb.
    bravery: '🛡️',
    developer: '💻',
    nitro: '💎',
    booster: '🚀',
    bug_hunter: '🐛'
};
// Kendi rozetlerinizin ikonlarını buradan seçin ve listeleyin
const my_badges = [badges.developer, badges.bravery, badges.nitro];

// Görüntülenme Sayacı (Bellekte geçici)
let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++; // Her girişte artır
    
    let discordData = { status: 'offline', activities: [], spotify: null };
    
    // 2. LANYARD API'DEN DISCORD VERİLERİNİ ÇEKME
    try {
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        discordData = response.data.data;
    } catch (err) {
        console.log("Discord verisi çekilemedi. (Sunucuya katıldınız mı?)");
    }

    // 3. AKTİVİTELERİ AYIKLAMA (Spotify ve Oyun)
    let playingActivity = null;
    let spotifyActivity = discordData.spotify;

    // Spotify dışındaki diğer tüm aktiviteleri (Oyunlar, IDE'ler) ayıkla
    if (discordData.activities.length > 0) {
        playingActivity = discordData.activities.find(act => act.type !== 2); // 2 = Spotify
    }

    // 4. HTML, CSS VE CLIENT-SIDE JS HEPSİ BURADA
    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${USER_NAME} | Advanced Profile</title>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', 'Segoe UI', sans-serif; }
        
        body {
            background: #050505;
            color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        /* ==============================
           A. ARKA PLAN VE ESTETİK
           ============================== */
        .bg-gradient {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            background-size: 400% 400%;
            animation: moveGradient 15s ease infinite;
            z-index: -2;
            filter: blur(5px);
        }
        @keyframes moveGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .bg-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: url('https://www.transparenttextures.com/patterns/dark-dotted.png'); /* Hafif doku */
            opacity: 0.1;
            z-index: -1;
        }

        /* ==============================
           B. PROFIL KARTI (BLUR & TRANSLUCENCY)
           ============================== */
        .card {
            width: 450px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 25px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            position: relative;
        }

        /* Profil Üst Kısmı */
        .banner {
            width: 100%; height: 140px;
            background: linear-gradient(135deg, #1e1e1e 0%, #0a0a0a 100%);
            border-radius: 18px;
            margin-bottom: -60px;
        }

        .avatar-container {
            position: relative;
            display: inline-block;
        }

        .avatar {
            width: 110px; height: 110px;
            border-radius: 50%;
            border: 6px solid #050505;
            background: #222;
        }

        /* Discord Durum İkonu (Duruma Göre Renk Alır) */
        .status-dot {
            position: absolute; bottom: 10px; right: 5px;
            width: 28px; height: 28px;
            border-radius: 50%;
            border: 6px solid #050505;
        }
        .online { background: #43b581; }
        .idle { background: #faa61a; }
        .dnd { background: #f04747; }
        .offline { background: #747f8d; }

        /* İsim ve Rozetler */
        .name-row {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
        h2 { font-size: 28px; font-weight: 700; }
        .badges { font-size: 18px; }

        .tagline { color: #888; font-size: 14px; margin-bottom: 25px; }

        /* ==============================
           C. DİNAMİK AKTİVİTELER (Spotify & Oyun)
           ============================== */
        .activities-container {
            display: flex;
            flex-direction: column;
            gap: 15px; /* Alt alta gelmelerini sağlar */
            text-align: left;
        }

        .activity-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .activity-icon { width: 50px; height: 50px; border-radius: 8px; }

        /* Spotify'a Özel Renk ve Efekt */
        .spotify-activity {
            border-left: 4px solid #1DB954;
        }
        .spotify-icon { color: #1DB954; font-size: 20px; margin-right: 5px; }

        /* Oyun/IDE Kartı */
        .playing-activity {
            border-left: 4px solid #5865F2; /* Discord Mavisi */
        }

        .activity-details h4 { font-size: 15px; font-weight: 600; color: #fff; }
        .activity-details p { font-size: 13px; color: #aaa; margin-top: 2px; }

        /* ==============================
           D. ALT KISIM (SOSYAL & İSTATİSTİK)
           ============================== */
        .footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 12px;
            color: #666;
        }

        .social-links { display: flex; gap: 15px; }
        
        /* Discord Simgesi ve Butonu */
        .social-link {
            color: #666;
            transition: color 0.3s;
            cursor: pointer;
        }
        .social-link:hover { color: #5865F2; }

        .views { display: flex; align-items: center; gap: 5px; }
        .views-icon { font-size: 14px; color: #444; }

    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="bg-overlay"></div>
    
    <div class="card">
        <div class="banner"></div>
        <div class="avatar-container">
            <img class="avatar" src="https://cdn.discordapp.com/avatars/${discordData.discord_user?.id}/${discordData.discord_user?.avatar}.png" alt="Avatar">
            <div class="status-dot ${discordData.discord_status}"></div>
        </div>
        
        <div class="name-row">
            <h2>${USER_NAME}</h2>
            <div class="badges">${my_badges.join(' ')}</div>
        </div>
        <p class="tagline">${USER_TAGLINE}</p>

        <div class="activities-container">
            
            ${spotifyActivity ? `
                <div class="activity-card spotify-activity">
                    <img class="activity-icon" src="${spotifyActivity.album_art_url}" alt="Album Art">
                    <div class="activity-details">
                        <h4>${spotifyActivity.song}</h4>
                        <p>by ${spotifyActivity.artist}</p>
                        <p><i class="fab fa-spotify spotify-icon"></i> ${spotifyActivity.album}</p>
                    </div>
                </div>
            ` : ''}

            ${playingActivity ? `
                <div class="activity-card playing-activity">
                    ${playingActivity.large_image ? `
                        <img class="activity-icon" src="https://cdn.discordapp.com/app-assets/${playingActivity.id}/${playingActivity.large_image}.png" alt="Game Icon">
                    ` : '<div class="activity-icon"><i class="fas fa-gamepad" style="font-size:30px;color:#333;"></i></div>'}
                    
                    <div class="activity-details">
                        <h4>${playingActivity.name}</h4>
                        <p>${playingActivity.details || ''}</p>
                        <p>${playingActivity.state || ''}</p>
                        ${playingActivity.type === 0 ? '<p><i class="fas fa-play"></i> Playing</p>' : ''}
                        ${playingActivity.type === 3 ? '<p><i class="fas fa-code"></i> Coding</p>' : ''}
                    </div>
                </div>
            ` : ''}

            ${(!spotifyActivity && !playingActivity) ? `
                <div class="activity-card" style="justify-content:center; text-align:center;color:#444;">
                    <p>Şu an aktif bir şey yapmıyor...</p>
                </div>
            ` : ''}

        </div>

        <div class="footer">
            <div class="social-links">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="social-link" title="Discord Profilim">
                    <i class="fab fa-discord fa-lg"></i>
                </div>
            </div>
            
            <div class="views">
                <i class="fas fa-eye views-icon"></i> 
                <span>${viewsCount.toLocaleString('en-US')} Views</span>
            </div>
        </div>
    </div>

    <script>
        // Sayfayı yenilemeden Discord durumunu ve aktivitelerini 30 saniyede bir güncelle.
        setInterval(() => {
            fetch('/').then(res => res.text()).then(html => {
                const newCard = new DOMParser().parseFromString(html, 'text/html').querySelector('.card');
                document.querySelector('.card').innerHTML = newCard.innerHTML;
            });
        }, 30000); // 30 saniyede bir yeniler
    </script>
</body>
</html>
    `);
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
