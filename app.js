const express = require("express")
const axios = require("axios")
const cookieParser = require("cookie-parser")

const app = express()
app.use(cookieParser())

const PORT = 3000
const DISCORD_ID = "877946035408891945"

let views = 0

app.get("/", async (req,res)=>{

if(!req.cookies.viewed){
views++
res.cookie("viewed","1",{maxAge:31536000000})
}

let data

try{
const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
data = r.data.data
}catch{
return res.send("Discord API error")
}

const user = data.discord_user
const avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`
const spotify = data.spotify
const activities = data.activities

res.send(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<style>

body{
margin:0;
font-family:Inter;
background:#0e0e15;
color:white;
display:flex;
justify-content:center;
align-items:center;
height:100vh
}

.bg{
position:fixed;
inset:0;
background:linear-gradient(120deg,#0f0c29,#302b63,#24243e);
background-size:300% 300%;
animation:bg 20s infinite;
opacity:.7
}

@keyframes bg{
0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}
}

.card{
width:420px;
background:rgba(255,255,255,.05);
border-radius:20px;
padding:25px;
backdrop-filter:blur(10px);
box-shadow:0 30px 80px rgba(0,0,0,.6)
}

.avatar{
width:110px;
height:110px;
border-radius:50%;
display:block;
margin:auto
}

.status{
width:18px;
height:18px;
border-radius:50%;
position:absolute;
border:3px solid #0e0e15
}

.online{background:#43b581}
.idle{background:#faa61a}
.dnd{background:#f04747}
.offline{background:#747f8d}

.name{
text-align:center;
font-size:26px;
font-weight:700;
margin-top:10px
}

.badges{
display:flex;
justify-content:center;
gap:6px;
margin-top:10px
}

.badges img{
width:20px
}

.activity{
display:flex;
gap:12px;
background:rgba(0,0,0,.4);
padding:10px;
border-radius:12px;
margin-top:12px
}

.cover{
width:56px;
height:56px;
border-radius:10px
}

.song{font-weight:700}
.artist{font-size:13px;opacity:.7}

.progress{
height:4px;
background:#222;
margin-top:6px;
border-radius:2px
}

.bar{
height:100%;
background:#1db954;
width:0%
}

.timeRow{
display:flex;
justify-content:space-between;
font-size:11px;
opacity:.7
}

.wave{
display:flex;
gap:3px;
margin-top:5px
}

.wave div{
width:3px;
height:10px;
background:#1db954;
animation:wave 1s infinite
}

.wave div:nth-child(2){animation-delay:.2s}
.wave div:nth-child(3){animation-delay:.3s}
.wave div:nth-child(4){animation-delay:.4s}

@keyframes wave{
0%{height:6px}
50%{height:14px}
100%{height:6px}
}

.footer{
margin-top:15px;
display:flex;
justify-content:space-between;
opacity:.6
}

</style>

</head>

<body>

<div class="bg"></div>

<div class="card">

<img class="avatar" src="${avatar}">

<div class="name">${user.global_name || user.username}</div>

<div class="badges">

<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg">
<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/boost.svg">
<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/quest_completed.svg">

</div>

${spotify?`

<div class="activity">

<img class="cover" src="${spotify.album_art_url}">

<div style="width:100%">

<div class="song">
<i class="fab fa-spotify"></i>
${spotify.song}
</div>

<div class="artist">${spotify.artist}</div>

<div class="wave">
<div></div><div></div><div></div><div></div>
</div>

<div class="timeRow">
<div id="start">00:00</div>
<div id="end">00:00</div>
</div>

<div class="progress">
<div id="bar" class="bar"></div>
</div>

</div>

</div>

`:""}

<div id="game"></div>

<div class="footer">

<div>👀 ${views}</div>

</div>

</div>

<script>

const spotifyStart=${spotify?spotify.timestamps.start:0}
const spotifyEnd=${spotify?spotify.timestamps.end:0}

function format(ms){

let s=Math.floor(ms/1000)

let m=Math.floor(s/60)
s=s%60

return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")

}

function updateSpotify(){

if(!spotifyStart)return

let now=Date.now()

let progress=(now-spotifyStart)/(spotifyEnd-spotifyStart)

if(progress<0)progress=0
if(progress>1)progress=1

document.getElementById("bar").style.width=(progress*100)+"%"

document.getElementById("start").innerText=format(now-spotifyStart)

document.getElementById("end").innerText=format(spotifyEnd-spotifyStart)

}

setInterval(updateSpotify,1000)

</script>

</body>

</html>

`)

})

app.listen(PORT)
