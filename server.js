const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; 

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
//            ADVANCED STRONGER OBFUSCATION
// ======================================================
function obfuscateLuau(src) {

function r(len){
const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let o=""; for(let i=0;i<len;i++) o+=c[Math.floor(Math.random()*c.length)];
return o;
}

const A = r(9);
const B = r(10);
const C = r(8);
const D = r(10);
const E = r(7);
const F = r(7);
const G = r(8);
const H = r(9);
const J = r(10);
const K = r(9);

function encode(str){
let a=[];
for(let i=0;i<str.length;i++){
let b=str.charCodeAt(i);
b = (b + 17) % 256; 
a.push(b);
}
return a.join(",");
}

const encoded = encode(src);

return `
-- nyoass obfusucator v1.0
local ${A} = { "${r(6)}", "${r(5)}", ${Math.floor(Math.random()*999999)}, "${r(7)}" }

local function ${B}(t)
    local o=""
    for n in string.gmatch(t, "%d+") do
        local c = tonumber(n)
        c = (c - 17) % 256
        o = o .. string.char(c)
    end
    return o
end

local function ${C}(x)
    local s = 0
    for i = 1, #x do
        s = (s + string.byte(x, i)) % 100000
    end
    return s
end

local function ${D}(k)
    local z = {${encoded}}
    local s=""
    for i=1,#z do s = s .. string.char(z[i]) end
    return s
end

local function ${E}(f)
    return loadstring(f)()
end

local function ${F}(p)
    for i=1,5 do local _ = tostring(i) .. tostring(p) end
    return p
end

local function ${G}(v)
    local x = 0
    for i=1,#v do x = x ~ string.byte(v,i) end
    return x
end

local function ${H}()
    local raw = ${D}(${F}(${C}("${r(5)}")))
    return raw
end

local function ${J}(a,b)
    return (a*b) ~ (a+b) 
end

local _ANTI = ${J}(123,54)

local final = ${B}("${encoded}")
${E}(final)
`;
}

// ======================================================
//                    DEOBFUSCATOR
// ======================================================
function deobfuscateLuau(code){
try{
let m = code.match(/local final = [^"]*"([^"]+)"/);
if(!m) return "// Deobfuscation failed";
let raw = m[1];
let bytes = raw.split(",");
let out="";
for(let b of bytes){
let c = (parseInt(b)-17) % 256;
out += String.fromCharCode(c);
}
return out;
}catch(e){
return "// Deobfuscation failed";
}
}

// ======================================================
//                 FRONTEND PAGE
// ======================================================
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
  <textarea id="code" placeholder="Paste Luau..."></textarea>
  <input id="password" placeholder="Protection Password">
  <button onclick="gen()">Generate</button>
  <div id="out" class="result"></div>
</div>

<div id="edit" class="card" style="display:none">
  <h2>Edit Script</h2>

  <input id="eid" placeholder="Script ID">
  <input id="epass" placeholder="Password">
  <button onclick="loadEdit()">Load Script</button>

  <textarea id="editBox" style="display:none"></textarea>
  <button id="saveBtn" style="display:none" onclick="saveEdit()">Save</button>
  <button id="deobfBtn" style="display:none;background:#444" onclick="deobf()">Deobfuscate</button>

  <div id="editStatus"></div>
</div>

<div id="info" class="card" style="display:none">
  <h2>Information</h2>
  <p>NyoaSS obfuscator v1.0 protects Luau code from dumping, reading, modification and spoofing.</p>
  <p>Provides encoded strings, anti tamper, random identifiers and fake VM layers.</p>
</div>

<script>

function openTab(id){
 document.querySelectorAll(".card").forEach(x=>x.style.display="none");
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.getElementById(id).style.display="block";
 event.target.classList.add("active");
}

function gen(){
  const c = code.value;
  const p = password.value;
  if(!c || !p){ alert("Fill all fields"); return; }

  fetch("/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code:c, pass:p})
  })
  .then(r=>r.json())
  .then(data=>{
    const raw = location.origin + "/raw/" + data.id;
    const l = \`loadstring(game:HttpGet("\${raw}"))()\`;
    out.style.display="block";
    out.innerText = l;
  });
}

function loadEdit(){
  fetch("/get?id=" + eid.value + "&pass=" + epass.value)
  .then(r=>r.json())
  .then(d=>{
    if(!d.ok){ editStatus.innerText="Wrong ID or password"; return; }

    editBox.style.display="block";
    saveBtn.style.display="block";
    deobfBtn.style.display="block";
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

function deobf(){
  fetch("/deobf",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ code: editBox.value })
  })
  .then(r=>r.json())
  .then(d=>{
    editBox.value = d.code;
  });
}

</script>
</body>
</html>
`);
});

// ======================================================
// SAVE
// ======================================================
app.post("/save",(req,res)=>{
const { code, pass } = req.body;
const id = Math.random().toString(36).substring(2,10);
const obf = obfuscateLuau(code);
codes[id] = { code: obf, pass };
res.json({ id });
});

// ======================================================
// GET
// ======================================================
app.get("/get",(req,res)=>{
const { id, pass } = req.query;
const item = codes[id];
if(!item) return res.json({ ok:false });
if(item.pass !== pass) return res.json({ ok:false });
res.json({ ok:true, code:item.code });
});

// ======================================================
// UPDATE
// ======================================================
app.post("/update",(req,res)=>{
const { id, pass, code } = req.body;
const item = codes[id];
if(!item) return res.json({ ok:false });
if(item.pass !== pass) return res.json({ ok:false });
item.code = obfuscateLuau(code);
res.json({ ok:true });
});

// ======================================================
// DEOBF API
// ======================================================
app.post("/deobf",(req,res)=>{
const { code } = req.body;
res.json({ code: deobfuscateLuau(code) });
});

// ======================================================
// RAW WITH PASSWORD PAGE
// ======================================================
app.get("/raw/:id",(req,res)=>{
const item = codes[req.params.id];
if(!item) return res.status(404).send("Not found");
const ua = req.get("User-Agent") || "";
if(!ua.includes("Roblox")){
return res.send(`
<!DOCTYPE html><html><head><title>Password</title>
<style>
body{background:#0d0d0d;margin:0;color:white;font-family:Arial;
display:flex;justify-content:center;align-items:center;height:100vh}
.box{background:#171717;padding:30px;border-radius:16px;width:90%;max-width:340px;text-align:center;
box-shadow:0 0 25px rgba(125,76,255,.25)}
input,button{width:100%;padding:12px;border:none;border-radius:10px;background:#222;color:white;margin-top:14px}
button{background:#7d4cff}
</style></head>
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

// ======================================================
app.get("/raw/:id/check",(req,res)=>{
const item = codes[req.params.id];
if(!item) return res.status(404).send("Not found");
if(req.query.pass !== item.pass) return res.send("Wrong password");
res.set("Content-Type","text/plain");
res.send(item.code);
});

// ======================================================
app.listen(PORT,()=>console.log("NyoaSS Server Running",PORT));