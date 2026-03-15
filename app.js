const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// BURAYI KENDİ DISCORD ID'N İLE DEĞİŞTİR
const DISCORD_ID = '877946035408891945'; 

app.get('/', async (req, res) => {
    let discordStatus = { status: 'offline', activities: [] };
    
    // Lanyard API'den Discord verilerini çekiyoruz
    try {
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        discordStatus = response.data.data;
    } catch (err) {
        console.log("Discord verisi çekilemedi.");
    }

    // HTML, CSS ve Client-side JS hepsi burada
    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Valeinsiva | Profile</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        
        body {
            background: #0a0a0a;
            color: white;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        /* Arka Plan Animasyonu */
        .bg {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, #0f0c29, #302b63, #24243e);
            background-size: 400% 400%;
            animation: gradientBG 10s ease infinite;
            z-index: -1;
        }
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Profil Kartı */
        .card {
            width: 400px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .banner {
            width: 100%;
            height: 120px;
            background: url('https://via.placeholder.com/400x120') center/cover;
            border-radius: 15px;
            margin-bottom: -50px;
        }

        .avatar-container {
            position: relative;
            display: inline-block;
        }

        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #1a1a1a;
            background: #222;
        }

        /* Discord Durum İkonu (Sağ Alt) */
        .status-dot {
            position: absolute;
            bottom: 10px;
            right: 5px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            border: 4px solid #1a1a1a;
        }
        .online { background: #43b581; }
        .idle { background: #faa61a; }
        .dnd { background: #f04747; }
        .offline { background: #747f8d; }

        h2 { margin-top: 15px; font-size: 24px; }
        p { color: #bbb; font-size: 14px; margin-bottom: 20px; }

        .discord-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 10px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="bg"></div>
    
    <div class="card">
        <div class="banner"></div>
        <div class="avatar-container">
            <img class="avatar" src="https://cdn.discordapp.com/avatars/${discordStatus.discord_user?.id}/${discordStatus.discord_user?.avatar}.png" alt="Avatar">
            <div class="status-dot ${discordStatus.discord_status}"></div>
        </div>
        
        <h2>${discordStatus.discord_user?.username || 'Valeinsiva'}</h2>
        <p>Developer & Gamer</p>

        <div class="discord-info">
            <strong>Şu an ne yapıyor?</strong><br>
            ${discordStatus.activities.length > 0 ? discordStatus.activities[0].name : 'Sadece takılıyor...'}
        </div>
    </div>

    <script>
        // Sayfayı yenilemeden Discord durumunu güncellemek için basit bir döngü
        setInterval(() => { location.reload(); }, 30000); // 30 saniyede bir yeniler
    </script>
</body>
</html>
    `);
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
