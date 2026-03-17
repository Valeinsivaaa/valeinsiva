const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- AYARLAR ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "Valeinsivaaa";
const REPO_NAME = "valeinsiva";
const FILE_PATH = "views.json";

const DISCORD_ID = "877946035408891945";

const BANNER_URL = "https://cdn.discordapp.com/attachments/938931634265280543/1476308554905555057/ce03e0dbed5f30cd6d5efb6d3c9aa441.png";

const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com";
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo";

// DB
let db = {
views:0,
likes:0,
messages:[],
lastSpotify:null,
lastGame:null
};

let cachedPresence = null;

// favicon fix
app.get('/favicon.ico', (req,res)=>res.status(204).end());


// --------------------
// GITHUB SYNC
// --------------------

async function syncWithGithub(update=false){
try{

const url=`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

const headers={
Authorization:`token ${GITHUB_TOKEN}`,
"Accept":"application/vnd.github.v3+json"
};

const res=await axios.get(url,{headers}).catch(()=>null);

if(!update && res){
db=JSON.parse(Buffer.from(res.data.content,'base64').toString());
return;
}

if(update){

const sha=res?res.data.sha:null;

const content=Buffer.from(JSON.stringify(db,null,2)).toString('base64');

await axios.put(url,{
message:"📊 Sync",
content,
sha
},{headers});

}

}catch(e){
console.log("Github Sync Error");
}
}

syncWithGithub();


// --------------------
// DISCORD PRESENCE
// --------------------

setInterval(async ()=>{

try{

const r=await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);

cachedPresence=r.data.data;

if(cachedPresence.spotify)
db.lastSpotify=cachedPresence.spotify;

const game=cachedPresence.activities.find(a=>a.type===0);
if(game) db.lastGame=game;

io.emit("presence",{
...cachedPresence,
lastSpotify:db.lastSpotify,
lastGame:db.lastGame
});

}catch(e){}

},2000);


// --------------------
// LIKE VIEW API
// --------------------

app.get("/api/like",async(req,res)=>{
db.likes++;
await syncWithGithub(true);
res.json({likes:db.likes});
});

app.get("/api/view",async(req,res)=>{
db.views++;
await syncWithGithub(true);
res.json({views:db.views});
});

app.get("/api/stats",(req,res)=>{
res.json({views:db.views,likes:db.likes});
});


// --------------------
// SOCKET MESSAGE
// --------------------

io.on("connection",socket=>{

socket.emit("init_messages",db.messages);

socket.on("send_msg",async data=>{

if(!data.user || !data.text) return;

db.messages.unshift({
user:data.user.substring(0,15),
text:data.text.substring(0,80),
time:Date.now()
});

db.messages=db.messages.slice(0,5);

io.emit("new_msg",db.messages);

await syncWithGithub(true);

});

});


// --------------------
// WEB PAGE
// --------------------

app.get("/",(req,res)=>{

res.send(`

<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Valeinsiva</title>

<script src="/socket.io/socket.io.js"></script>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<style>

body{
margin:0;
font-family:Arial;
background:#050505;
color:white;
display:flex;
justify-content:center;
align-items:center;
min-height:100vh;
flex-direction:column;
}

/* LOADER */

#loader{
position:fixed;
inset:0;
background:#050505;
display:flex;
align-items:center;
justify-content:center;
z-index:9999;
}

.spinner{
width:45px;
height:45px;
border:4px solid rgba(255,255,255,0.1);
border-top-color:#7289da;
border-radius:50%;
animation:spin 1s linear infinite;
}

@keyframes spin{
to{transform:rotate(360deg);}
}

.main-card{
width:380px;
background:#111;
border-radius:30px;
overflow:hidden;
}

.avatar{
width:100px;
border-radius:50%;
margin-top:-50px;
border:5px solid #111;
}

.msg-container{
width:380px;
background:#111;
border-radius:25px;
padding:20px;
margin-top:20px;
}

.msg-bubble{
background:#1a1a1a;
padding:10px;
border-radius:10px;
margin-bottom:10px;
}

input,textarea{
width:100%;
background:#1a1a1a;
border:none;
color:white;
padding:10px;
margin-top:8px;
border-radius:10px;
}

button{
width:100%;
padding:12px;
margin-top:10px;
background:#7289da;
border:none;
border-radius:10px;
color:white;
font-weight:bold;
}

</style>

</head>

<body>

<div id="loader">
<div class="spinner"></div>
</div>


<div class="main-card">

<img src="${BANNER_URL}" style="width:100%;height:150px;object-fit:cover">

<div style="text-align:center;padding:20px">

<img id="avatar" class="avatar">

<h2 id="name">Valeinsiva</h2>

<div id="act"></div>

<div style="margin-top:15px">

<a href="https://discord.com/users/${DISCORD_ID}">
<i class="fa-brands fa-discord"></i>
</a>

<a href="${INSTAGRAM_LINK}">
<i class="fa-brands fa-instagram"></i>
</a>

<a href="${BOT_PANEL_LINK}">
<i class="fa-solid fa-code"></i>
</a>

</div>

<div style="margin-top:10px;font-size:12px">

<i class="fa-solid fa-eye"></i>
<span id="view">0</span>

<i class="fa-solid fa-heart"></i>
<span id="like">0</span>

</div>

</div>

</div>


<div class="msg-container">

<h3>Anonymous Feed</h3>

<div id="msg-feed"></div>

<div id="msg-form">

<input id="user" placeholder="Adın">

<textarea id="text" placeholder="Mesaj"></textarea>

<button onclick="sendMsg()">Gönder</button>

</div>

</div>


<script>

const socket=io();

window.onload=()=>{

setTimeout(()=>{
document.getElementById("loader").style.display="none";
},1200);

fetch("/api/stats")
.then(r=>r.json())
.then(d=>{
document.getElementById("view").innerText=d.views;
document.getElementById("like").innerText=d.likes;
});

fetch("/api/view");

};


// PRESENCE

socket.on("presence",data=>{

const u=data.discord_user;

document.getElementById("avatar").src=
\`https://cdn.discordapp.com/avatars/\${u.id}/\${u.avatar}.png\`;

let html="";

if(data.spotify){

html+=\`
<div>
🎧 \${data.spotify.song}
<br>
\${data.spotify.artist}
</div>
\`;

}

const game=data.activities.find(a=>a.type===0);

if(game){

html+=\`
<div>
🎮 \${game.name}
</div>
\`;

}

document.getElementById("act").innerHTML=html;

});


// MESSAGE SYSTEM

function sendMsg(){

if(localStorage.getItem("msg_sent")) return;

const user=document.getElementById("user").value;
const text=document.getElementById("text").value;

if(!user||!text) return;

socket.emit("send_msg",{user,text});

localStorage.setItem("msg_sent","1");

document.getElementById("msg-form").innerHTML="Mesaj gönderildi";

}

socket.on("init_messages",renderMsgs);
socket.on("new_msg",renderMsgs);

function renderMsgs(list){

document.getElementById("msg-feed").innerHTML=list.map(x=>\`

<div class="msg-bubble">

<b>\${x.user}</b>

<br>

\${x.text}

</div>

\`).join("");

}

</script>

</body>
</html>

`);

});


server.listen(process.env.PORT || 3000);
