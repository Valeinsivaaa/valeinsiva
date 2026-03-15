const express=require("express")
const axios=require("axios")
const http=require("http")
const {Server}=require("socket.io")
const cookieParser=require("cookie-parser")

const app=express()
const server=http.createServer(app)
const io=new Server(server)

app.use(cookieParser())

const DISCORD_ID="877946035408891945"
let views=0

async function getDiscord(){

const r=await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)

return r.data.data

}

io.on("connection",async socket=>{

setInterval(async()=>{

try{

const data=await getDiscord()

socket.emit("presence",data)

}catch{}

},5000)

})

app.get("/",(req,res)=>{

if(!req.cookies.viewed){

views++
res.cookie("viewed","yes",{maxAge:31536000000})

}

res.send(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width">

<script src="/socket.io/socket.io.js"></script>

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<style>

body{

margin:0;
font-family:Inter;
background:#0b0b12;
color:white;

display:flex;
justify-content:center;
align-items:center;
height:100vh;
overflow:hidden

}

.bg{

position:fixed;
inset:0;

background:linear-gradient(270deg,#0f0c29,#302b63,#24243e);

background-size:600% 600%;

animation:bgMove 20s infinite

}

@keyframes bgMove{

0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}

}

.particles div{

position:absolute;

width:4px;
height:4px;

background:white;

opacity:.3;

border-radius:50%;

animation:float 10s infinite

}

@keyframes float{

0%{transform:translateY(0)}
100%{transform:translateY(-800px)}

}

.card{

width:460px;

background:rgba(255,255,255,.04);

backdrop-filter:blur(30px);

border-radius:25px;

border:1px solid rgba(255,255,255,.1);

padding:30px;

box-shadow:0 40px 120px rgba(0,0,0,.7)

}

.avatar{

width:120px;
height:120px;

border-radius:50%;

display:block;

margin:auto

}

.status{

position:absolute;

width:22px;
height:22px;

border-radius:50%;

border:4px solid #111

}

.online{background:#43b581}
.idle{background:#faa61a}
.dnd{background:#f04747}
.offline{background:#747f8d}

.name{

text-align:center;

font-size:28px;

font-weight:800;

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

.activities{

margin-top:20px;

display:flex;

flex-direction:column;

gap:12px

}

.activity{

display:flex;

gap:12px;

background:rgba(0,0,0,.5);

padding:12px;

border-radius:14px

}

.cover{

width:60px;
height:60px;

border-radius:10px

}

.song{font-weight:700}

.artist{opacity:.7;font-size:13px}

.progress{

height:4px;

background:rgba(255,255,255,.1);

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

<div class="particles">
<div style="left:10%"></div>
<div style="left:30%"></div>
<div style="left:60%"></div>
<div style="left:80%"></div>
</div>

<div class="card">

<img id="avatar" class="avatar">

<div id="name" class="name"></div>

<div class="badges">

<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordnitro.svg">
<img src="https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbalance.svg">

</div>

<div id="activities" class="activities"></div>

<div class="footer">

<div>👀 ${views}</div>

</div>

</div>

<script>

const socket=io()

function format(ms){

let s=Math.floor(ms/1000)

let m=Math.floor(s/60)

s=s%60

return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")

}

socket.on("presence",data=>{

const user=data.discord_user

document.getElementById("avatar").src=
"https://cdn.discordapp.com/avatars/"+user.id+"/"+user.avatar+".png"

document.getElementById("name").innerText=
user.global_name || user.username

const activities=document.getElementById("activities")

activities.innerHTML=""

if(data.spotify){

const s=data.spotify

let html=\`

<div class="activity">

<img src="\${s.album_art_url}" class="cover">

<div style="width:100%">

<div class="song">\${s.song}</div>

<div class="artist">\${s.artist}</div>

<div class="wave"><div></div><div></div><div></div><div></div></div>

<div class="timeRow">

<div>\${format(Date.now()-s.timestamps.start)}</div>

<div>\${format(s.timestamps.end-s.timestamps.start)}</div>

</div>

<div class="progress">

<div class="bar" id="spotifyBar"></div>

</div>

</div>

</div>

\`

activities.innerHTML+=html

}

data.activities.forEach(a=>{

if(a.type!==0)return

let icon="🎮"

if(a.name.toLowerCase().includes("steam")) icon='<i class="fa-brands fa-steam"></i>'
if(a.name.toLowerCase().includes("xbox")) icon='<i class="fa-brands fa-xbox"></i>'
if(a.name.toLowerCase().includes("playstation")) icon='<i class="fa-brands fa-playstation"></i>'

activities.innerHTML+=\`

<div class="activity">

<div class="cover">\${icon}</div>

<div>

<div class="song">\${a.name}</div>

<div class="artist">\${a.details||""}</div>

</div>

</div>

\`

})

})

</script>

</body>

</html>

`)

})

server.listen(3000)
