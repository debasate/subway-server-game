const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'game-hub-secret-key-change-in-production';

// Security middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'https://debasate.github.io'],
    credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
});

app.use(express.json());

// Database setup
const db = new sqlite3.Database('./game_hub.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
    )`);

    // Game data table
    db.run(`CREATE TABLE IF NOT EXISTS game_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game_name TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, game_name)
    )`);

    console.log('Database tables initialized');
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Register new user
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Insert new user
            db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
                [username, email, passwordHash], function(err) {
                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                // Create JWT token
                const token = jwt.sign(
                    { userId: this.lastID, username: username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'User created successfully',
                    token: token,
                    user: {
                        id: this.lastID,
                        username: username,
                        email: email
                    }
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Update last login
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

            // Create JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    lastLogin: user.last_login
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, created_at, last_login FROM users WHERE id = ?', 
        [req.user.userId], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    });
});

// Save game data
app.post('/api/game/save', authenticateToken, (req, res) => {
    const { gameName, gameData } = req.body;

    if (!gameName || !gameData) {
        return res.status(400).json({ error: 'Game name and data are required' });
    }

    const dataString = JSON.stringify(gameData);

    db.run(`INSERT OR REPLACE INTO game_data (user_id, game_name, data, updated_at) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, 
        [req.user.userId, gameName, dataString], function(err) {
        if (err) {
            console.error('Save error:', err);
            return res.status(500).json({ error: 'Failed to save game data' });
        }

        res.json({ message: 'Game data saved successfully' });
    });
});

// Load game data
app.get('/api/game/load/:gameName', authenticateToken, (req, res) => {
    const { gameName } = req.params;

    db.get('SELECT data, updated_at FROM game_data WHERE user_id = ? AND game_name = ?', 
        [req.user.userId, gameName], (err, row) => {
        if (err) {
            console.error('Load error:', err);
            return res.status(500).json({ error: 'Failed to load game data' });
        }

        if (!row) {
            return res.status(404).json({ error: 'No saved data found' });
        }

        try {
            const gameData = JSON.parse(row.data);
            res.json({ 
                gameData,
                lastUpdated: row.updated_at
            });
        } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ error: 'Corrupted game data' });
        }
    });
});

// Get all user's game data
app.get('/api/user/games', authenticateToken, (req, res) => {
    db.all('SELECT game_name, updated_at FROM game_data WHERE user_id = ? ORDER BY updated_at DESC', 
        [req.user.userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ games: rows });
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Game Hub API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📴 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});