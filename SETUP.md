# 🚀 Server Setup Instructies

## Stap 1: Node.js Installeren

1. **Download Node.js:**
   - Ga naar: https://nodejs.org/
   - Download de LTS versie (aanbevolen)
   - Voer het installer bestand uit

2. **Controleer installatie:**
   ```powershell
   node --version
   npm --version
   ```

## Stap 2: Server Dependencies Installeren

```powershell
cd c:\game-site\server
npm install
```

## Stap 3: Server Starten

### Development Mode (met auto-restart):
```powershell
npm run dev
```

### Production Mode:
```powershell
npm start
```

**Server draait op:** http://localhost:3000

## Stap 4: Website Testen

1. **Start de frontend server:**
   ```powershell
   # In een nieuwe terminal
   cd c:\game-site
   python -m http.server 8080
   ```

2. **Open website:**
   - Ga naar: http://localhost:8080
   - Test login/registratie functionaliteit

## 🔧 Troubleshooting

### Node.js niet gevonden?
- Herstart PowerShell na Node.js installatie
- Controleer of Node.js in PATH staat

### Server connectie problemen?
- Controleer of server draait op port 3000
- Kijk naar server logs in terminal
- Website werkt ook offline (fallback naar localStorage)

### CORS Errors?
- Zorg dat beide servers draaien (port 3000 en 8080)
- Check browser console voor errors

## 📊 Database

- **Type:** SQLite (automatisch aangemaakt)
- **Locatie:** `c:\game-site\server\game_hub.db`
- **Backup:** Kopieer dit bestand voor backup

## 🛡️ Beveiliging Features

✅ **Wachtwoord hashing** met bcrypt (12 rounds)
✅ **JWT tokens** voor authenticatie (24h geldig)  
✅ **Rate limiting** op login/register (10 per 15 min)
✅ **CORS** beveiliging
✅ **Input validatie** op alle endpoints
✅ **Security headers** met Helmet
✅ **Offline fallback** als server niet beschikbaar is

## 🎮 Wat is Nieuw

- **Veilige server-side authenticatie** in plaats van localStorage
- **Real-time server status** indicator
- **Automatische fallback** naar offline mode
- **Professionele database** opslag van gebruikersdata
- **API-based** game data synchronisatie
- **Cross-device** toegang tot je accounts