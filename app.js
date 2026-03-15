const express = require('express');
const axios = require('axios');
const app = express();

const port = process.env.PORT || 3000;
const DISCORD_ID = "877946035408891945";

let views = 0;

app.get("/", async (req,res)=>{

views++;

let data;

try{
const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
data = r.data.data;
}catch{
return res.send("Lanyard sunucusuna katılman gerekiyor.");
}

const user = data.discord_user;

const avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
const banner = user.banner
? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=1024`
: "https://i.imgur.com/8Km9tLL.jpg";

const spotify = data.spotify;
const activity = data.activities.find(x=>x.type === 0);

res.send(`
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${user.username}</title>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:Inter;
}

body{
background:#030303;
color:white;
display:flex;
justify-content:center;
align-items:center;
min-height:100vh;
overflow:hidden;
}

/* animated background */

.bg{
position:fixed;
width:100%;
height:100%;
background:linear-gradient(45deg,#1a0033,#0a0a2a,#25003d,#000);
background-size:400% 400%;
animation:bgmove 20s infinite;
z-index:-1;
filter:blur(90px);
opacity:.7;
}

@keyframes bgmove{
0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}
}

.card{

width:480px;

background:rgba(255,255,255,0.03);
backdrop-filter:blur(40px);

border-radius:30px;
overflow:hidden;

border:1px solid rgba(255,255,255,0.08);

box-shadow:0 30px 120px rgba(0,0,0,.9);

}

/* banner */

.banner{
width:100%;
height:140px;
background:url("${banner}");
background-size:cover;
background-position:center;
}

/* avatar */

.avatar-box{

display:flex;
justify-content:center;
margin-top:-60px;

}

.avatar{

width:120px;
height:120px;

border-radius:50%;
border:6px solid #030303;

}

/* username */

.name{

text-align:center;
font-size:28px;
font-weight:800;

margin-top:10px;

}

/* badges */

.badges{

display:flex;
justify-content:center;
gap:10px;
margin:10px 0 20px 0;

}

.badge{

background:rgba(255,255,255,.08);
padding:6px 10px;
border-radius:10px;
font-size:12px;

}

/* activity cards */

.activity{

margin:10px 20px;

padding:15px;

border-radius:18px;

background:rgba(0,0,0,.45);

border:1px solid rgba(255,255,255,.05);

display:flex;
gap:14px;

align-items:center;

}

.activity img{

width:60px;
height:60px;
border-radius:12px;

}

.spotify{
border-left:4px solid #1DB954;
}

.game{
border-left:4px solid #5865F2;
}

.text h3{
font-size:15px;
}

.text p{
font-size:12px;
color:#aaa;
}

/* footer */

.footer{

display:flex;
justify-content:space-between;
align-items:center;

padding:20px;

margin-top:15px;

border-top:1px solid rgba(255,255,255,.05);

}

.dc{

font-size:24px;
color:white;
transition:.3s;

}

.dc:hover{
color:#5865F2;
transform:scale(1.2);
}

.views{

display:flex;
align-items:center;
gap:6px;
color:#bbb;
font-size:13px;

}

</style>

</head>

<body>

<div class="bg"></div>

<div class="card">

<div class="banner"></div>

<div class="avatar-box">
<img class="avatar" src="${avatar}">
</div>

<div class="name">${user.username}</div>

<div class="badges">
<div class="badge">Discord</div>
<div class="badge">User</div>
</div>

${spotify ? `

<div class="activity spotify">

<img src="${spotify.album_art_url}">

<div class="text">

<h3>${spotify.song}</h3>

<p>${spotify.artist}</p>

<p style="color:#1DB954"><i class="fab fa-spotify"></i> Spotify</p>

</div>

</div>

` : ""}

${activity ? `

<div class="activity game">

<img src="https://cdn-icons-png.flaticon.com/512/686/686589.png">

<div class="text">

<h3>${activity.name}</h3>

<p>${activity.details || "Playing game"}</p>

<p>${activity.state || ""}</p>

</div>

</div>

` : ""}

${(!spotify && !activity) ? `
<div style="text-align:center;color:#555;margin:20px">
Şu an aktif bir şey yok
</div>
` : ""}

<div class="footer">

<a href="https://discord.com/users/${DISCORD_ID}" target="_blank" class="dc">
<i class="fab fa-discord"></i>
</a>

<div class="views">
<i class="fa fa-eye"></i>
${views}
</div>

</div>

</div>

<script>
setInterval(()=>location.reload(),30000)
</script>

</body>

</html>
`);

});

app.listen(port,()=>console.log("Site aktif"));
