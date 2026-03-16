
const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// --- AYARLAR ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "Valeinsivaaa";
const REPO_NAME = "valeinsiva";
const FILE_PATH = "views.json";
const DISCORD_ID = "877946035408891945";

const BANNER_URL = "https://cdn.discordapp.com/attachments/938931634265280543/1476308554905555057/ce03e0dbed5f30cd6d5efb6d3c9aa441.png";

const BOT_PANEL_LINK = "https://valeinsiva-bot-web-panel.onrender.com";
const INSTAGRAM_LINK = "https://www.instagram.com/mami.el.chapo";
// ---------------

let stats = { views: 0, likes: 0 };
let cachedData = null;
let spotifyHistory = [];
let guestbook = [];

/* ---------------- GITHUB SYNC ---------------- */

async function syncWithGithub(isUpdate = false) {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    const headers = {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    };

    const getRes = await axios.get(url, { headers }).catch(() => null);

    if (!isUpdate && getRes) {
      stats = JSON.parse(Buffer.from(getRes.data.content, "base64").toString());
      return;
    }

    if (isUpdate) {
      const sha = getRes ? getRes.data.sha : null;

      const newContent = Buffer
        .from(JSON.stringify(stats, null, 2))
        .toString("base64");

      await axios.put(url,
        {
          message: "📊 Stats Update",
          content: newContent,
          sha
        },
        { headers }
      );
    }
  } catch (e) {
    console.log("github sync error");
  }
}

/* ---------------- DISCORD PRESENCE ---------------- */

setInterval(async () => {
  try {
    const r = await axios.get(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);

    cachedData = r.data.data;

    /* spotify history */
    if (cachedData.spotify) {

      const song = cachedData.spotify.song;

      if (!spotifyHistory.find(s => s.song === song)) {

        spotifyHistory.unshift({
          song: cachedData.spotify.song,
          artist: cachedData.spotify.artist,
          cover: cachedData.spotify.album_art_url
        });

        spotifyHistory = spotifyHistory.slice(0, 5);
      }
    }

    io.emit("presence", cachedData);

  } catch {}
}, 2000);

/* ---------------- API ---------------- */

app.get("/api/view", async (req, res) => {
  stats.views++;
  await syncWithGithub(true);
  res.json(stats);
});

app.get("/api/like", async (req, res) => {
  stats.likes++;
  await syncWithGithub(true);
  res.json(stats);
});

app.get("/api/spotify-history", (req, res) => {
  res.json(spotifyHistory);
});

app.get("/api/guestbook", (req, res) => {
  res.json(guestbook);
});

app.post("/api/guestbook", (req, res) => {

  const { name, message } = req.body;

  if (!name || !message) return res.json({ ok: false });

  guestbook.unshift({
    name,
    message
  });

  guestbook = guestbook.slice(0, 20);

  res.json({ ok: true });
});

/* ---------------- PAGE ---------------- */

app.get("/", (req, res) => {

res.send(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Valeinsiva</title>

<script src="/socket.io/socket.io.js"></script>

<style>

body{
background:#050505;
font-family:sans-serif;
color:white;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.card{
width:380px;
background:#111;
border-radius:30px;
overflow:hidden;
}

.banner{
height:150px;
background:url(${BANNER_URL});
background-size:cover;
}

.profile{
text-align:center;
padding:20px;
}

.avatar{
width:95px;
border-radius:50%;
}

.badges{
margin-top:10px;
font-size:20px;
}

.spotify-history{
margin-top:15px;
font-size:12px;
}

.guestbook{
margin-top:20px;
}

input,textarea{
width:100%;
margin-top:5px;
background:#222;
border:0;
color:white;
padding:6px;
border-radius:6px;
}

button{
margin-top:5px;
padding:6px;
width:100%;
background:#5865F2;
border:0;
color:white;
border-radius:6px;
}

</style>

</head>

<body>

<div class="card">

<div class="banner"></div>

<div class="profile">

<img id="avatar" class="avatar">

<h2>Valeinsiva</h2>

<div id="badges" class="badges"></div>

<div id="act"></div>

<div class="spotify-history">

<h4>Spotify History</h4>

<div id="history"></div>

</div>

<div class="guestbook">

<h4>Guestbook</h4>

<div id="messages"></div>

<input id="name" placeholder="name">

<textarea id="msg" placeholder="message"></textarea>

<button onclick="send()">Send</button>

</div>

</div>

</div>

<script>

const socket = io()

let current = null

socket.on("presence",data=>{

current=data

const u=data.discord_user

document.getElementById("avatar").src =
"https://cdn.discordapp.com/avatars/"+u.id+"/"+u.avatar+".png"

})

/* spotify history */

fetch("/api/spotify-history")
.then(r=>r.json())
.then(d=>{

let html=""

d.forEach(s=>{

html+=\`
<div style="display:flex;gap:8px;margin-bottom:6px">
<img src="\${s.cover}" width="28">
<div>
\${s.song}<br>
<span style="opacity:.6">\${s.artist}</span>
</div>
</div>
\`

})

document.getElementById("history").innerHTML=html

})

/* guestbook */

function loadGuest(){

fetch("/api/guestbook")
.then(r=>r.json())
.then(d=>{

let html=""

d.forEach(m=>{

html+=\`
<div style="margin-bottom:8px">
<b>\${m.name}</b><br>
<span style="opacity:.7">\${m.message}</span>
</div>
\`

})

document.getElementById("messages").innerHTML=html

})

}

loadGuest()

function send(){

fetch("/api/guestbook",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
name:document.getElementById("name").value,
message:document.getElementById("msg").value
})

}).then(()=>{

document.getElementById("msg").value=""

loadGuest()

})

}

</script>

</body>
</html>
`)

})

/* ---------------- START ---------------- */

server.listen(process.env.PORT || 3000)

