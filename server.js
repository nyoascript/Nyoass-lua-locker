const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // database memory

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ===================== MAIN SITE =====================
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NyoaSS Luau Obfuscator</title>

<style>
body {
  margin:0; padding:0;
  background:#0d0d0d;
  color:white;
  font-family: Arial, sans-serif;
  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  animation: fadeIn .35s ease;
}
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

.top-menu {
  position:fixed;
  top:12px;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  gap:20px;
}

.tab {
  padding:10px 20px;
  background:#191919;
  border-radius:12px;
  cursor:pointer;
  box-shadow:0 0 10px rgba(125,76,255,.3);
  transition:.2s;
}
.tab:hover { opacity:.85; }

.discord-btn {
  position:fixed;
  top:22px;
  right:22px;
  padding:12px 20px;
  background:#5865f2;
  border-radius:12px;
  color:white;
  font-weight:bold;
  cursor:pointer;
  transition:.2s;
}
.discord-btn:hover {
  transform:scale(1.05);
}

.card {
  background:#161616;
  padding:35px;
  width:92%;
  max-width:600px;
  border-radius:20px;
  box-shadow:0 0 30px rgba(125,76,255,.3);
  animation: pop .3s ease;
}
@keyframes pop { from{transform:scale(.95);} to{transform:scale(1);} }

h1 {
  text-align:center;
  margin:0;
  font-size:28px;
  margin-bottom:10px;
}

.desc {
  text-align:center;
  font-size:14px;
  margin-bottom:25px;
  color:#bdbdbd;
  line-height:1.4;
}

textarea, input {
  width:100%;
  padding:14px;
  border:none;
  border-radius:12px;
  margin-top:14px;
  background:#222;
  color:white;
}
textarea { height:170px; resize:none; }

button {
  width:100%;
  padding:15px;
  margin-top:20px;
  background:#7d4cff;
  border:none;
  border-radius:14px;
  color:white;
  font-size:17px;
  box-shadow:0 0 14px rgba(125,76,255,.5);
  transition:.2s;
  cursor:pointer;
}
button:hover { opacity:.9; }
button:active { transform:scale(.97); }

.result-box {
  margin-top:25px;
  padding:15px;
  background:#111;
  border-radius:12px;
  word-break:break-all;
  display:none;
}

.small-title {
  font-size:15px;
  color:#c9c9c9;
  margin-bottom:8px;
  font-weight:bold;
}

.hidden { display:none; }
</style>

</head>
<body>

<div class="top-menu">
  <div class="tab" onclick="openTab('obf')">Obfuscator</div>
  <div class="tab" onclick="openTab('info')">Information</div>
  <div class="tab" onclick="openTab('edit')">Edit</div>
</div>

<a href="https://discord.gg/WBYkWfPQC2" target="_blank">
  <div class="discord-btn">Join Discord</div>
</a>

<div class="card">

  <!-- === TAB 1 OBFUSCATOR === -->
  <div id="obfTab">
    <h1>NyoaSS Luau Obfuscator</h1>
    <div class="desc">
      Protects Luau scripts from stealing and reverse engineering.
    </div>

    <textarea id="code" placeholder="Paste your Luau script..."></textarea>
    <input id="password" type="text" placeholder="Protection Password">

    <button onclick="generate()">Generate Loadstring</button>

    <div id="resultBox" class="result-box">
      <div class="small-title">Your Loadstring:</div>
      <span id="output"></span>
    </div>
  </div>

  <!-- === TAB 2 INFO === -->
  <div id="infoTab" class="hidden">
    <h1>Information</h1>
    <div class="desc">
      • Secure Luau obfuscation<br>
      • Password‑Protected Loader<br>
      • Cloud Storage System<br><br>
      Made by NyoaSS Team.
    </div>
  </div>

  <!-- === TAB 3 EDIT === -->
  <div id="editTab" class="hidden">
    <h1>Edit Script</h1>
    <input id="edit_id" type="text" placeholder="Script ID">
    <input id="edit_pass" type="password" placeholder="Password">
    <button onclick="loadForEdit()">Load Script</button>

    <textarea id="edit_area" class="hidden"></textarea>
    <button id="save_btn" class="hidden" onclick="saveEdited()">Save</button>

    <div id="editStatus" class="desc"></div>
  </div>

</div>

<script>
function openTab(name){
  document.getElementById("obfTab").classList.add("hidden");
  document.getElementById("infoTab").classList.add("hidden");
  document.getElementById("editTab").classList.add("hidden");
  document.getElementById(name+"Tab").classList.remove("hidden");
}

function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;
  if(!code || !pass) return alert("Fill all fields.");

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ code, pass })
  })
  .then(r=>r.json())
  .then(data=>{
    const rawURL = location.origin + "/raw/" + data.id;
    const load = \`loadstring(game:HttpGet("\${rawURL}"))()\`;

    document.getElementById("output").innerText = load;
    document.getElementById("resultBox").style.display = "block";
  });
}

// LOAD FOR EDIT
function loadForEdit(){
  const id = document.getElementById("edit_id").value;
  const pass = document.getElementById("edit_pass").value;

  fetch("/edit/load?id="+id+"&pass="+pass)
    .then(r=>r.text())
    .then(t=>{
      if(t.startsWith("ERR")) {
        document.getElementById("editStatus").innerText = t;
        return;
      }
      document.getElementById("edit_area").classList.remove("hidden");
      document.getElementById("save_btn").classList.remove("hidden");
      document.getElementById("edit_area").value = t;
      document.getElementById("editStatus").innerText = "Loaded.";
    });
}

// SAVE NEW
function saveEdited(){
  const id = document.getElementById("edit_id").value;
  const pass = document.getElementById("edit_pass").value;
  const code = document.getElementById("edit_area").value;

  fetch("/edit/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ id, pass, code })
  })
  .then(r=>r.text())
  .then(t=>{
    document.getElementById("editStatus").innerText = t;
  });
}
</script>

</body>
</html>
`);
});

// ===================== SAVE =====================
app.post("/save", (req,res) => {
  const { code, pass } = req.body;
  const id = Math.random().toString(36).substring(2,10);
  codes[id] = { code, pass };
  res.json({ id });
});

// ===================== RAW =====================
app.get("/raw/:id", (req,res) => {
  const item = codes[req.params.id];
  if (!item) return res.status(404).send("Not found");

  const ua = req.get("User-Agent") || "";

  if (!ua.includes("Roblox")) {
    return res.send("Password required (Roblox only)");
  }

  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// ===================== EDIT LOAD =====================
app.get("/edit/load", (req,res) => {
  const { id, pass } = req.query;
  const item = codes[id];
  if(!item) return res.send("ERR: Not found");
  if(item.pass !== pass) return res.send("ERR: Wrong password");
  res.send(item.code);
});

// ===================== EDIT SAVE =====================
app.post("/edit/save", (req,res) => {
  const { id, pass, code } = req.body;
  const item = codes[id];
  if(!item) return res.send("ERR: Not found");
  if(item.pass !== pass) return res.send("ERR: Wrong password");
  item.code = code;
  res.send("Saved successfully.");
});

// ===================== START =====================
app.listen(PORT, () => console.log("Server running on port", PORT));
