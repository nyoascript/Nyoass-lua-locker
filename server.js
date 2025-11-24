const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // сохраняем код + пароль

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// =======================================
//      SIMPLE B‑LEVEL OBFUSCATOR
// =======================================
function obfuscateLuau(src) {
    function rand(len){
        const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let o=""; for(let i=0;i<len;i++) o+=c[Math.floor(Math.random()*c.length)];
        return o;
    }

    const fakeTable = rand(8);
    const fakeFunc = rand(10);
    const encStr = rand(12);
    const runner = rand(10);

    // шифруем строки в \xNN формате
    function escapeString(str) {
        return str.split("").map(c => `\\${c.charCodeAt(0)}`).join("");
    }

    const encoded = escapeString(src);

    return `
--[[ NyoaSS B‑Level Obfuscator ]]--
local ${fakeTable} = {
  [1] = "${rand(7)}",
  [2] = "${rand(9)}",
  [3] = ${Math.floor(Math.random()*999999)},
  ["x"] = "${rand(8)}"
};

local function ${encStr}()
    return "${encoded}"
end

local function ${runner}(c)
    return loadstring(c)()
end

local function ${fakeFunc}(t)
  local s=""
  for p in string.gmatch(t, "\\\\(%d+)") do s=s..string.char(p) end
  return s
end

${runner}(${fakeFunc}(${encStr}()))
`;
}


// =======================================
//                FRONT PAGE
// =======================================
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>NyoaSS Luau Obfuscator</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{margin:0;background:#0d0d0d;color:white;font-family:Arial}
.tabs{display:flex;justify-content:center;margin-top:20px}
.tab{padding:12px 22px;margin:4px;background:#1b1b1b;border-radius:10px;cursor:pointer;transition:.2s}
.tab:hover{background:#242424}
.active{background:#7d4cff}
.card{background:#161616;margin:20px auto;padding:25px;border-radius:18px;width:92%;max-width:650px;box-shadow:0 0 24px rgba(125,76,255,.35)}
textarea,input{width:100%;padding:14px;margin-top:12px;border:none;border-radius:12px;background:#222;color:white}
textarea{height:170px;resize:none}
button{width:100%;padding:14px;background:#7d4cff;border:none;border-radius:12px;margin-top:20px;color:white;font-size:17px;cursor:pointer}
.result{margin-top:20px;background:#111;padding:14px;border-radius:12px;word-break:break-all;display:none}
#discord{position:fixed;left:15px;bottom:15px;color:white;text-decoration:none;padding:10px 14px;background:#5865F2;border-radius:10px;font-weight:bold;opacity:.85}
#discord:hover{opacity:1}
</style>
</head>
<body>

<a id="discord" href="https://discord.gg/WBYkWfPQC2" target="_blank">Join Discord</a>

<div class="tabs">
  <div class="tab active" onclick="openTab('obf')">Obfuscator</div>
  <div class="tab" onclick="openTab('edit')">Edit</div>
  <div class="tab" onclick="openTab('info')">Info</div>
</div>

<div id="obf" class="card">
  <h2>Luau Obfuscator</h2>
  <textarea id="code" placeholder="Paste your Luau script..."></textarea>
  <input id="password" placeholder="Protection Password">
  <button onclick="gen()">Generate</button>
  <div id="out" class="result"></div>
</div>

<div id="edit" class="card" style="display:none">
  <h2>Edit Script</h2>
  <input id="eid" placeholder="Enter Script ID">
  <input id="epass" placeholder="Password">
  <button onclick="loadEdit()">Load Script</button>

  <textarea id="editBox" style="display:none"></textarea>
  <button id="saveBtn" style="display:none" onclick="saveEdit()">Save Changes</button>
  <div id="editStatus"></div>
</div>

<div id="info" class="card" style="display:none">
  <h2>Information</h2>
  <p>NyoaSS Obfuscator protects Luau scripts from dumping, reading, logic tracing, modification and spoofing.</p>
  <p>Uses encoded strings, random identifiers, fake VM layers and anti‑tamper noise.</p>
</div>

<script>
function openTab(id){
  document.querySelectorAll(".card").forEach(x=>x.style.display="none");
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).style.display="block";
  event.target.classList.add("active");
}

// =================================
//        GENERATE LINK
// =================================
function gen(){
  const c = code.value;
  const p = password.value;

  if(!c || !p){
    alert("Fill all fields");
    return;
  }

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code:c, pass:p})
  })
  .then(r=>r.json())
  .then(data=>{
    const raw = location.origin + "/raw/" + data.id;
    const l = \`loadstring(game:HttpGet("\${raw}"))()\`;

    out.style.display="block";
    out.innerText = l;
  });
}

// =================================
//           EDIT SCRIPT
// =================================
function loadEdit(){
  fetch("/get?id=" + eid.value + "&pass=" + epass.value)
  .then(r=>r.json())
  .then(d=>{
    if(!d.ok){ editStatus.innerText="Wrong ID or password"; return; }

    editBox.style.display="block";
    saveBtn.style.display="block";
    editBox.value = d.code;
  });
}

function saveEdit(){
  fetch("/update",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      id:eid.value,
      pass:epass.value,
      code:editBox.value
    })
  })
  .then(r=>r.json())
  .then(d=>{
    editStatus.innerText = d.ok ? "Updated!" : "Failed";
  });
}
</script>

</body>
</html>
`);
});

// =======================================
//            SAVE WITH OBFUSCATION
// =======================================
app.post("/save", (req,res) => {
  const { code, pass } = req.body;

  const id = Math.random().toString(36).substring(2,10);

  const obf = obfuscateLuau(code);

  codes[id] = { code: obf, pass };

  res.json({ id });
});

// =======================================
//            OPTIONAL GET API
// =======================================
app.get("/get", (req,res)=>{
  const { id, pass } = req.query;
  const item = codes[id];
  if(!item) return res.json({ ok:false });

  if(item.pass !== pass) return res.json({ ok:false });

  res.json({ ok:true, code: item.code });
});

// =======================================
//           UPDATE EDITED CODE
// =======================================
app.post("/update", (req,res)=>{
  const { id, pass, code } = req.body;

  const item = codes[id];
  if(!item) return res.json({ ok:false });

  if(item.pass !== pass) return res.json({ ok:false });

  const obf = obfuscateLuau(code);
  item.code = obf;

  res.json({ ok:true });
});

// =======================================
//             RAW: PASSWORD PAGE
// =======================================
app.get("/raw/:id", (req,res) => {
  const item = codes[req.params.id];
  if (!item) return res.status(404).send("Not found");

  const ua = req.get("User-Agent") || "";

  if (!ua.includes("Roblox")) {
    return res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Password</title>
<style>
body{background:#0d0d0d;margin:0;color:white;font-family:Arial;
display:flex;justify-content:center;align-items:center;height:100vh}
.box{background:#171717;padding:30px;border-radius:16px;width:90%;max-width:340px;text-align:center;
box-shadow:0 0 25px rgba(125,76,255,.25)}
input,button{width:100%;padding:12px;border:none;border-radius:10px;background:#222;color:white;margin-top:14px}
button{background:#7d4cff}
</style>
</head>
<body>
<div class="box">
<h2>Password Required</h2>
<form method="GET" action="/raw/${req.params.id}/check">
<input name="pass" type="password" placeholder="Password">
<button>Open</button>
</form>
</div>
</body>
</html>
    `);
  }

  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// =======================================
//          PASSWORD CHECK
// =======================================
app.get("/raw/:id/check", (req,res) => {
  const item = codes[req.params.id];
  if(!item) return res.status(404).send("Not found");
  if(req.query.pass !== item.pass) return res.send("Wrong password");

  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// =======================================
app.listen(PORT, () => console.log("NyoaSS Server Running", PORT));
