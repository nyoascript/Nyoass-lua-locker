const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ===== Главная страница =====
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NyoaSS Obfuscator</title>

<!-- Styles -->
<style>
body {
  margin:0; padding:0;
  background:#0e0e0e;
  font-family: Arial, sans-serif;
  color:white;
  animation: fadeIn .4s ease;
}
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

.nav {
  width:100%;
  background:#151515;
  padding:15px 0;
  display:flex;
  justify-content:center;
  position:sticky;
  top:0;
  box-shadow:0 0 12px rgba(0,0,0,.4);
  z-index:99;
}
.nav-item {
  margin:0 15px;
  cursor:pointer;
  font-size:18px;
  transition:.2s;
}
.nav-item:hover {
  color:#a974ff;
}

.container {
  max-width:650px;
  margin:40px auto;
  padding:20px;
}
.card {
  background:#1c1c1c;
  border-radius:18px;
  padding:25px;
  box-shadow:0 0 18px rgba(125,76,255,.25);
  animation: pop .25s ease;
}
@keyframes pop { from{transform:scale(.95);opacity:0;} to{transform:scale(1);opacity:1;} }

textarea, input {
  width:100%;
  padding:12px;
  margin-top:15px;
  border:none;
  border-radius:12px;
  background:#262626;
  color:white;
}
textarea { height:160px; resize:none; }
button {
  width:100%; padding:14px;
  margin-top:20px;
  border:none;
  border-radius:12px;
  font-size:17px;
  background:linear-gradient(135deg,#7d4cff,#b983ff);
  color:white;
  font-weight:bold;
  cursor:pointer;
  box-shadow:0 0 16px rgba(125,76,255,.4);
  transition:.15s;
}
button:active { transform:scale(.97); opacity:0.85; }

.link-box {
  margin-top:20px;
  background:#111;
  padding:15px;
  border-radius:12px;
  word-break:break-all;
}

.hidden { display:none; }

/* Tab pages */
.page { display:none; }
.page.active { display:block; }

.theme-switch { margin-top:20px; padding:12px; background:#222; border-radius:12px; cursor:pointer; }
</style>

</head>
<body>

<div class="nav">
  <div class="nav-item" onclick="openPage('home')">Home</div>
  <div class="nav-item" onclick="openPage('api')">API</div>
  <div class="nav-item" onclick="openPage('misc')">Misc</div>
</div>

<div class="container">

  <!-- Home -->
  <div class="page active" id="home">
    <div class="card">
      <h2 style="text-align:center;">NyoaSS Obfuscator</h2>
      <textarea id="code" placeholder="Paste your Lua / Luau code"></textarea>
      <input id="password" type="text" placeholder="Password">

      <button onclick="generate()">Create Link</button>

      <div id="resultBox" class="link-box hidden">
        <b>Your Loadstring:</b><br><br>
        <span id="resultLink"></span>
      </div>
    </div>
  </div>

  <!-- API -->
  <div class="page" id="api">
    <div class="card">
      <h2 style="text-align:center;">API</h2>
      <p>Your Roblox executor can fetch raw code directly:</p>
      <div class="link-box">
        GET → /raw/:id  
      </div>
    </div>
  </div>

  <!-- Misc -->
  <div class="page" id="misc">
    <div class="card">
      <h2 style="text-align:center;">Misc</h2>

      <div class="theme-switch" onclick="toggleTheme()">
        Toggle Theme (Dark / Light)
      </div>

      <div class="theme-switch" onclick="copyDiscord()">
        Copy Discord: nyoa.lua
      </div>
    </div>
  </div>

</div>

<script>
// tabs
function openPage(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// create loadstring
function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;
  if(!code || !pass){ alert("Fill all fields"); return; }

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code, pass})
  })
  .then(r=>r.json())
  .then(data=>{
    const raw = location.origin + "/raw/" + data.id;
    const result = 'loadstring(game:HttpGet("' + raw + '"))()';

    document.getElementById("resultBox").classList.remove("hidden");
    document.getElementById("resultLink").innerText = result;
  });
}

// theme toggle
function toggleTheme(){
  if(document.body.style.background === "white"){
    document.body.style.background="#0e0e0e";
    document.body.style.color="white";
  } else {
    document.body.style.background="white";
    document.body.style.color="black";
  }
}
function copyDiscord(){
  navigator.clipboard.writeText("nyoa.lua");
  alert("Copied!");
}
</script>

</body></html>
`);
});

// ==== Save code ====
app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    const id = Math.random().toString(36).substr(2, 10);
    codes[id] = { code, pass };
    res.json({ id });
});

// ==== RAW output ====
app.get("/raw/:id", (req, res) => {
    const { id } = req.params;
    const item = codes[id];
    if (!item) return res.status(404).send("Not found");

    const ua = req.get("User-Agent") || "";

    if (!ua.includes("Roblox")) {
        return res.send(`
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Password</title>
<style>
body{background:#0f0f0f;color:white;font-family:Arial;padding:50px;text-align:center;}
input{padding:12px;border:none;border-radius:12px;width:250px;background:#1c1c1c;color:white;}
button{margin-top:20px;padding:12px 22px;background:#7d4cff;border:none;border-radius:12px;color:white;font-size:16px;}
.card{background:#151515;padding:30px;border-radius:16px;display:inline-block;animation:fade .3s;}
@keyframes fade{from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);}}
</style>
</head>
<body>
<div class="card">
<h2>Enter Password</h2>
<form method="GET" action="/raw/${id}/check">
<input type="password" name="pass" placeholder="Password"><br>
<button>Open</button>
</form>
</div>
</body></html>`);
    }

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

// ==== Password check ====
app.get("/raw/:id/check", (req,res) => {
    const { id } = req.params;
    const item = codes[id];
    if(!item) return res.status(404).send("Not found");

    if((req.query.pass || "") !== item.pass)
        return res.send("Wrong password");

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

app.listen(PORT, () => console.log("Server running on port", PORT));
