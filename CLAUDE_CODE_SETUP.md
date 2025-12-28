# 🔌 Claude Code MCP Kurulumu

## ✅ Tamamlandı!

Claude Code'un AI Live Log Bridge tools'larını görebilmesi için gerekli olan konfigürasyon otomatik olarak yapıldı.

## Ne Yapıldı?

Config dosyası güncellendi:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

MCP Server eklendi:
```json
{
  "mcpServers": {
    "ai-live-log-bridge": {
      "command": "ai",
      "args": ["--server"]
    }
  }
}
```

## 🚀 Sonraki Adım: Claude Code'u Yeniden Başlat

Claude Code'u **tamamen kapatıp** yeniden başlatmalısın:

1. Claude Code uygulamasını kapat (⌘Q)
2. Biraz bekle (2-3 saniye)
3. Claude Code'u yeniden aç

> **Önemli**: Settings → Preferences → MCP Servers kontrol etme, çünkü Claude Code config'ini `claude_desktop_config.json` dosyasından otomatik yükler!

## 📋 Kontrol Etme

Claude Code'u açtıktan sonra:

1. **Yeni Conversation** aç
2. Şu soruyu sor:
   ```
   view_logs fonksiyonunu çağır
   ```
   veya
   ```
   What's in the terminal logs?
   ```

3. Claude Code şunu yapmalı:
   - MCP tool seçeneğini göstermeli
   - `view_logs` tool'unu çağırabilmeli
   - Terminal loglarını gösterebilmeli

## 🎯 Kullanmaya Başla

Claude Code'da terminal loglarını şu şekilde görebilirsin:

```
You: "npm test'in sonuçları neler?"

Claude: [Calls view_logs]

Claude: "3 test started:
- app.component.spec.ts ✓
- shared.module.spec.ts ✓
- core.module.spec.ts ✓

All tests passed!"
```

## 🛠️ Eğer Çalışmazsa

### MCP Tools Görünmüyor

1. Claude Code'u kapat (⌘Q)
2. Terminal'de kontrol et:
   ```bash
   which ai
   ai echo "test"
   ```
   
3. Sonucun şöyle olmalı:
   ```
   ✅ Command completed successfully
   test
   ```

4. Claude Code'u yeniden aç

### Hala Çalışmazsa

Config dosyasını manuel kontrol et:

```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Çıktısı şöyle olmalı:
```json
{
  "mcpServers": {
    "ai-live-log-bridge": {
      "command": "ai",
      "args": ["--server"]
    }
  },
  ...
}
```

Eğer `mcpServers` boş ise, bu dosyayı tekrar güncellemek gerekir.

## 📚 Mevcut Tools

Claude Code'dan şu tools otomatik erişilebilir olmalı:

### Terminal
- `view_logs` ✅
- `get_crash_context` ✅
- `auto_fix_errors` ✅
- `get_usage_instructions` ✅

### Browser
- `view_browser_logs` ✅
- `get_browser_errors` ✅
- `get_browser_instructions` ✅

## 💡 Pro Tips

- Claude Code "MCP Tools" sekmesini gösterirse, orada tüm tools'ları görebilirsin
- Conversation'da tool'ları direkt çağırabilir veya Claude'un otomatik çağırmasını isteyebilirsin
- Terminal komutlarını `ai` wrapper ile çalıştırmayı unutma!

---

✨ **Hazırız!** Claude Code'da soruları sorabilirsin ve o otomatik olarak logları görecek.
