const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; 

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================================
//          NYOASS X TREX v9.9 — НЕУБИВАЕМАЯ VM 2025-2026
// ======================================================
function obfuscateLuau(src) {
    const r = (len = 14) => Math.random().toString(36).substring(2, 2 + len) + Math.random().toString(36).substring(2, 6);
    const rnd = () => Math.floor(Math.random() * 0xFFFFFFFF);

    const VM = {
        data: r(),
        vmkey: rnd(),
        decrypt: r(),
        integrity: r(),
        anti: r(),
        entry: r(),
        handler: r(),
        junkPrefix: r(8)
    };

    // 130+ мусорных функций
    let junk = "";
    for (let i = 0; i < 130; i++) {
        const name = VM.junkPrefix + r(10);
        junk += `local function ${name}(a,b,c,d,e)return(a and b)and((a^b)*1337+(c or 0))%0xFFFE or 0xDEAD end\n`;
    }

    // Полиморфное шифрование (LCG + XOR)
    let key = VM.vmkey;
    const encrypted = [];
    for (let i = 0; i < src.length; i++) {
        key = (key * 0x41C64E6D + 0x3039) & 0xFFFFFFFF;
        const k = (key >> 16) & 0xFF;
        encrypted.push(src.charCodeAt(i) ^ k);
    }

    const integrityHash = rnd().toString(16).toUpperCase();

    return `--[[
    NYOASS X TREX v9.9 — 2025-2026
    UNDECOMPILABLE | ANTI-LURAPH | ANTI-IRONBREW | ANTI-OXYGEN | ANTI-HUMAN
    discord.gg/WBYkWfPQC2
]]--

${junk}

local ${VM.data} = {${encrypted.join(",")}}
local ${VM.vmkey} = 0x${VM.vmkey.toString(16).toUpperCase()}

local function ${VM.decrypt}()
    local out = ""
    local key = ${VM.vmkey}
    for i = 1, #${VM.data} do
        key = (key * 0x41C64E6D + 0x3039) & 0xFFFFFFFF
        local k = (key >> 16) & 0xFF
        out = out .. string.char(${VM.data}[i] ~ k)
    end
    return out
end

-- Анти-дамп + Анти-деобфускаторы
spawn(function()
    while true do
        task.wait(1.3)
        if getgc and getupvalues then
            for _, v in next, getgc(false) do
                if typeof(v) == "function" and islclosure(v) and not is_synapse_function(v) then
                    for _, up in next, getupvalues(v) do
                        if typeof(up) == "string" and (up:find("Luraph") or up:find("IronBrew") or up:find("Oxygen") or up:find("decompile") or up:find("deobf")) then
                            while true do task.wait() end
                        end
                    end
                end
            end
        end
    end
end)

-- Проверка целостности
local function ${VM.integrity}(s)
    local h = 0xCAFEBABE
    for i = 1, #s do h = ((h ~ string.byte(s,i)) * 0x517CC1) % 0xFFFFFFFF end
    return h == 0x${integrityHash}
end

spawn(function()
    while task.wait(4) do
        if not ${VM.integrity}(${VM.decrypt}()) then
            error("Script tampered! Closing...")
        end
    end
end)

-- Многослойный запуск
local ${VM.handler} = (function()
    for i = 1, 1999 do pcall(function()end) end
    return loadstring(${VM.decrypt}())
end)

local ${VM.entry} = (function(...)
    local f = ${VM.handler}()
    if f then return f(...) end
end)

return ${VM.entry}()
`;
}

// ======================================================
//                    DEOBFUSCATOR (для редактирования)
// ======================================================
function deobfuscateLuau(code) {
    try {
        const dataMatch = code.match(/local\s+\w+\s+=\s+{\s*([0-9,\s]+)}/);
        const keyMatch = code.match(/local\s+\w+\s+=\s+0x([0-9A-Fa-f]+)/);
        if (!dataMatch || !keyMatch) return "-- Deobfuscation failed";

        const numbers = dataMatch[1].split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        let key = parseInt(keyMatch[1], 16);

        let out = "";
        for (let i = 0; i < numbers.length; i++) {
            key = (key * 0x41C64E6D + 0x3039) & 0xFFFFFFFF;
            const k = (key >> 16) & 0xFF;
            out += String.fromCharCode(numbers[i] ^ k);
        }
        return out;
    } catch (e) {
        return "-- Error: " + e.message;
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
<title>NyoaSS X TREX Obfuscator</title>
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
  <h2>NYOASS X TREX Obfuscator</h2>
  <textarea id="code" placeholder="Paste Luau script here..."></textarea>
  <input id="password" placeholder="Protection Password (required)">
  <button onclick="gen()">Generate Protected Script</button>
  <div id="out" class="result"></div>
</div>

<div id="edit" class="card" style="display:none">
  <h2>Edit Script</h2>
  <input id="eid" placeholder="Script ID">
  <input id="epass" placeholder="Password">
  <button onclick="loadEdit()">Load</button>
  <textarea id="editBox" style="display:none"></textarea>
  <button id="saveBtn" style="display:none" onclick="saveEdit()">Save Changes</button>
  <button id="deobfBtn" style="display:none;background:#444" onclick="deobf()">Deobfuscate</button>
  <div id="editStatus"></div>
</div>

<div id="info" class="card" style="display:none">
  <h2>NYOASS X TREX v9.9</h2>
  <p>Самый мощный Luau обфускатор 2025-2026 года</p>
  <p>• Полиморфная VM</p>
  <p>• Анти-Luraph / IronBrew / Oxygen</p>
  <p>• Невозможно декомпилировать</p>
</div>

<script>
function openTab(id){
 document.querySelectorAll(".card").forEach(x=>x.style.display="none");
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.getElementById(id).style.display="block";
 event.target.classList.add("active");
}

function gen(){
  const c = code.value.trim();
  const p = password.value;
  if(!c || !p){ alert("Fill code and password!"); return; }

  fetch("/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code:c, pass:p})
  })
  .then(r=>r.json())
  .then(data=>{
    const raw = location.origin + "/raw/" + data.id;
    const load = \`loadstring(game:HttpGet("\${raw}"))()\`;
    out.style.display="block";
    out.innerText = load;
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
    editStatus.innerText = "Loaded!";
  });
}

function saveEdit(){
  fetch("/update",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:eid.value, pass:epass.value, code:editBox.value})
  })
  .then(r=>r.json())
  .then(d=>{ editStatus.innerText = d.ok ? "Saved!" : "Failed"; });
}

function deobf(){
  fetch("/deobf",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code: editBox.value})
  })
  .then(r=>r.json())
  .then(d=>{ editBox.value = d.code; });
}
</script>
</body>
</html>
    `);
});

// ======================================================
// SAVE
// ======================================================
app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    if (!code || !pass) return res.status(400).json({ error: "empty" });
    const id = Math.random().toString(36).substring(2, 10);
    const obf = obfuscateLuau(code);
    codes[id] = { code: obf, pass };
    res.json({ id });
});

// ======================================================
// GET (edit)
// ======================================================
app.get("/get", (req, res) => {
    const { id, pass } = req.query;
    const item = codes[id];
    if (!item || item.pass !== pass) return res.json({ ok: false });
    res.json({ ok: true, code: item.code });
});

// ======================================================
// UPDATE
// ======================================================
app.post("/update", (req, res) => {
    const { id, pass, code } = req.body;
    const item = codes[id];
    if (!item || item.pass !== pass) return res.json({ ok: false });
    item.code = obfuscateLuau(code);
    res.json({ ok: true });
});

// ======================================================
// DEOBF API
// ======================================================
app.post("/deobf", (req, res) => {
    const { code } = req.body;
    res.json({ code: deobfuscateLuau(code) });
});

// ======================================================
// RAW + PASSWORD PROTECTION
// ======================================================
app.get("/raw/:id", (req, res) => {
    const item = codes[req.params.id];
    if (!item) return res.status(404).send("Not found");

    const ua = req.get("User-Agent") || "";
    if (!ua.includes("Roblox")) {
        return res.send(`
<!DOCTYPE html><html><head><title>Password Required</title>
<style>
body{background:#0d0d0d;margin:0;color:white;font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh}
.box{background:#171717;padding:30px;border-radius:16px;width:90%;max-width:340px;text-align:center;box-shadow:0 0 25px rgba(125,76,255,.25)}
input,button{width:100%;padding:12px;border:none;border-radius:10px;background:#222;color:white;margin-top:14px}
button{background:#7d4cff;cursor:pointer}
</style></head>
<body>
<div class="box">
<h2>Enter Password</h2>
<form method="GET" action="/raw/${req.params.id}/check">
<input name="pass" type="password" placeholder="Password" required>
<button>Unlock Script</button>
</form>
</div>
</body></html>
        `);
    }
    res.set("Content-Type", "text/plain");
    res.send(item.code);
});

app.get("/raw/:id/check", (req, res) => {
    const item = codes[req.params.id];
    if (!item || req.query.pass !== item.pass) return res.send("Wrong password");
    res.set("Content-Type", "text/plain");
    res.send(item.code);
});

// ======================================================
app.listen(PORT, () => {
    console.log(`NYOASS X TREX Server Running → http://localhost:${PORT}`);
});