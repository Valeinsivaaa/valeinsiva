const express = require("express");
const axios = require("axios");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());

const DISCORD_ID = "877946035408891945";

let views = 0;

try {
views = JSON.parse(fs.readFileSync("views.json")).views;
} catch {
views = 0;
}

function saveViews(){
fs.writeFileSync("views.json",JSON.stringify({views}));
}

app.get("/", async (req,res)=>{

if(!req.cookies.viewed){
views++;
saveViews();
res.cookie("viewed","yes",{maxAge:31536000000});
}

let d;

try{

const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}?t=${Date.now()}`);

d = r.data.data;

}catch{

return res.send("Discord API Error");

}

const user = d.discord_user;
const spotify = d.spotify;

const activities = d.activities.filter(a=>a.type!==2 && a.id!=="custom");

const avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;

const banner = user.banner
? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=1024`
: null;

const avatarDecoration = user.avatar_decoration_data
? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png`
: null;

let badges="";

const flags = user.public_flags;

const badgeMap={
1:"discordstaff",
2:"discordpartner",
4:"hypesquad",
8:"bughunter_level_1",
64:"hypesquadbravery",
128:"hypesquadbrilliance",
256:"hypesquadbalance",
512:"earlysupporter",
16384:"bughunter_level_2",
131072:"developer",
4194304:"active_developer"
};

Object.keys(badgeMap).forEach(f=>{
if(flags & f){
badges+=`<img class="badge" src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/${badgeMap[f]}.svg">`;
}
});

let spotifyHTML="";

if(spotify){

spotifyHTML=`

<div class="card-act spotify">

<img src="${spotify.album_art_url}">

<div style="width:100%">

<h4>🎧 Spotify</h4>

<p><b>${spotify.song}</b></p>

<p>${spotify.artist}</p>

<div class="progress">

<div id="spotifyBar" class="bar"></div>

</div>

</div>

</div>

`;

}

let activitiesHTML="";

activities.forEach(act=>{

let img="https://cdn.discordapp.com/embed/avatars/0.png";

if(act.assets && act.assets.large_image){

img=`https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png`;

}

let time="";

if(act.timestamps && act.timestamps.start){

const diff=Date.now()-act.timestamps.start;

const min=Math.floor(diff/60000);
const h=Math.floor(min/60);

time=h>0?`${h}s ${min%60}dk oynuyor`:`${min}dk oynuyor`;

}

activitiesHTML+=`

<div class="card-act game">

<img src="${img}">

<div>

<h4>🎮 ${act.name}</h4>

<p>${act.details||""}</p>

<p>${act.state||""}</p>

<p class="time">${time}</p>

</div>

</div>

`;

});

res.send(`

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${user.username}</title>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:Inter
}

body{

background:black;
color:white;
display:flex;
justify-content:center;
align-items:center;
min-height:100vh;

}

.bg{

position:fixed;
inset:0;

background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);

background-size:400% 400%;

animation:grad 15s infinite;

filter:blur(80px);

opacity:.7;

}

@keyframes grad{

0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}

}

.card{

width:480px;

background:rgba(255,255,255,.03);

backdrop-filter:blur(30px);

border-radius:25px;

padding:30px;

border:1px solid rgba(255,255,255,.08);

box-shadow:0 40px 100px rgba(0,0,0,.8);

}

.banner{

height:120px;

background-size:cover;

border-radius:15px;

margin-bottom:20px;

}

.avatar-box{

position:relative;

text-align:center;

}

.avatar{

width:120px;
height:120px;

border-radius:50%;

border:4px solid black;

}

.dec{

position:absolute;
top:0;
left:50%;
transform:translateX(-50%);
width:120px;

}

.status{

position:absolute;
bottom:8px;
right:calc(50% - 70px);

width:26px;
height:26px;

border-radius:50%;

border:4px solid black;

}

.online{background:#43b581;box-shadow:0 0 10px #43b581}
.idle{background:#faa61a}
.dnd{background:#f04747}
.offline{background:#747f8d}

.name{

text-align:center;

font-size:30px;

font-weight:800;

margin-top:10px;

}

.badges{

display:flex;
justify-content:center;
gap:6px;
margin-top:10px;

}

.badge{

width:20px;

}

.activities{

margin-top:20px;

display:flex;
flex-direction:column;
gap:10px;

}

.card-act{

display:flex;
gap:12px;

background:rgba(0,0,0,.4);

padding:12px;

border-radius:15px;

}

.card-act img{

width:60px;
height:60px;

border-radius:10px;

}

.spotify{

border-left:4px solid #1DB954;

}

.game{

border-left:4px solid #5865F2;

}

.progress{

height:4px;
background:rgba(255,255,255,.1);

border-radius:2px;

margin-top:6px;

overflow:hidden;

}

.bar{

height:100%;
background:#1DB954;

width:0%;

}

.footer{

margin-top:20px;

display:flex;
justify-content:space-between;

opacity:.6;

font-size:13px;

}

</style>

</head>

<body>

<div class="bg"></div>

<div class="card">

${banner?`<div class="banner" style="background-image:url(${banner})"></div>`:""}

<div class="avatar-box">

<img class="avatar" src="${avatar}">

${avatarDecoration?`<img class="dec" src="${avatarDecoration}">`:""}

<div class="status ${d.discord_status}"></div>

</div>

<div class="name">${user.global_name||user.username}</div>

<div class="badges">${badges}</div>

<div class="activities">

${spotifyHTML}

${activitiesHTML}

</div>

<div class="footer">

<div>👀 ${views}</div>

<a href="https://discord.com/users/${DISCORD_ID}" target="_blank">Discord</a>

</div>

</div>

<script>

let start=${spotify?spotify.timestamps.start:0}
let end=${spotify?spotify.timestamps.end:0}

function updateSpotify(){

if(!start)return

let now=Date.now()

let percent=((now-start)/(end-start))*100

if(percent<0)percent=0
if(percent>100)percent=100

let bar=document.getElementById("spotifyBar")

if(bar)bar.style.width=percent+"%"

}

setInterval(updateSpotify,1000)

setInterval(()=>location.reload(),15000)

</script>

</body>

</html>

`);

});

app.listen(port,()=>{

console.log("Server started");

});
