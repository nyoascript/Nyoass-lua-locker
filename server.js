const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // оригинал + обфусцированный

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// =======================================
//   STRONG OBFUSCATION (усиленная)
// =======================================
function strongObf(src) {
    function r(l){
        const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
        let s=""; for(let i=0;i<l;i++) s+=c[Math.floor(Math.random()*c.length)];
        return s;
    }

    function xor(str, key){
        let out = "";
        for(let i=0;i<str.length;i++){
            out += String.fromCharCode(str.charCodeAt(i) ^ key);
        }
        return out;
    }

    const KEY = Math.floor(Math.random()*200)+20;
    const encrypted = xor(src, KEY);

    const encHex = encrypted.split("").map(c => "\\x" + c.charCodeAt(0).toString(16).padStart(2,"0")).join("");

    const A = r(10);
    const B = r(12);
    const C = r(14);
    const R = r(10);

    return `
--[[ NyoaSS Strong Obfuscator v2 ]]--
local ${A}="${KEY}"
local function ${B}(s,k)
  local o=""
  for i=1,#s do
    o=o..string.char(string.byte(s,i) ~ k)
  end
  return o
end

local function ${C}()
  return "${encHex}"
end

local function ${R}(str)
  local out=""
  for hex in string.gmatch(str,"\\\\x(%x%x)") do
    out=out..string.char(tonumber(hex,16))
  end
  return out
end

loadstring(${B}(${R}(${C}()),${A}))()
`;
}

// =======================================
//   FRONT HTML
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
</style>
</head>
<body>

<div class="tabs">
  <div class="tab active" onclick="openTab('obf')">Obfuscator</div>
  <div class="tab" onclick="openTab('edit')">Edit</div>
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

  <button id="deobfBtn" style="display:none" onclick="deobf()">Deobfuscate</button>
  <button id="obfBtn" style="display:none" onclick="askObf()">Obfuscate</button>

  <button id="saveBtn" style="display:none" onclick="saveEdit()">Save</button>

  <div id="editStatus"></div>
</div>

<script>
function openTab(id){
  document.querySelectorAll(".card").forEach(x=>x.style.display="none");
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).style.display="block";
  event.target.classList.add("active");
}

// ===============================
// Generate
// ===============================
function gen(){
  const c = code.value;
  const p = password.value;

  if(!c || !p){ alert("Fill all fields"); return; }

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

// ===============================
// Load for edit
// ===============================
function loadEdit(){
  fetch("/get?id=" + eid.value + "&pass=" + epass.value)
  .then(r=>r.json())
  .then(d=>{
    if(!d.ok){ editStatus.innerText="Wrong ID or password"; return; }

    editBox.style.display="block";
    deobfBtn.style.display="block";
    obfBtn.style.display="block";
    saveBtn.style.display="block";

    editBox.value = d.original; // показываем оригинал
  });
}

// ===============================
// Deobfuscate
// ===============================
function deobf(){
  fetch("/deobf",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      code:editBox.value
    })
  })
  .then(r=>r.json())
  .then(d=>{
    if(d.ok){
      editBox.value = d.code;
    }
  });
}

// ===============================
// Ask which version to obfuscate
// ===============================
function askObf(){
  const choice = confirm("YES = обфусцировать РЕДАКТИРУЕМЫЙ код\nNO = обфусцировать ОРИГИНАЛ");
  if(choice){
    obfuscate("edit");
  } else {
    obfuscate("original");
  }
}

function obfuscate(type){
  fetch("/obf",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      id: eid.value,
      pass: epass.value,
      mode: type,
      edit: editBox.value
    })
  })
  .then(r=>r.json())
  .then(d=>{
    if(d.ok){
      editBox.value = d.original;
      alert("Obfuscated!");
    }
  });
}

// ===============================
// Save
// ===============================
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
    editStatus.innerText = d.ok ? "Saved!" : "Failed";
  });
}
</script>

</body>
</html>
`);
});

// =======================================
// SAVE
// =======================================
app.post("/save", (req,res) => {
  const { code, pass } = req.body;

  const id = Math.random().toString(36).substring(2,10);

  const obf = strongObf(code);

  codes[id] = {
    original: code,
    obf,
    pass
  };

  res.json({ id });
});

// =======================================
// GET FOR EDIT
// =======================================
app.get("/get", (req,res)=>{
  const { id, pass } = req.query;
  const item = codes[id];
  if(!item) return res.json({ ok:false });
  if(item.pass !== pass) return res.json({ ok:false });

  res.json({ ok:true, original: item.original, obf: item.obf });
});

// =======================================
// RAW
// =======================================
app.get("/raw/:id", (req,res) => {
  const item = codes[req.params.id];
  if (!item) return res.status(404).send("Not found");

  const ua = req.get("User-Agent") || "";

  if (!ua.includes("Roblox")) {
    return res.send("Password is required");
  }

  res.set("Content-Type","text/plain");
  res.send(item.obf);
});

// =======================================
// UPDATE
// =======================================
app.post("/update", (req,res)=>{
  const { id, pass, code } = req.body;

  const item = codes[id];
  if(!item) return res.json({ ok:false });
  if(item.pass !== pass) return res.json({ ok:false });

  item.original = code;
  item.obf = strongObf(code);

  res.json({ ok:true });
});

// =======================================
// DEOBF (выдаёт оригинал если в базе)
// =======================================
app.post("/deobf", (req,res)=>{
  const { code } = req.body;
  // НЕ пытаемся "взломать", просто возвращаем
  res.json({ ok:true, code });
});

// =======================================
// OBFUSCATE MODE
// =======================================
app.post("/obf", (req,res)=>{
  const { id, pass, mode, edit } = req.body;
  const item = codes[id];

  if(!item) return res.json({ ok:false });
  if(item.pass !== pass) return res.json({ ok:false });

  if(mode === "edit"){
    // обфусцировать редактируемый текст
    item.original = edit;
    item.obf = strongObf(edit);
  } else {
    // обфусцировать оригинал
    item.obf = strongObf(item.original);
  }

  res.json({ ok:true, original: item.original });
});

// =======================================
app.listen(PORT, () => console.log("NyoaSS Server Running", PORT));
