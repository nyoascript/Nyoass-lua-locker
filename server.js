const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // В памяти храним коды и пароль

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// --- Главная страница (frontend)
app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nyoass Lua Locker</title>
<style>
body { font-family: Arial; background:#0f0f0f; color:white; margin:0; padding:20px; }
.container { max-width:500px; margin:auto; padding:20px; }
.card { background:#1c1c1c; padding:20px; border-radius:16px; box-shadow:0 0 18px rgba(125,76,255,0.2); animation:fadeIn 0.4s ease; }
h2{text-align:center;}
textarea,input{width:100%;padding:12px;margin-top:12px;border:none;border-radius:10px;background:#262626;color:white;}
textarea{height:160px;resize:none;}
button{width:100%;padding:14px;margin-top:20px;background:linear-gradient(135deg,#7d4cff,#b983ff);border:none;border-radius:12px;color:white;font-size:16px;font-weight:bold;box-shadow:0 0 12px rgba(125,76,255,0.5);transition:.2s;}
button:active{transform:scale(0.97);opacity:.8;}
.link-box{margin-top:15px;word-break:break-all;background:#111;padding:14px;border-radius:10px;animation:fadeIn 0.4s ease;}
.hidden{display:none;}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
</style>
</head>
<body>
<div class="container">
  <div class="card" id="creator">
    <h2>🔒 Защитить Lua / Luau код</h2>
    <textarea id="code" placeholder="Вставьте ваш Lua / Luau код"></textarea>
    <input id="password" type="text" placeholder="Пароль">
    <button onclick="generate()">Создать ссылку</button>
    <div class="link-box hidden" id="resultBox">
      <b>Ссылка:</b><br>
      <span id="resultLink"></span>
    </div>
  </div>
</div>
<script>
function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;
  if(!code || !pass){ alert("Заполните всё!"); return; }
  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code, pass})
  })
  .then(r=>r.json())
  .then(data=>{
    const url = location.origin + "/raw/" + data.id;
    document.getElementById("resultBox").classList.remove("hidden");
    const linkEl = document.getElementById("resultLink");
    linkEl.innerText = url;
    linkEl.href = url;
  });
}
</script>
</body>
</html>`);
});

// --- API для сохранения кода
app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    const id = Math.random().toString(36).substring(2,10);
    codes[id] = { code, pass };
    res.json({ id });
});

// --- Страница RAW (Roblox или просмотр в браузере)
app.get("/raw/:id", (req, res) => {
    const { id } = req.params;
    const item = codes[id];
    if(!item) return res.status(404).send("Код не найден");

    const ua = req.get("User-Agent") || "";
    // Если заходят через браузер (не Roblox) → показываем пароль
    if(!ua.includes("Roblox")) {
        return res.send(`<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Введите пароль</title></head>
<body style="background:#0f0f0f;color:white;font-family:Arial;text-align:center;padding:50px;">
<h2>🔒 Введите пароль чтобы получить код</h2>
<form method="GET" action="/raw/${id}/check">
<input type="password" name="pass" placeholder="Пароль" style="padding:12px;border-radius:10px;border:none;margin-top:12px;"><br>
<button type="submit" style="margin-top:20px;padding:14px;background:#7d4cff;border:none;border-radius:12px;color:white;">Открыть код</button>
</form>
</body></html>`);
    }

    // Если запрос от Roblox → отдаем код напрямую
    res.set("Content-Type","text/plain");
    res.send(item.code);
});

// --- Проверка пароля при заходе через браузер
app.get("/raw/:id/check", (req,res) => {
    const { id } = req.params;
    const item = codes[id];
    if(!item) return res.status(404).send("Код не найден");

    const pass = req.query.pass || "";
    if(pass !== item.pass) return res.send("❌ Неверный пароль");

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

app.listen(PORT, () => console.log(`Server запущен на порту ${PORT}`));