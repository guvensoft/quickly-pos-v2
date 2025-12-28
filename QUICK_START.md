# 🚀 AI Live Log Bridge - Quick Start

## ✅ Kurulum Tamamlandı!

Quickly POS projeniz AI Live Log Bridge ile tamamen entegre edildi. 

## 30 Saniye Başlangıç Rehberi

### 1️⃣ Terminal Komutlarını Wrapper ile Çalıştır

```bash
# Geçerli değil:
npm test

# ✅ Doğru - loglar AI'ya görünür:
ai npm test
ai npm start
ai npm run build
```

### 2️⃣ Browser Monitoring Otomatik

Quickly POS'u `localhost`'ta açtığında:
- Console logs otomatik capture edilir
- Network requests monitore edilir
- Errors ve stack traces kaydedilir

**Devtools (F12) açmanıza gerek yok!**

### 3️⃣ AI'ye Sorun

```
You: "Npm test neler başarısız?"

AI: [Calls view_logs]
AI: "3 test başarısız:
1. UserComponent - null reference error
2. LoginService - 401 auth error  
3. Database connection timeout
   
İşte fixler..."
```

## Sık Kullanılan Komutlar

```bash
# Terminal logları gör
ai view_logs

# Sadece hatalar
ai get_crash_context

# Browser console ve network
ai view_browser_logs

# Sadece browser hataları
ai get_browser_errors

# Son 200 satır
ai --last 200

# Live watch mode
ai live

# Auto fix (hataları tespit et ve çözümle)
ai auto_fix_errors
```

## Quickly POS Dev Workflow

```bash
# Terminal 1
ai npm run electron:serve-tsc

# Terminal 2  
ai npm run ng:serve

# Terminal 3
ai npm test

# VS Code'da Cursor/Cline'a sorun:
# "What's broken?"
# "Auto fix the errors"
# "Browser loglarında ne var?"
```

## Pro Tips

✅ **Terminal tamamen görsün** - Her komut önüne `ai` koy
✅ **Auto-fix** - `ai auto_fix_errors` tüm hataları bulup çözer
✅ **Parallel çalışma** - Birden fazla `ai` komutu paralel çalışabilir
✅ **Secrets güvenli** - API keys otomatik `[REDACTED]` olur
✅ **Project-based** - Sadece Quickly POS loglarını görür

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ai: command not found` | `hash -r` (terminal cache temizle) |
| Browser logs görünmüyor | `http://localhost:port` kullandığından emin ol |
| MCP tools görmüyorum | AI tool'unu kapat ve yeniden başlat |
| Hala çalışmıyor | `ls ~/.mcp-logs/` kontrol et |

## Dosyalar

- 📄 `AI_LIVE_LOG_BRIDGE_SETUP.md` - Detaylı setup rehberi
- 📄 `.cursorrules` - Cursor IDE kuralları (auto-load edilir)
- 📄 `.vscode/settings.json` - VS Code MCP config
- 📄 `QUICK_START.md` - Bu dosya

## Sonraki Adımlar

1. ✅ Kuruluş tamamlandı
2. 📖 `AI_LIVE_LOG_BRIDGE_SETUP.md` oku
3. 🧪 `ai npm test` ile test et
4. 🎯 Cursor/Cline'da sorun sor: "Browser'da ne var?"

---

**Hep hazırım!** AI'ye şu sorular sorabilirsin:

- "Npm test sonuçları neler?"
- "Browser console'da hatalar var mı?"
- "Network requests neler?"
- "Tüm hataları auto-fix et"
- "Build neden başarısız?"

**Zero copy-paste debugging. Pure visibility. 🎉**
