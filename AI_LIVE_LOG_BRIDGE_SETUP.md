# AI Live Log Bridge Setup - Quickly POS

✅ **Kurulum Tamamlandı**

## İnstallation Summary

- ✅ Global npm paket yüklendi: `ai-live-log-bridge@1.4.0`
- ✅ Chrome native messaging host setup tamamlandı
- ✅ Browser logs dizini hazır: `~/.mcp-logs/browser/active/`
- ✅ Terminal logs dizini hazır: `~/.mcp-logs/active/`

## Chrome Extension

Chrome eklentisi zaten yüklü.
- **Extension Name**: AI Live Terminal Bridge
- **Chrome Web Store**: https://chromewebstore.google.com/detail/ai-live-terminal-bridge-b/ljdggojoihiofgflmpjffflhfjejndjg

## Kullanımı

### Terminal Komutlarını Log'la

Herhangi bir komutu `ai` wrapper'ı ile çalıştır:

```bash
# Npm komutları
ai npm test
ai npm run build
ai npm start

# Diğer komutlar
ai docker-compose up
ai python script.py

# Son logları göster
ai view_logs
ai --last 100
```

### Browser Loglarını İzle

1. Quickly POS uygulamasını `localhost` üzerinde aç
2. Chrome eklentisi otomatik olarak konsolü, network'ü ve JavaScript hatalarını capture edecek
3. AI'ye şunları sor:
   - "What's happening in the browser?"
   - "Any browser errors?"
   - "What network requests are failing?"

### MCP Tools (Claude Desktop, Cursor, Windsurf, Cline, vb.)

AI tools'unuz MCP (Model Context Protocol) destekliyorsa, şu konfigürasyonu ekle:

#### Claude Desktop
File: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

#### Cursor / Windsurf / Cline
Settings → MCP Configuration'da ekle:

```json
{
  "ai-live-log-bridge": {
    "command": "ai",
    "args": ["--server"]
  }
}
```

## Mevcut MCP Tools

AI uygulaması konfigürasyonu yaptıktan sonra şu tools otomatik olarak erişilebilir:

### Terminal Monitoring
- `view_logs` - Tüm terminal output'ını gör
- `get_crash_context` - Sadece hataları ve crash'leri gör
- `auto_fix_errors` - Tüm hataları otomatik tespit et ve çözümleri sun
- `get_usage_instructions` - Detaylı kullanım rehberi

### Browser Monitoring
- `view_browser_logs` - Console logs ve network activity'i gör
- `get_browser_errors` - Sadece browser hatalarını ve failed request'leri gör
- `get_browser_instructions` - Browser setup rehberi

## Log Konumları

```bash
# Terminal logs
~/.mcp-logs/active/
ls ~/.mcp-logs/active/session-*.log

# Browser logs
~/.mcp-logs/browser/active/
ls ~/.mcp-logs/browser/active/browser-*.log

# Tüm logları gör
ai --last 200
ai live  # Watch mode
```

## Guvenlik

- ✅ API keys, tokens, passwords otomatik redakte edilir `[REDACTED]`
- ✅ 15+ secret pattern koruması var
- ✅ Browser monitoring sadece localhost'ta çalışır
- ✅ Session isolation - Parallel komutlar karışmaz
- ✅ Project-based filtering - Sadece proje loglarını görsün

## Quickly POS Dev Workflow

```bash
# Terminal 1: Quickly POS'u çalıştır (ai wrapper ile)
ai npm run electron:serve-tsc

# Terminal 2: Angular renderer'ı çalıştır
ai npm run ng:serve

# Terminal 3: Tests çalıştır
ai npm test

# AI'ye sor:
# "What's the status of the build?"
# "Any console errors in the browser?"
# "What tests are failing?"

# AI otomatik olarak görecek:
# - Terminal output
# - Build logs
# - Browser console errors
# - Network requests
# - Test failures
```

## Troubleshooting

### `ai: command not found`
```bash
hash -r  # Terminal cache'ini temizle
which ai  # Check installation
```

### Browser logs görünmüyor
1. Chrome eklentisinin yüklü olduğunu kontrol et: chrome://extensions/
2. Localhost sayfasını aç (127.0.0.1 veya localhost:port)
3. Logları kontrol et: `ls ~/.mcp-logs/browser/active/`

### MCP tools görmüyorum
1. JSON syntax'ını kontrol et (trailing commas olmasın)
2. AI tool'unu tamamen kapat ve yeniden başlat
3. `which ai` ile yüklü olduğunu kontrol et
4. `ai echo "test"` ile temel fonksiyon test et

## Ekstra Bilgi

- **CLI Mode**: Non-MCP tools (Aider, Continue eski sürümleri) için `ai --last 100` manuel olarak kullan
- **Log Retention**: `export AI_KEEP_LOGS=1` ile log saklama süresini kontrol et (gün cinsinden)
- **Docker Support**: `ai docker-compose up` da çalışır

---

**Setup tarih**: 28 Aralık 2025
**Version**: ai-live-log-bridge@1.4.0

Sorularınız için: https://github.com/Ami3466/ai-live-log-bridge
