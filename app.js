const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// SADECE ID GİRİN - Lanyard veriyi bu ID üzerinden çeker
const DISCORD_ID = '877946035408891945'; 
let viewsCount = 0;

app.get('/', async (req, res) => {
    viewsCount++;
    
    // Cache'i devre dışı bırak, veri taze kalsın
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    let d = null;
    try {
        // Lanyard API: Gerçek zamanlı veri için taze zaman damgası ekliyoruz
        const response = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}?t=${Date.now()}`);
        d = response.data.data;
    } catch (err) {
        // API hatası durumunda temiz bir hata sayfası göster
        return res.status(500).send(`
            <body style="background:#000;color:#f44;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                <div style="text-align:center">
                    <h1>Discord API Hatası</h1>
                    <p>Veriler şu an alınamıyor, lütfen biraz sonra tekrar deneyin.</p>
                </div>
            </body>
        `);
    }

    const user = d.discord_user;
    const spotify = d.spotify;
    // PlayStation gibi platformların özel "dinliyor" (type 2) etkinliklerini filtrele
    const activities = d.activities.filter(a => a.type !== 2 && a.id !== 'custom');

    // Avatar URL
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
    
    // Rozet Sistemi (Flags üzerinden otomatik ve manuel)
    let badgesHTML = '';
    const flags = user.public_flags;
    
    // Güvenilir, yüksek kaliteli rozet SVG kaynağı
    const badgeSource = "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/";

    const badgeMap = {
        1: 'discordstaff', 2: 'discordpartner', 4: 'hypesquad', 8: 'bughunter_level_1',
        64: 'hypesquadbravery', 128: 'hypesquadbrilliance', 256: 'hypesquadbalance',
        512: 'earlysupporter', 16384: 'bughunter_level_2', 131072: 'developer', 4194304: 'active_developer'
    };

    // Otomatik rozetleri ekle
    Object.keys(badgeMap).forEach(f => {
        if (flags & f) {
            badgesHTML += `<img src="${badgeSource}${badgeMap[f]}.svg" class="badge" title="${badgeMap[f]}">`;
        }
    });

    // İstediğin manuel rozetleri ekle: Nitro, Boost (Level 9), completed Quest
    if (user.avatar && user.avatar.startsWith('a_')) {
        badgesHTML += `<img src="${badgeSource}discordnitro.svg" class="badge" title="Nitro">`;
    }
    // Gelişmiş bir görünüm için yüksek seviye boost rozeti ekliyoruz
    badgesHTML += `<img src="${badgeSource}discordboost9.svg" class="badge" title="Boost">`;
    badgesHTML += `<img src="${badgeSource}discordcompletedquest.svg" class="badge" title="Quest Complete">`;

    // JavaScript'e aktarılacak Lanyard verilerini güvenli hale getir
    const clientData = JSON.stringify({ spotify, activities });

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.global_name || user.username} | Gelişmiş Profil</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background: #080808; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow-x: hidden; }
        
        /* Gelişmiş, Pürüzsüz Arka Plan Animasyonu */
        .bg-animate { position: fixed; inset: 0; background: linear-gradient(-135deg, #1a0033, #001233, #0d1a26, #000); background-size: 400% 400%; animation: grad 25s ease infinite; z-index: -2; opacity: 0.8; }
        .bg-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(80px); z-index: -1; }
        @keyframes grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* Elit Cam Efekti Kart Tasarımı */
        .card { width: 480px; background: rgba(20, 20, 20, 0.3); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; padding: 40px; box-shadow: 0 50px 100px rgba(0,0,0,0.8); transition: transform 0.3s ease; position: relative; overflow: hidden; }
        .card:hover { transform: translateY(-5px); }
        .card::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #1DB954, #5865F2, #ff0055); }

        /* Profil Kısmı */
        .profile-section { text-align: center; margin-bottom: 30px; }
        .avatar-box { position: relative; display: inline-block; }
        .avatar { width: 130px; height: 130px; border-radius: 50%; border: 5px solid rgba(20,20,20,0.5); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        .status { position: absolute; bottom: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; border: 4px solid rgba(20,20,20,0.5); z-index: 1; }
        .online { background: #43b581; } .idle { background: #faa61a; } .dnd { background: #f04747; } .offline { background: #747f8d; }

        .name { font-size: 36px; font-weight: 900; letter-spacing: -1.5px; margin: 15px 0 8px; background: linear-gradient(#fff, #bbb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .badges-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 30px; }
        .badge { width: 22px; height: 22px; transition: 0.2s ease; opacity: 0.9; }
        .badge:hover { transform: scale(1.2) translateY(-2px); opacity: 1; }

        /* Gelişmiş Aktivite Kartları */
        .activities { display: flex; flex-direction: column; gap: 15px; }
        .act-card { background: rgba(0,0,0,0.4); border-radius: 20px; padding: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid rgba(255,255,255,0.05); text-align: left; }
        .act-card img { width: 70px; height: 70px; border-radius: 14px; object-fit: cover; box-shadow: 0 5px 15px rgba(0,0,0,0.4); }
        
        .info { flex: 1; min-width: 0; }
        .info h4 { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .info p { font-size: 13px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .spotify-style { border-left: 4px solid #1DB954; }
        .game-style { border-left: 4px solid #5865F2; }

        /* Spotify Canlı İlerleme Çubuğu */
        .progress-container { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 10px; overflow: hidden; position: relative; }
        .progress-bar { height: 100%; background: #1DB954; width: 0%; border-radius: 3px; transition: width 0.1s linear; }
        .time-row { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 4px; font-family: 'Poppins', monospace; font-weight: 600; }

        /* Gelişmiş Footer */
        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; color: #888; font-size: 13px; }
        .footer-left { display: flex; align-items: center; gap: 15px; }
        .dc-link { color: #fff; text-decoration: none; font-size: 20px; transition: 0.2s ease; opacity: 0.7; }
        .dc-link:hover { opacity: 1; color: #5865F2; transform: scale(1.1); }
        .view-count { display: flex; align-items: center; gap: 6px; }

        /* Mobil Duyarlılık */
        @media (max-width: 520px) { .card { width: 92%; padding: 25px; } .avatar { width: 110px; height: 110px; } .name { font-size: 28px; } .act-card { padding: 15px; gap: 15px; } .act-card img { width: 60px; height: 60px; } }
    </style>
</head>
<body>
    <div class="bg-animate"></div>
    <div class="bg-overlay"></div>
    <div class="card">
        <div class="profile-section">
            <div class="avatar-box">
                <img class="avatar" src="${avatarUrl}" alt="Avatar">
                <div class="status ${d.discord_status}"></div>
            </div>
            <div class="name">${user.global_name || user.username}</div>
            <div class="badges-row">${badgesHTML}</div>
        </div>

        <div class="activities">
            ${spotify ? `
            <div class="act-card spotify-style">
                <img src="${spotify.album_art_url}" alt="Album Art">
                <div class="info">
                    <h4 style="color:#1DB954"><i class="fab fa-spotify"></i> Dinliyor</h4>
                    <p style="color:#fff; font-weight:600;"><strong>${spotify.song}</strong></p>
                    <p>by ${spotify.artist}</p>
                    <div class="progress-container"><div id="spotify-bar" class="progress-bar"></div></div>
                    <div class="time-row">
                        <span id="spotify-time-current">0:00</span>
                        <span id="spotify-time-total">0:00</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${activities.map(act => {
                const imageUrl = act.assets && act.assets.large_image ? \`https://cdn.discordapp.com/app-assets/\${act.application_id}/\${act.assets.large_image}.png\` : 'https://i.imgur.com/vHExl6m.png';
                return `
                <div class="act-card game-style">
                    <img src="${imageUrl}" alt="Game Icon">
                    <div class="info">
                        <h4 style="color:#5865F2"><i class="fas fa-gamepad"></i> Oynuyor</h4>
                        <p style="color:#fff; font-weight:600;"><strong>${act.name}</strong></p>
                        <p>${act.details || ''}</p>
                        <p id="time-spent-${act.id}" class="time-spent" data-start="${act.timestamps ? act.timestamps.start : Date.now()}">00:00'dır oynuyor</p>
                    </div>
                </div>
                `;
            }).join('')}

            ${(!spotify && activities.length === 0) ? '<p style="text-align:center; color:#555; font-size:13px; margin-top:20px;">Şu an aktif bir durum yok.</p>' : ''}
        </div>

        <div class="footer">
            <div class="footer-left">
                <a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc-link" title="Discord'da profilime git">
                    <i class="fab fa-discord"></i>
                </a>
                <span class="view-count"><i class="fas fa-eye"></i> <span>${viewsCount}</span></span>
            </div>
            <div>discord.gg/profil</div>
        </div>
    </div>
    
    <script>
        // Lanyard verilerini client-side'a aktar
        const lanyardData = ${clientData};

        // Zaman Formatlama (0:00)
        function formatTime(ms) {
            if (ms < 0) ms = 0;
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
        }

        // Spotify Canlı Güncelleme Motoru (Her saniye)
        if (lanyardData.spotify) {
            const start = lanyardData.spotify.timestamps.start;
            const end = lanyardData.spotify.timestamps.end;
            const total = end - start;
            
            // Toplam süreyi hemen yaz
            document.getElementById('spotify-time-total').innerText = formatTime(total);

            function updateSpotifyBar() {
                const now = Date.now();
                const elapsed = now - start;
                const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
                
                document.getElementById('spotify-bar').style.width = \`\${progress}%\`;
                document.getElementById('spotify-time-current').innerText = formatTime(elapsed);

                if (elapsed >= total) {
                    clearInterval(spotifyInterval);
                    // İsteğe bağlı: Süre dolunca sayfayı yenileyebiliriz, 
                    // ama Lanyard zaten backend'den yeni veriyi çekecek.
                }
            }
            // Her saniye milisaniyelik bar hareketini güncelle
            const spotifyInterval = setInterval(updateSpotifyBar, 1000);
            updateSpotifyBar(); // İlk açılışta çalıştır
        }

        // Oyun Sürelerini Canlı Hesaplama Motoru (Süre sayacı)
        const spentElements = document.querySelectorAll('.time-spent');
        if (spentElements.length > 0) {
            function updateSpentTimes() {
                spentElements.forEach(el => {
                    const startTime = parseInt(el.getAttribute('data-start'));
                    const elapsed = Date.now() - startTime;
                    el.innerText = formatTime(elapsed) + "'dır oynuyor";
                });
            }
            setInterval(updateSpentTimes, 1000);
            updateSpentTimes(); // İlk açılışta çalıştır
        }

        // Arka Planda Veri Tazelemek için Sessiz Sayfa Yenileme (30s)
        setTimeout(() => { location.reload(); }, 30000);
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Site http://localhost:${port} adresinde çalışıyor.`));
