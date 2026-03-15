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
res.cookie("viewed","yes",{maxAge:31536000000})
}

let d

try{

const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
d = r.data.data

}catch{

return res.send("Discord API error")

}

const user = d.discord_user
const spotify = d.spotify

const avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`

let activities = d.activities.filter(a=>a.type!==2 && a.id!=="custom")

let spotifyHTML = ""

if(spotify){

spotifyHTML = `

<div class="activity spotify">

<img src="${spotify.album_art_url}" class="cover">

<div class="act-info">

<div class="title">
<i class="fab fa-spotify"></i> Spotify
</div>

<div class="song">${spotify.song}</div>
<div class="artist">${spotify.artist}</div>

<div class="wave">
<div></div><div></div><div></div><div></div><div></div>
</div>

<div class="progress">
<div id="bar"></div>
</div>

</div>

</div>

`

}

let gamesHTML=""

activities.forEach(act=>{

let img="https://cdn.discordapp.com/embed/avatars/0.png"

if(act.assets && act.assets.large_image){

img=`https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png`

}

let time=""

if(act.timestamps && act.timestamps.start){

let diff = Date.now()-act.timestamps.start
let min = Math.floor(diff/60000)
let h = Math.floor(min/60)

time = h>0 ? `${h}s ${min%60}dk oynuyor` : `${min}dk oynuyor`

}

gamesHTML += `

<div class="activity game">

<img src="${img}" class="cover">

<div class="act-info">

<div class="title">
<i class="fa-brands fa-playstation"></i> Oynuyor
</div>

<div class="song">${act.name}</div>
<div class="artist">${act.details || ""}</div>

<div class="time">${time}</div>

</div>

</div>

`

})

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
background:#0b0b12;
color:white;
font-family:Inter;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.bg{
position:fixed;
inset:0;
background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);
background-size:400% 400%;
animation:bg 15s infinite;
filter:blur(60px);
opacity:.6
}

@keyframes bg{
0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}
}

.card{

width:450px;

background:rgba(255,255,255,.04);

border:1px solid rgba(255,255,255,.1);

border-radius:25px;

backdrop-filter:blur(30px);

padding:30px;

box-shadow:0 40px 100px rgba(0,0,0,.7)

}

.avatar{

width:120px;
height:120px;

border-radius:50%;

display:block;

margin:auto

}

.name{

text-align:center;

font-size:28px;

margin-top:10px;

font-weight:800

}

.activities{

margin-top:20px;

display:flex;

flex-direction:column;

gap:12px

}

.activity{

display:flex;

gap:12px;

background:rgba(0,0,0,.4);

padding:12px;

border-radius:14px

}

.cover{

width:60px;
height:60px;

border-radius:10px

}

.title{
font-size:12px;
opacity:.7
}

.song{
font-weight:700
}

.artist{
font-size:13px;
opacity:.7
}

.progress{
height:4px;
background:rgba(255,255,255,.1);
margin-top:6px;
border-radius:2px
}

#bar{
height:100%;
background:#1db954;
width:0%
}

.wave{

display:flex;
gap:3px;
margin-top:6px

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
.wave div:nth-child(5){animation-delay:.5s}

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

<div class="activities">

${spotifyHTML}

${gamesHTML}

</div>

<div class="footer">

<div>👀 ${views}</div>

<a href="https://discord.com/users/${DISCORD_ID}" target="_blank">Discord</a>

</div>

</div>

<script>

let start=${spotify?spotify.timestamps.start:0}
let end=${spotify?spotify.timestamps.end:0}

function update(){

if(!start)return

let now=Date.now()

let percent=((now-start)/(end-start))*100

if(percent<0)percent=0
if(percent>100)percent=100

let bar=document.getElementById("bar")

if(bar)bar.style.width=percent+"%"

}

setInterval(update,1000)

</script>

</body>

</html>

`)

})

app.listen(PORT)
