# Game Hub Server

Backend API voor Game Hub authentication en user data opslag.

## 🚀 Installatie

```bash
cd server
npm install
```

## 🔧 Configuratie

1. **Environment Variables (optioneel):**
```bash
# .env file
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
```

2. **Database:**
- SQLite database wordt automatisch aangemaakt als `game_hub.db`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Registreer nieuwe gebruiker
- `POST /api/auth/login` - Inloggen

### User Management  
- `GET /api/user/profile` - Gebruikersprofiel ophalen
- `GET /api/user/games` - Alle game saves van gebruiker

### Game Data
- `POST /api/game/save` - Game data opslaan
- `GET /api/game/load/:gameName` - Game data laden

### System
- `GET /api/health` - Server status check

## 🛡️ Beveiliging

- **Wachtwoord hashing** met bcrypt (12 rounds)
- **JWT tokens** voor authenticatie (24h geldig)
- **Rate limiting** op auth endpoints (10 requests per 15 min)
- **CORS** configuratie
- **Helmet** voor security headers
- **Input validatie** op alle endpoints

## 🏃‍♂️ Server starten

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server draait op: `http://localhost:3000`

## 📋 Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- created_at
- last_login
- is_active
```

### Game Data Table
```sql
- id (PRIMARY KEY)  
- user_id (FOREIGN KEY)
- game_name
- data (JSON string)
- updated_at
```

## 🔗 Frontend Integratie

Update je frontend om API calls te maken naar:
- Register: `POST http://localhost:3000/api/auth/register`
- Login: `POST http://localhost:3000/api/auth/login`
- Save: `POST http://localhost:3000/api/game/save`

## 🚨 Productie Deployment

Voor productie:
1. Zet JWT_SECRET environment variable
2. Gebruik HTTPS
3. Configure database backups
4. Setup monitoring
5. Use process manager (PM2)