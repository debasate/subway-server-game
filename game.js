// User Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.users = JSON.parse(localStorage.getItem('gameUsers')) || {};

        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Only initialize listeners if DOM elements exist
        if (document.getElementById('login-screen')) {
            this.initAuthListeners();
            this.initMobileTouchHandlers();
            this.optimizeForMobile();
            this.startDemoCodeUpdater();
        }
    }

    initAuthListeners() {
        // Check if elements exist before adding listeners
        const elements = {
            loginBtn: document.getElementById('login-btn'),
            registerBtn: document.getElementById('register-btn'),
            guestBtn: document.getElementById('guest-play-btn'),
            demoBtn: document.getElementById('demo-login-btn'),
            logoutBtn: document.getElementById('logout-btn')
        };

        // Only add listeners if elements exist
        if (elements.loginBtn) elements.loginBtn.addEventListener('click', () => this.handleLogin());
        if (elements.registerBtn) elements.registerBtn.addEventListener('click', () => this.handleRegister());
        if (elements.guestBtn) elements.guestBtn.addEventListener('click', () => this.handleGuestPlay());
        if (elements.demoBtn) elements.demoBtn.addEventListener('click', () => this.handleDemoLogin());
        if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Form switching
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        if (showRegister) showRegister.addEventListener('click', () => this.showRegisterForm());
        if (showLogin) showLogin.addEventListener('click', () => this.showLoginForm());

        // Real-time validation - only if elements exist
        const regUsername = document.getElementById('register-username');
        const regPassword = document.getElementById('register-password');
        const regPasswordConfirm = document.getElementById('register-confirm-password');
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');

        if (regUsername) regUsername.addEventListener('input', (e) => this.validateUsername(e.target.value));
        if (regPassword) regPassword.addEventListener('input', (e) => this.validatePassword(e.target.value));
        if (regPasswordConfirm) regPasswordConfirm.addEventListener('input', (e) => this.validatePasswordMatch());
        if (termsAgree) termsAgree.addEventListener('change', (e) => this.toggleRegisterButton());

        // Enter key handling
        if (loginUsername) loginUsername.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        if (loginPassword) loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        this.clearMessages();
    }

    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        this.clearMessages();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update form visibility
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}-form`);
        });

        // Clear messages
        this.clearMessages();
    }

    validateUsername(username) {
        if (username.length < 3) {
            return false;
        } else if (username.length > 20) {
            return false;
        } else if (this.users[username.toLowerCase()]) {
            return false;
        } else {
            return true;
        }
    }

    validatePassword(password) {
        let strength = 0;

        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]/)) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

        return strength >= 2;
    }

    validatePasswordMatch() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (confirmPassword.length === 0) {
            return false;
        } else if (password !== confirmPassword) {
            return false;
        } else {
            return true;
        }
    }

    toggleRegisterButton() {
        const username = document.getElementById('register-username')?.value || '';
        const password = document.getElementById('register-password')?.value || '';
        const confirmPassword = document.getElementById('register-confirm-password')?.value || '';
        const registerBtn = document.getElementById('register-btn');

        const isValid = this.validateUsername(username) &&
            this.validatePassword(password) &&
            this.validatePasswordMatch();

        if (registerBtn) {
            registerBtn.disabled = !isValid;
        }
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showError('Vul alle velden in');
            return;
        }

        this.showLoading(true);

        // Simulate API call delay
        await this.delay(800);

        const user = this.users[username.toLowerCase()];
        if (user && user.password === password) {
            this.currentUser = { ...user, username: username.toLowerCase() };
            this.isLoggedIn = true;

            this.showSuccess(`Welkom terug, ${user.displayName}!`);
            setTimeout(() => this.showMainGame(), 1500);
        } else {
            this.showError('Onjuiste gebruikersnaam of wachtwoord');
        }

        this.showLoading(false);
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !password || !confirmPassword) {
            this.showError('Vul alle velden in');
            return;
        }

        if (!this.validateUsername(username) || !this.validatePassword(password)) {
            this.showError('Controleer je invoer en probeer opnieuw');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Wachtwoorden komen niet overeen');
            return;
        }

        if (this.users[username.toLowerCase()]) {
            this.showError('Gebruikersnaam bestaat al');
            return;
        }

        this.showLoading(true);

        // Simulate API call delay
        await this.delay(1200);

        const newUser = {
            displayName: username,
            password: password,
            createdAt: new Date().toISOString(),
            stats: {
                totalCoins: 0,
                highScore: 0,
                gamesPlayed: 0,
                totalPlayTime: 0,
                levelsCompleted: 0,
                powerUpsUsed: 0
            },
            achievements: [],
            settings: {
                soundEnabled: true,
                musicVolume: 0.3,
                effectsVolume: 0.5
            },
            gameData: {
                unlockedSkins: ['default'],
                currentTheme: 'subway',
                powerUps: {},
                level: 1
            }
        };

        this.users[username.toLowerCase()] = newUser;
        this.saveUsers();

        this.currentUser = { ...newUser, username: username.toLowerCase() };
        this.isLoggedIn = true;

        this.showSuccess(`Account aangemaakt! Welkom ${username}!`);
        setTimeout(() => this.showMainGame(), 1500);
        this.showLoading(false);
    }

    async handleDemoLogin() {
        // Check demo code first
        const enteredCode = prompt('🔐 Voer de demo code in (regenereert elke 10 minuten):');
        const currentValidCode = this.generateDemoCode();

        if (enteredCode !== currentValidCode) {
            this.showError(`❌ Onjuiste demo code! Huidige code: ${currentValidCode}`);
            return;
        }

        console.log('🎮 Demo login started...');
        this.showLoading(true);
        await this.delay(500);

        // Create demo user if not exists
        const demoUser = {
            displayName: 'Demo Speler',
            email: 'demo@subway.game',
            password: 'demo123',
            createdAt: new Date().toISOString(),
            stats: {
                totalCoins: 999,
                highScore: 15000,
                gamesPlayed: 50,
                totalPlayTime: 7200,
                levelsCompleted: 8,
                powerUpsUsed: 25
            },
            achievements: ['first_game', 'coin_collector', 'speed_demon'],
            settings: {
                soundEnabled: true,
                musicVolume: 0.3,
                effectsVolume: 0.5
            },
            gameData: {
                unlockedSkins: ['default', 'goldenSkin', 'speedSkin'],
                currentTheme: 'neon',
                powerUps: { doubleJump: 5, timeSlower: 3 },
                level: 3
            }
        };

        this.users['demo'] = demoUser;
        this.saveUsers();

        this.currentUser = { ...demoUser, username: 'demo' };
        this.isLoggedIn = true;

        this.showSuccess(`🎮 Demo account geladen! Code geldig tot: ${this.getNextCodeTime()}`);
        setTimeout(() => this.showMainGame(), 1500);
        this.showLoading(false);
    }

    generateDemoCode() {
        // Generate code based on current time (updates every 10 minutes)
        const now = new Date();
        const tenMinuteSlot = Math.floor(now.getTime() / (10 * 60 * 1000));

        // Simple hash function for consistent code generation
        const codeBase = tenMinuteSlot.toString();
        let hash = 0;
        for (let i = 0; i < codeBase.length; i++) {
            const char = codeBase.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Convert to 4-digit code
        const code = Math.abs(hash % 9000) + 1000;
        return code.toString();
    }

    getNextCodeTime() {
        const now = new Date();
        const nextSlot = Math.ceil(now.getTime() / (10 * 60 * 1000)) * (10 * 60 * 1000);
        const nextTime = new Date(nextSlot);
        return nextTime.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    }

    startDemoCodeUpdater() {
        // Update demo code display every second
        this.updateDemoCodeDisplay();
        setInterval(() => {
            this.updateDemoCodeDisplay();
        }, 1000);
    }

    updateDemoCodeDisplay() {
        const codeElement = document.getElementById('current-demo-code');
        const timeElement = document.getElementById('next-code-time');

        if (codeElement && timeElement) {
            codeElement.textContent = this.generateDemoCode();
            timeElement.textContent = this.getNextCodeTime();
        }
    }

    handleGuestPlay() {
        const nickname = document.getElementById('guest-nickname')?.value.trim() || 'Gast';

        this.currentUser = {
            displayName: nickname,
            username: null,
            isGuest: true,
            stats: {
                totalCoins: 0,
                highScore: 0,
                gamesPlayed: 0,
                totalPlayTime: 0,
                levelsCompleted: 0,
                powerUpsUsed: 0
            },
            gameData: {
                unlockedSkins: ['default'],
                currentTheme: 'subway',
                powerUps: {},
                level: 1
            }
        };
        this.isLoggedIn = false;

        this.showSuccess(`Welkom ${nickname}! 🎮 Je kunt altijd inloggen via de knop rechtsboven!`);
        setTimeout(() => this.showMainGame(), 2000);
    }

    handleLogout() {
        this.currentUser = null;
        this.isLoggedIn = false;

        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';

        // Reset forms
        document.querySelectorAll('input').forEach(input => {
            if (input.type !== 'checkbox') input.value = '';
            else input.checked = false;
        });

        this.showLoginForm();
    }

    showMainGame() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';

        this.updateUserProfile();
        this.loadUserGameData();
    }

    updateUserProfile() {
        console.log('🔧 updateUserProfile called', this.currentUser);
        const avatar = document.getElementById('user-avatar');
        const usernameDisplay = document.getElementById('username-display');
        const saveStatus = document.getElementById('save-status');
        const connectionStatus = document.getElementById('connection-status');
        const logoutBtn = document.getElementById('logout-btn');

        // Check if elements exist
        if (!avatar || !usernameDisplay || !saveStatus || !connectionStatus || !logoutBtn) {
            console.error('❌ UI elements missing:', {
                avatar: !!avatar,
                usernameDisplay: !!usernameDisplay,
                saveStatus: !!saveStatus,
                connectionStatus: !!connectionStatus,
                logoutBtn: !!logoutBtn
            });
            return;
        }

        // Update basic info
        avatar.textContent = this.currentUser.displayName.charAt(0).toUpperCase();
        usernameDisplay.textContent = this.currentUser.displayName;

        if (this.currentUser.isGuest) {
            console.log('👤 Setting up GUEST mode UI');
            saveStatus.textContent = '💾 Lokaal Opgeslagen';
            connectionStatus.textContent = '🔒 Gast Modus';

            // FORCE update logout button to login button
            logoutBtn.innerHTML = '🔑 Inloggen';
            logoutBtn.style.display = 'block';
            logoutBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            logoutBtn.onclick = () => {
                console.log('🔑 Login button clicked!');
                this.switchToLogin();
            };

            console.log('✅ Guest UI setup complete');
        } else {
            console.log('👥 Setting up LOGGED IN user UI');
            saveStatus.textContent = '☁️ Cloud Save';
            connectionStatus.textContent = '🟢 Verbonden';

            logoutBtn.innerHTML = '🚪 Uitloggen';
            logoutBtn.style.display = 'block';
            logoutBtn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            logoutBtn.onclick = () => {
                console.log('🚪 Logout button clicked!');
                this.handleLogout();
            };

            console.log('✅ Logged in UI setup complete');
        }

        // Force refresh display
        setTimeout(() => {
            if (this.currentUser.isGuest) {
                logoutBtn.innerHTML = '🔑 Inloggen';
            }
        }, 100);
    }

    switchToLogin() {
        console.log('🔄 Switching to login screen...');
        // Ga terug naar login scherm zodat gebruiker kan inloggen
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        this.showLoginForm();
        this.clearMessages();

        // Show helpful message
        setTimeout(() => {
            this.showSuccess('💡 Log in om je voortgang op te slaan in de cloud!');
        }, 500);
    }

    loadUserGameData() {
        if (!this.currentUser) return;

        // Load user's game data
        const gameData = this.currentUser.gameData;
        const stats = this.currentUser.stats;

        // Set coins
        coins = stats.totalCoins || 0;
        updateCoinDisplay();

        // Set high score
        highScore = stats.highScore || 0;

        // Set current theme
        currentTheme = gameData.currentTheme || 'subway';

        // Load unlocked skins
        if (gameData.unlockedSkins) {
            gameData.unlockedSkins.forEach(skin => {
                if (shopItems[skin]) {
                    shopItems[skin].owned = true;
                }
            });
        }

        // Update UI elements
        document.getElementById('infinity-best').textContent = highScore;
        document.getElementById('level-progress').textContent = gameData.level || 1;

        // Update shop display
        updateShopDisplay();
    }

    saveUserProgress() {
        if (!this.currentUser || this.currentUser.isGuest) return;

        // Update user stats
        this.currentUser.stats.totalCoins = coins;
        this.currentUser.stats.highScore = Math.max(this.currentUser.stats.highScore, highScore);
        this.currentUser.gameData.currentTheme = currentTheme;

        // Save to localStorage
        this.users[this.currentUser.username] = this.currentUser;
        this.saveUsers();
    }

    saveUsers() {
        localStorage.setItem('gameUsers', JSON.stringify(this.users));
    }

    showLoading(show) {
        const statusEl = document.getElementById('auth-status');
        if (statusEl && show) {
            statusEl.innerHTML = `<div class="auth-message">⏳ Laden...</div>`;
        } else if (statusEl && !show) {
            // Only clear if it shows loading message
            if (statusEl.innerHTML.includes('Laden...')) {
                statusEl.innerHTML = '';
            }
        }

        // Disable form buttons during loading
        const buttons = document.querySelectorAll('.auth-btn');
        buttons.forEach(btn => {
            if (btn) btn.disabled = show;
        });
    }

    showError(message) {
        const statusEl = document.getElementById('auth-status');
        if (statusEl) {
            statusEl.innerHTML = `<div class="auth-message error">${message}</div>`;
            setTimeout(() => statusEl.innerHTML = '', 5000);
        }
    }

    showSuccess(message) {
        const statusEl = document.getElementById('auth-status');
        if (statusEl) {
            statusEl.innerHTML = `<div class="auth-message success">${message}</div>`;
            setTimeout(() => statusEl.innerHTML = '', 3000);
        }
    }

    clearMessages() {
        const statusEl = document.getElementById('auth-status');
        if (statusEl) {
            statusEl.innerHTML = '';
        }
    }

    initMobileTouchHandlers() {
        if (!this.isMobile) return;

        // Prevent default touch behaviors on form elements
        const formElements = document.querySelectorAll('.auth-form input, .auth-form button');
        formElements.forEach(element => {
            element.addEventListener('touchstart', (e) => {
                // Allow normal touch behavior for form elements
                e.stopPropagation();
            }, { passive: true });
        });

        // Add touch feedback for buttons
        const buttons = document.querySelectorAll('.auth-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.98)';
            }, { passive: true });

            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 100);
            }, { passive: true });
        });
    }

    optimizeForMobile() {
        if (!this.isMobile) return;

        // Add mobile-specific class to body
        document.body.classList.add('mobile-device');

        // Optimize viewport for mobile keyboards
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }

        // Handle mobile keyboard
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll to input on focus to avoid keyboard overlap
                setTimeout(() => {
                    input.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            });

            input.addEventListener('blur', () => {
                // Reset scroll position
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });

        // Add mobile gesture hints
        this.addMobileHints();
    }

    addMobileHints() {
        const authContainer = document.querySelector('.auth-container');
        if (!authContainer) return;

        // Add mobile tip at bottom
        const mobileTip = document.createElement('div');
        mobileTip.className = 'mobile-tip';
        mobileTip.innerHTML = '💡 <strong>Tip:</strong> Swipe up/down to navigate forms';
        mobileTip.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 10001;
            animation: fadeInUp 0.5s ease-out;
        `;

        document.body.appendChild(mobileTip);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            mobileTip.style.opacity = '0';
            setTimeout(() => {
                if (mobileTip.parentNode) {
                    mobileTip.parentNode.removeChild(mobileTip);
                }
            }, 300);
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Debug function to clear all data
    clearAllData() {
        console.log('🗑️ Clearing all saved data...');
        localStorage.clear();
        this.users = {};
        this.currentUser = null;
        this.isLoggedIn = false;

        // Force reload page
        window.location.reload();
    }
}

// Authentication system disabled - using local storage only

// Initialize authentication system
let authManager = null;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const shopScreen = document.getElementById('shop-screen');
const infinityBtn = document.getElementById('infinity-btn');
const levelBtn = document.getElementById('level-btn');
const shopBtn = document.getElementById('shop-btn');
const shopCloseBtn = document.getElementById('shop-close-btn');
const gameInfo = document.getElementById('game-info');
const modeDisplay = document.getElementById('mode-display');
const levelDisplay = document.getElementById('level-display');
const coinDisplay = document.getElementById('coin-display');
const coinsCount = document.getElementById('coins-count');

// Audio System
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;
let musicVolume = 0.3;
let effectsVolume = 0.5;

// Mobile Touch Controls
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let lastTouchTime = 0;
let touchSensitivity = 50; // minimum distance for swipe detection

// Mobile UI elements
let mobileControls = {
    leftBtn: null,
    rightBtn: null,
    pauseBtn: null,
    powerUpBtn: null
};

// Sound effects storage
const sounds = {
    coin: null,
    jump: null,
    crash: null,
    powerup: null,
    victory: null,
    shield: null,
    levelup: null
};

// Background music
let backgroundMusic = null;
let currentMusicTrack = null;

// Particle System
let particles = [];
let particleId = 0;

class Particle {
    constructor(x, y, type = 'default', color = '#FFD700') {
        this.id = particleId++;
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.gravity = 0.1;
        this.alpha = 1.0;
        this.decay = 0.02;

        // Type-specific properties
        switch (type) {
            case 'coin':
                this.color = '#FFD700';
                this.size = Math.random() * 3 + 1;
                this.decay = 0.015;
                break;
            case 'explosion':
                this.color = '#FF4444';
                this.size = Math.random() * 6 + 3;
                this.decay = 0.03;
                break;
            case 'sparkle':
                this.color = '#FFFFFF';
                this.size = Math.random() * 2 + 1;
                this.decay = 0.025;
                this.twinkle = Math.random() * Math.PI * 2;
                break;
            case 'speed':
                this.color = '#00BFFF';
                this.size = Math.random() * 4 + 2;
                this.decay = 0.02;
                break;
            case 'victory':
                this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
                this.size = Math.random() * 8 + 4;
                this.decay = 0.01;
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = -Math.random() * 8 - 5;
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.alpha = this.life / this.maxLife;

        if (this.type === 'sparkle') {
            this.twinkle += 0.2;
            this.alpha *= Math.abs(Math.sin(this.twinkle));
        }

        return this.life > 0;
    }

    draw() {
        if (this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;

        if (this.type === 'sparkle') {
            // Draw sparkle as star shape
            ctx.translate(this.x, this.y);
            ctx.rotate(this.twinkle);
            ctx.fillRect(-this.size / 2, -1, this.size, 2);
            ctx.fillRect(-1, -this.size / 2, 2, this.size);
        } else {
            // Draw as circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

let gameRunning = false;
let gameMode = 'infinity'; // 'infinity', 'level', or 'multiplayer'
let currentLevel = 1;
let levelProgress = 0;
let levelTarget = 1000; // Score needed to complete level

// Weather & Environment Effects
let currentWeather = 'normal'; // 'normal', 'rain', 'snow', 'night', 'storm'
let weatherParticles = [];
let lightningTimer = 0;

// Theme System
let currentTheme = 'subway'; // 'subway', 'space', 'underwater', 'forest', 'desert', 'neon', 'retro'
let themeUnlocked = JSON.parse(localStorage.getItem('subwayThemesUnlocked') || '{"subway": true}');

const themes = {
    subway: {
        name: 'Classic Subway',
        description: 'The original underground train experience',
        icon: '🚇',
        colors: {
            primary: '#2C3E50',
            secondary: '#34495E',
            accent: '#4ecdc4',
            rail: '#BDC3C7',
            wall: '#1A252F'
        },
        unlockRequirement: 0,
        unlocked: true
    },
    space: {
        name: 'Space Station',
        description: 'Futuristic space tunnel adventure',
        icon: '🚀',
        colors: {
            primary: '#0F1419',
            secondary: '#1A1F2E',
            accent: '#00D9FF',
            rail: '#4A90E2',
            wall: '#0A0D12'
        },
        unlockRequirement: 2000,
        unlocked: false
    },
    underwater: {
        name: 'Ocean Depths',
        description: 'Deep sea underwater tunnel',
        icon: '🌊',
        colors: {
            primary: '#1B4F72',
            secondary: '#2471A3',
            accent: '#00FFFF',
            rail: '#5DADE2',
            wall: '#154360'
        },
        unlockRequirement: 5000,
        unlocked: false
    },
    forest: {
        name: 'Jungle Path',
        description: 'Mysterious forest tunnel',
        icon: '🌲',
        colors: {
            primary: '#1B4332',
            secondary: '#2D5016',
            accent: '#52B788',
            rail: '#8FBC8F',
            wall: '#0D2818'
        },
        unlockRequirement: 10000,
        unlocked: false
    },
    desert: {
        name: 'Sand Dunes',
        description: 'Ancient desert passage',
        icon: '🏜️',
        colors: {
            primary: '#8B4513',
            secondary: '#A0522D',
            accent: '#FFD700',
            rail: '#DEB887',
            wall: '#654321'
        },
        unlockRequirement: 15000,
        unlocked: false
    },
    neon: {
        name: 'Neon City',
        description: 'Cyberpunk neon-lit tunnel',
        icon: '🌃',
        colors: {
            primary: '#FF1493',
            secondary: '#9932CC',
            accent: '#00FFFF',
            rail: '#FF69B4',
            wall: '#4B0082'
        },
        unlockRequirement: 25000,
        unlocked: false
    },
    retro: {
        name: 'Retro Arcade',
        description: 'Classic 80s style tunnel',
        icon: '👾',
        colors: {
            primary: '#FF6B35',
            secondary: '#F7931E',
            accent: '#FFE135',
            rail: '#C5D86D',
            wall: '#7209B7'
        },
        unlockRequirement: 50000,
        unlocked: false
    }
};

// Level Progress System
let levelProgressBar = {
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    progress: 0,
    targetProgress: 0,
    animationSpeed: 0.02
};

// Power-ups System
let activePowerUps = [];
let powerUpSpawnTimer = 0;
let collectiblePowerUps = [];

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 30;
        this.type = type;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.lifetime = 300; // 5 seconds at 60fps

        // Type-specific properties
        switch (type) {
            case 'speedBoost':
                this.color = '#00BFFF';
                this.icon = '⚡';
                this.duration = 300; // 5 seconds
                break;
            case 'coinMagnet':
                this.color = '#FFD700';
                this.icon = '🧲';
                this.duration = 480; // 8 seconds
                break;
            case 'jumpBoost':
                this.color = '#32CD32';
                this.icon = '🦘';
                this.duration = 1; // One-time use
                break;
            case 'freeze':
                this.color = '#87CEEB';
                this.icon = '❄️';
                this.duration = 180; // 3 seconds
                break;
            case 'starPower':
                this.color = '#FF6347';
                this.icon = '🌟';
                this.duration = 300; // 5 seconds
                break;
        }
    }

    update() {
        this.y += speed;
        this.lifetime--;
        this.bobOffset += 0.1;
        return this.lifetime > 0 && this.y < canvas.height + 50;
    }

    draw() {
        const bobAmount = Math.sin(this.bobOffset) * 3;
        const drawY = this.y + bobAmount;

        // Glow effect
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Background circle
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, drawY + this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.globalAlpha = 1;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.icon, this.x + this.w / 2, drawY + this.h / 2 + 7);

        ctx.restore();
        ctx.textAlign = 'left';
    }

    checkCollision(player) {
        return this.x < player.x + player.w &&
            this.x + this.w > player.x &&
            this.y < player.y + player.h &&
            this.y + this.h > player.y;
    }
}

// Achievements System
let achievements = JSON.parse(localStorage.getItem('subwayAchievements') || '{}');
const achievementsList = {
    speedDemon: {
        name: 'Speed Demon',
        description: 'Score 5000+ in infinity mode',
        icon: '🏃',
        requirement: 5000,
        unlocked: false
    },
    ghostMaster: {
        name: 'Ghost Master',
        description: 'Use ghost ability 20 times',
        icon: '👻',
        requirement: 20,
        unlocked: false
    },
    coinCollector: {
        name: 'Coin Collector',
        description: 'Collect 1000 total coins',
        icon: '💰',
        requirement: 1000,
        unlocked: false
    },
    botSlayer: {
        name: 'Bot Slayer',
        description: 'Win 10 multiplayer matches',
        icon: '🤖',
        requirement: 10,
        unlocked: false
    },
    survivor: {
        name: 'Survivor',
        description: 'Survive 120 seconds in infinity mode',
        icon: '⏰',
        requirement: 120,
        unlocked: false
    },
    powerUser: {
        name: 'Power User',
        description: 'Collect 50 power-ups',
        icon: '⚡',
        requirement: 50,
        unlocked: false
    }
};

// Daily Challenges System
let dailyChallenges = JSON.parse(localStorage.getItem('subwayDailyChallenges') || '{}');
let currentChallenge = null;

// Stats tracking
let gameStats = JSON.parse(localStorage.getItem('subwayStats') || '{}');
if (!gameStats.totalCoinsCollected) gameStats.totalCoinsCollected = 0;
if (!gameStats.ghostAbilityUses) gameStats.ghostAbilityUses = 0;
if (!gameStats.powerUpsCollected) gameStats.powerUpsCollected = 0;
if (!gameStats.totalPlayTime) gameStats.totalPlayTime = 0;
if (!gameStats.longestSurvival) gameStats.longestSurvival = 0;

// Multiplayer state
let isMultiplayer = false;
let bots = [];
let playerRanking = [];
let multiplayerResults = null;

// Player and game state
let player = {
    x: 220, y: 540, w: 40, h: 40, color: '#ff0', lane: 1, lives: 1,
    moveSpeed: 1, // Voor lane switching snelheid
    activeSkin: 'default',
    ghostCharges: 0,
    lastGhostScore: 0
};
let lanes = [120, 220, 320];
let obstacles = [];
let speed = 7; // Veel snellere start snelheid
let score = 0;
let baseSpeed = 7;
let scoreMultiplier = 0.25; // Iets snellere score toename
let difficultyLevel = 1;

// Notification system
let notifications = [];
let notificationId = 0;

// Audio functions
function playSound(soundName, volume = effectsVolume) {
    if (isMuted || !sounds[soundName]) return;

    try {
        // Create simple oscillator-based sounds since we don't have audio files
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        switch (soundName) {
            case 'coin':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
                break;
            case 'jump':
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
                break;
            case 'crash':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
                break;
            case 'powerup':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
                break;
            case 'victory':
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
                break;
        }

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
        console.log('Audio not available:', error);
    }
}

function createParticle(x, y, type = 'default', color = '#FFD700', count = 1) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, type, color));
    }
}

function updateParticles() {
    particles = particles.filter(particle => {
        const alive = particle.update();
        if (alive) particle.draw();
        return alive;
    });
}

function updateWeatherParticles() {
    // Add weather-specific particles
    if (currentWeather === 'rain' && Math.random() < 0.3) {
        weatherParticles.push({
            x: Math.random() * canvas.width,
            y: -5,
            speed: Math.random() * 3 + 5,
            length: Math.random() * 15 + 10
        });
    } else if (currentWeather === 'snow' && Math.random() < 0.1) {
        weatherParticles.push({
            x: Math.random() * canvas.width,
            y: -5,
            speed: Math.random() * 1 + 1,
            size: Math.random() * 3 + 2,
            drift: Math.random() * 2 - 1
        });
    }

    // Update weather particles
    weatherParticles = weatherParticles.filter(particle => {
        if (currentWeather === 'rain') {
            particle.y += particle.speed;

            ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x - 2, particle.y - particle.length);
            ctx.stroke();

            return particle.y < canvas.height + 20;
        } else if (currentWeather === 'snow') {
            particle.y += particle.speed;
            particle.x += particle.drift;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            return particle.y < canvas.height + 10;
        }
        return false;
    });
}

function checkAchievements() {
    Object.keys(achievementsList).forEach(key => {
        const achievement = achievementsList[key];
        if (achievements[key] || achievement.unlocked) return;

        let unlocked = false;

        switch (key) {
            case 'speedDemon':
                unlocked = score >= 5000 && gameMode === 'infinity';
                break;
            case 'ghostMaster':
                unlocked = gameStats.ghostAbilityUses >= 20;
                break;
            case 'coinCollector':
                unlocked = gameStats.totalCoinsCollected >= 1000;
                break;
            case 'botSlayer':
                unlocked = gameStats.multiplayerWins >= 10;
                break;
            case 'survivor':
                const survivalTime = score / (60 * scoreMultiplier);
                unlocked = survivalTime >= 120 && gameMode === 'infinity';
                break;
            case 'powerUser':
                unlocked = gameStats.powerUpsCollected >= 50;
                break;
        }

        if (unlocked) {
            achievements[key] = true;
            achievement.unlocked = true;
            localStorage.setItem('subwayAchievements', JSON.stringify(achievements));

            showNotification(`🏆 ACHIEVEMENT UNLOCKED!\n${achievement.icon} ${achievement.name}\n${achievement.description}`, 'achievement', 5000);
            playSound('victory');
            createParticle(canvas.width / 2, canvas.height / 2, 'victory', '#FFD700', 20);
        }
    });
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = {
        id: notificationId++,
        message: message,
        type: type, // 'info', 'success', 'warning', 'achievement'
        createdAt: Date.now(),
        duration: duration
    };
    notifications.push(notification);

    // Auto remove after duration
    setTimeout(() => {
        notifications = notifications.filter(n => n.id !== notification.id);
    }, duration);
}

function drawNotifications() {
    const currentTime = Date.now();

    notifications.forEach((notification, index) => {
        const age = currentTime - notification.createdAt;
        const progress = age / notification.duration;
        const opacity = Math.max(0, 1 - progress);

        // Position from center
        const y = canvas.height / 2 - 100 + (index * 60);
        const x = canvas.width / 2;

        // Background
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * opacity})`;
        ctx.fillRect(x - 150, y - 25, 300, 50);

        // Border based on type
        let borderColor = '#4CAF50';
        switch (notification.type) {
            case 'success': borderColor = '#4CAF50'; break;
            case 'warning': borderColor = '#FF9800'; break;
            case 'achievement': borderColor = '#FFD700'; break;
            case 'info': borderColor = '#2196F3'; break;
        }

        ctx.strokeStyle = `rgba(${hexToRgb(borderColor)}, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 150, y - 25, 300, 50);

        // Text
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.message, x, y + 5);
        ctx.textAlign = 'left';
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '255, 255, 255';
}

// Shield system
let temporaryShield = false;
let shieldTimeLeft = 0;
let lastShieldScore = 0;

// Coin system
let coins = parseInt(localStorage.getItem('subwayCoins') || '0');
let coinsThisRun = 0;

// Shop items and upgrades
let playerUpgrades = JSON.parse(localStorage.getItem('subwayUpgrades') || '{}');
const defaultUpgrades = {
    speed: false,
    shield: false,
    magnet: false,
    goldenSkin: false,
    speedSkin: false,
    ghostSkin: false,
    tankSkin: false,
    rainbowSkin: false
};
playerUpgrades = { ...defaultUpgrades, ...playerUpgrades };

// Shop system
const shopItems = {
    speed: { price: 10, name: "Speed Boost" },
    shield: { price: 25, name: "Shield" },
    magnet: { price: 50, name: "Coin Magnet" },
    goldenSkin: { price: 100, name: "Golden Skin" },
    speedSkin: { price: 150, name: "Speed Demon" },
    ghostSkin: { price: 200, name: "Ghost Mode" },
    tankSkin: { price: 300, name: "Tank Mode" },
    rainbowSkin: { price: 500, name: "Rainbow Power" }
};

// Auto-save throttling
let lastAutoSave = 0;
const AUTO_SAVE_INTERVAL = 5000; // Save every 5 seconds

function updateCoinDisplay() {
    const coinDisplayElement = document.getElementById('coin-display');
    const coinsCountElement = document.getElementById('coins-count');

    if (coinDisplayElement) coinDisplayElement.textContent = coins;
    if (coinsCountElement) coinsCountElement.textContent = coinsThisRun;

    // Auto-save with throttling
    const now = Date.now();
    if (now - lastAutoSave > AUTO_SAVE_INTERVAL) {
        lastAutoSave = now;
        saveProgress();

        // Show save indicator (local save only now)
        const saveStatusElement = document.getElementById('save-status');
        if (saveStatusElement) {
            saveStatusElement.textContent = 'Local Save';
        }
    }
}

// Bot system for multiplayer
class Bot {
    constructor(name, color, difficulty = 'medium') {
        this.name = name;
        this.x = 220;
        this.y = 540 + Math.random() * 100; // Slight y offset for visibility
        this.w = 35;
        this.h = 35;
        this.color = color;
        this.lane = 1;
        this.score = 0;
        this.alive = true;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        this.reactionTime = this.getDifficultyReactionTime();
        this.lastDecision = 0;
        this.targetLane = 1;
        this.isMoving = false;
    }

    getDifficultyReactionTime() {
        switch (this.difficulty) {
            case 'easy': return 800 + Math.random() * 400; // 800-1200ms
            case 'medium': return 400 + Math.random() * 300; // 400-700ms 
            case 'hard': return 150 + Math.random() * 200; // 150-350ms
            default: return 500;
        }
    }

    update() {
        if (!this.alive) return;

        // Update position if moving between lanes
        if (this.isMoving) {
            const targetX = lanes[this.targetLane];
            const diff = targetX - this.x;
            this.x += diff * 0.2;
            if (Math.abs(diff) < 2) {
                this.x = targetX;
                this.lane = this.targetLane;
                this.isMoving = false;
            }
        }

        // AI decision making
        const now = Date.now();
        if (now - this.lastDecision > this.reactionTime) {
            this.makeDecision();
            this.lastDecision = now;
            this.reactionTime = this.getDifficultyReactionTime(); // Vary reaction time
        }

        // Update score (slightly different rate per bot)
        this.score += scoreMultiplier * (0.9 + Math.random() * 0.2);
    }

    makeDecision() {
        if (this.isMoving) return;

        // Look ahead for obstacles
        const dangerAhead = this.checkDangerInLane(this.lane);
        const leftSafe = this.lane > 0 ? this.checkDangerInLane(this.lane - 1) : false;
        const rightSafe = this.lane < 2 ? this.checkDangerInLane(this.lane + 1) : false;

        if (dangerAhead) {
            // Try to move to safer lane
            if (leftSafe && !rightSafe) {
                this.moveTo(this.lane - 1);
            } else if (rightSafe && !leftSafe) {
                this.moveTo(this.lane + 1);
            } else if (leftSafe && rightSafe) {
                // Both safe, choose randomly
                const direction = Math.random() < 0.5 ? -1 : 1;
                this.moveTo(this.lane + direction);
            }
            // If no safe lane, stay put and hope for the best
        } else {
            // Randomly move sometimes to make bots more dynamic
            if (Math.random() < 0.1) { // 10% chance to move randomly
                const possibleMoves = [];
                if (this.lane > 0) possibleMoves.push(this.lane - 1);
                if (this.lane < 2) possibleMoves.push(this.lane + 1);
                if (possibleMoves.length > 0) {
                    const randomLane = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    this.moveTo(randomLane);
                }
            }
        }
    }

    checkDangerInLane(lane) {
        const laneX = lanes[lane];
        return obstacles.some(obstacle => {
            const obstacleBottom = obstacle.y + obstacle.h;
            const obstacleTop = obstacle.y;
            const dangerZone = this.y - 150; // Look ahead distance

            return Math.abs(obstacle.x - laneX) < 30 &&
                obstacleBottom > dangerZone &&
                obstacleTop < this.y + this.h + 50;
        });
    }

    moveTo(newLane) {
        if (newLane >= 0 && newLane <= 2 && newLane !== this.lane) {
            this.targetLane = newLane;
            this.isMoving = true;
        }
    }

    checkCollision() {
        if (!this.alive) return false;

        return obstacles.some(obstacle => {
            return this.x < obstacle.x + obstacle.w &&
                this.x + this.w > obstacle.x &&
                this.y < obstacle.y + obstacle.h &&
                this.y + this.h > obstacle.y;
        });
    }

    draw() {
        if (!this.alive) return;

        // Bot body (slightly smaller than player)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 3, this.y + 3, this.w - 6, this.h - 6);

        // Bot outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 3, this.y + 3, this.w - 6, this.h - 6);

        // Bot "face" (simple eyes)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
    }
}

function initializeBots() {
    bots = [];
    const botConfigs = [
        { name: 'Bot Alpha', color: '#ff4444', difficulty: 'hard' },
        { name: 'Bot Beta', color: '#44ff44', difficulty: 'medium' },
        { name: 'Bot Gamma', color: '#4444ff', difficulty: 'medium' },
        { name: 'Bot Delta', color: '#ff44ff', difficulty: 'easy' }
    ];

    botConfigs.forEach((config, index) => {
        const bot = new Bot(config.name, config.color, config.difficulty);
        bot.y += (index - 1.5) * 15; // Spread bots vertically
        bots.push(bot);
    });
}

function updateMultiplayerRanking() {
    if (!isMultiplayer) return;

    const allPlayers = [
        { name: 'You', score: score, alive: player.lives > 0, isPlayer: true },
        ...bots.map(bot => ({ name: bot.name, score: bot.score, alive: bot.alive, isPlayer: false }))
    ];

    playerRanking = allPlayers.sort((a, b) => b.score - a.score);
}

function drawMultiplayerUI() {
    if (!isMultiplayer) return;

    // Draw ranking on the right side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - 180, 10, 170, 200);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🏆 Ranking', canvas.width - 170, 30);

    playerRanking.forEach((player, index) => {
        const y = 50 + index * 35;
        const color = player.alive ? (player.isPlayer ? '#ffff00' : '#ffffff') : '#666666';

        ctx.fillStyle = color;
        ctx.font = '14px Arial';

        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

        ctx.fillText(`${emoji} ${player.name}`, canvas.width - 170, y);
        ctx.fillText(`${Math.floor(player.score)}`, canvas.width - 170, y + 15);

        if (!player.alive) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '12px Arial';
            ctx.fillText('💀 OUT', canvas.width - 60, y + 8);
        }
    });
}

function saveProgress() {
    // Save to localStorage for backwards compatibility
    localStorage.setItem('subwayCoins', coins.toString());
    localStorage.setItem('subwayUpgrades', JSON.stringify(playerUpgrades));

    // Save to localStorage only (no cloud save)
    localStorage.setItem('subwayCoins', coins.toString());
    localStorage.setItem('subwayUpgrades', JSON.stringify(playerUpgrades));
}

function updateShopDisplay() {
    Object.keys(shopItems).forEach(item => {
        const shopItem = document.querySelector(`.shop-item[data-item="${item}"]`);
        const buyBtn = shopItem.querySelector('.buy-btn');

        if (playerUpgrades[item]) {
            shopItem.classList.add('owned');
            buyBtn.textContent = 'Eigendom';
            buyBtn.disabled = true;
        } else {
            const canAfford = coins >= shopItems[item].price;
            buyBtn.disabled = !canAfford;
            buyBtn.style.background = canAfford ? '#4CAF50' : '#666';
        }
    });
}

function buyItem(itemName) {
    const item = shopItems[itemName];
    if (coins >= item.price && !playerUpgrades[itemName]) {
        coins -= item.price;
        playerUpgrades[itemName] = true;
        saveProgress();
        updateCoinDisplay();
        updateShopDisplay();
        showNotification(`${item.name} gekocht! 🎉`, '#4ade80');
    }
}

// Event listeners voor shop
shopBtn.onclick = () => {
    startScreen.style.display = 'none';
    shopScreen.style.display = 'block';
    updateShopDisplay();
};

shopCloseBtn.onclick = () => {
    shopScreen.style.display = 'none';
    startScreen.style.display = 'block';
};

document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = (e) => {
        const item = e.target.getAttribute('data-item');
        buyItem(item);
    };
});

// Level definitions
const levels = [
    { id: 1, name: "Beginner Station", target: 1000, maxSpeed: 9, spawnRate: 0.02 },
    { id: 2, name: "City Junction", target: 2000, maxSpeed: 12, spawnRate: 0.025 },
    { id: 3, name: "Rush Hour", target: 3000, maxSpeed: 15, spawnRate: 0.03 },
    { id: 4, name: "Express Line", target: 4000, maxSpeed: 18, spawnRate: 0.035 },
    { id: 5, name: "Final Terminal", target: 5000, maxSpeed: 22, spawnRate: 0.04 }
];

function resetGame(mode = 'infinity') {
    console.log(`🔄 Resetting game for mode: ${mode}`);

    gameMode = mode;
    player.lane = 1;
    player.x = lanes[player.lane];
    player.y = 540;
    player.lives = playerUpgrades.shield ? 2 : 1;
    player.moveSpeed = 1;
    player.ghostCharges = 0;
    player.lastGhostScore = 0;

    console.log(`👤 Player reset to: x=${player.x}, y=${player.y}, lane=${player.lane}`);
    console.log(`🎮 Lanes available: ${JSON.stringify(lanes)}`);

    // Bepaal actieve skin
    if (playerUpgrades.rainbowSkin) player.activeSkin = 'rainbow';
    else if (playerUpgrades.tankSkin) player.activeSkin = 'tank';
    else if (playerUpgrades.ghostSkin) player.activeSkin = 'ghost';
    else if (playerUpgrades.speedSkin) player.activeSkin = 'speed';
    else if (playerUpgrades.goldenSkin) player.activeSkin = 'golden';
    else player.activeSkin = 'default';

    // Skin abilities toepassen
    if (player.activeSkin === 'speed' || player.activeSkin === 'rainbow') {
        player.moveSpeed = 1.5;
    }

    obstacles = [];
    score = 0;
    coinsThisRun = 0;
    currentLevel = 1;
    levelProgress = 0;
    difficultyLevel = 1;

    // Reset power-up systems
    activePowerUps = [];
    collectiblePowerUps = [];
    powerUpSpawnTimer = 0;
    particles = [];
    weatherParticles = [];

    // Random weather for variety
    const weatherTypes = ['normal', 'rain', 'snow', 'night', 'storm'];
    currentWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    lightningTimer = 0;

    // Multiplayer setup
    isMultiplayer = (mode === 'multiplayer');
    if (isMultiplayer) {
        initializeBots();
        multiplayerResults = null;
        console.log('🤖 Multiplayer mode: bots initialized');
    } else {
        bots = [];
        playerRanking = [];
        console.log(`🎯 Single player mode: ${mode}`);
    }

    // Reset shield system
    temporaryShield = false;
    shieldTimeLeft = 0;
    lastShieldScore = 0;

    // Snellere start
    if (gameMode === 'infinity') {
        speed = playerUpgrades.speed ? 8.5 : 7;
        baseSpeed = speed;
        console.log(`♾️ Infinity mode: speed set to ${speed}`);
    } else if (gameMode === 'level') {
        speed = levels[0].maxSpeed * (playerUpgrades.speed ? 0.8 : 0.7);
        baseSpeed = speed;
        levelTarget = levels[0].target;
        console.log(`🎯 Level mode: speed=${speed}, target=${levelTarget}`);
    } else {
        speed = playerUpgrades.speed ? 8.5 : 7;
        baseSpeed = speed;
        console.log(`🤖 Multiplayer mode: speed set to ${speed}`);
    }

    updateGameInfo();
    updateCoinDisplay();

    // Show weather notification
    const weatherEmojis = {
        'normal': '☀️',
        'rain': '🌧️',
        'snow': '❄️',
        'night': '🌙',
        'storm': '⛈️'
    };

    const weatherNames = {
        'normal': 'Clear Weather',
        'rain': 'Rainy Conditions',
        'snow': 'Snowy Weather',
        'night': 'Night Mode',
        'storm': 'Storm Warning'
    };

    setTimeout(() => {
        showNotification(`${weatherEmojis[currentWeather]} ${weatherNames[currentWeather]}`, 'info', 3000);
    }, 500);

    console.log('✅ Game reset complete!');
}
function updateGameInfo() {
    const currentThemeName = themes[currentTheme].name;

    if (gameMode === 'infinity') {
        modeDisplay.textContent = 'Mode: Infinity';
        levelDisplay.textContent = `Score: ${Math.floor(score)} | Theme: ${currentThemeName}`;
    } else if (gameMode === 'multiplayer') {
        modeDisplay.textContent = 'Mode: VS Bots (1v4)';
        levelDisplay.textContent = `Score: ${Math.floor(score)} | Theme: ${currentThemeName}`;
    } else {
        modeDisplay.textContent = `Mode: Level ${currentLevel}`;
        levelDisplay.textContent = `Progress: ${Math.floor(score)}/${levelTarget} | Theme: ${currentThemeName}`;
    }
}

function drawPlayer() {
    const { x, y, w, h } = player;
    const time = Date.now() * 0.01;

    // Skin-gebaseerde kleuren en effecten
    const gradient = ctx.createLinearGradient(x, y, x, y + h);

    switch (player.activeSkin) {
        case 'golden':
            gradient.addColorStop(0, '#FFE55C');
            gradient.addColorStop(0.3, '#FFD700');
            gradient.addColorStop(0.7, '#FFC107');
            gradient.addColorStop(1, '#FF8F00');
            break;
        case 'speed':
            // Blauwe speed skin
            gradient.addColorStop(0, '#00BFFF');
            gradient.addColorStop(0.3, '#1E90FF');
            gradient.addColorStop(0.7, '#0080FF');
            gradient.addColorStop(1, '#0066CC');
            break;
        case 'ghost':
            // Paarse ghost skin
            gradient.addColorStop(0, '#E6E6FA');
            gradient.addColorStop(0.3, '#DDA0DD');
            gradient.addColorStop(0.7, '#BA55D3');
            gradient.addColorStop(1, '#8B008B');
            break;
        case 'tank':
            // Groene tank skin
            gradient.addColorStop(0, '#90EE90');
            gradient.addColorStop(0.3, '#32CD32');
            gradient.addColorStop(0.7, '#228B22');
            gradient.addColorStop(1, '#006400');
            break;
        case 'rainbow':
            // Rainbow skin - kleur verandert over tijd
            const hue = (time * 50) % 360;
            const color1 = `hsl(${hue}, 100%, 70%)`;
            const color2 = `hsl(${(hue + 60) % 360}, 100%, 60%)`;
            const color3 = `hsl(${(hue + 120) % 360}, 100%, 50%)`;
            gradient.addColorStop(0, color1);
            gradient.addColorStop(0.5, color2);
            gradient.addColorStop(1, color3);
            break;
        default:
            // Normale geel/goud kleur
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.3, '#FFC107');
            gradient.addColorStop(0.7, '#FF9800');
            gradient.addColorStop(1, '#F57C00');
    }

    // Schaduw
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 3, y + 3, w, h);

    // Hoofdlichaam
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    // 3D effect - highlight
    const highlightOpacity = ['golden', 'rainbow'].includes(player.activeSkin) ? 0.6 : 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${highlightOpacity})`;
    ctx.fillRect(x + 2, y + 2, w - 4, 8);

    // Border kleur per skin
    let borderColor = '#E65100';
    switch (player.activeSkin) {
        case 'golden': borderColor = '#B8860B'; break;
        case 'speed': borderColor = '#0066CC'; break;
        case 'ghost': borderColor = '#8B008B'; break;
        case 'tank': borderColor = '#006400'; break;
        case 'rainbow': borderColor = `hsl(${(time * 100) % 360}, 100%, 30%)`; break;
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Ogen
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + 10, 4, 4);
    ctx.fillRect(x + 28, y + 10, 4, 4);

    // Skin speciale effecten
    if (player.activeSkin === 'speed' || player.activeSkin === 'rainbow') {
        // Speed trails
        ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
        ctx.fillRect(x - 10, y + 10, 8, 4);
        ctx.fillRect(x - 15, y + 20, 12, 4);
    }

    if (player.activeSkin === 'ghost' || player.activeSkin === 'rainbow') {
        // Ghost charges indicator
        ctx.fillStyle = '#BA55D3';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`👻${player.ghostCharges}`, x - 5, y - 5);
    }

    if (player.activeSkin === 'tank' || player.activeSkin === 'rainbow') {
        // Tank cannon
        ctx.fillStyle = borderColor;
        ctx.fillRect(x + w, y + h / 2 - 2, 8, 4);
    }

    // Shield indicator als speler permanent shield heeft
    if (player.lives > 1) {
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Tijdelijk schild indicator (1000 punten schild)
    if (temporaryShield && shieldTimeLeft > 0) {
        // Animatie effect - pulseren
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Schild timer tekst
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🛡️${Math.ceil(shieldTimeLeft)}s`, x + w / 2, y - 10);
        ctx.textAlign = 'left';
    }
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const { x, y, w, h } = obs;

        // Rode obstakel met gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#F44336');
        gradient.addColorStop(0.5, '#D32F2F');
        gradient.addColorStop(1, '#B71C1C');

        // Schaduw
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x + 2, y + 2, w, h);

        // Hoofdlichaam
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);

        // 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);

        // Donkere rand voor diepte
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + w - 3, y + 3, 3, h - 3);
        ctx.fillRect(x + 3, y + h - 3, w - 3, 3);

        // Border
        ctx.strokeStyle = '#8E0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Waarschuwingspatroon
        ctx.fillStyle = '#FFEB3B';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 5 + i * 10, y + 5, 3, 3);
            ctx.fillRect(x + 5 + i * 10, y + h - 8, 3, 3);
        }
    });
}

function drawLevelInfo() {
    if (gameMode === 'level') {
        const theme = themes[currentTheme];

        // Level name with theme colors
        ctx.fillStyle = theme.highlight;
        ctx.font = 'bold 16px Arial';
        const level = levels[currentLevel - 1];
        ctx.fillText(level.name, 10, canvas.height - 20);

        // Enhanced progress bar with animation
        drawLevelProgressBar();
    }
}

function drawLevelProgressBar() {
    const theme = themes[currentTheme];
    const barWidth = 250;
    const barHeight = 12;
    const barX = canvas.width - barWidth - 10;
    const barY = canvas.height - 30;

    // Calculate progress
    const progress = Math.min(score / levelTarget, 1);
    const animatedProgress = smoothStep(levelProgressBar.previousProgress, progress, 0.05);
    levelProgressBar.previousProgress = animatedProgress;

    // Background with theme colors
    const borderRadius = 6;
    ctx.fillStyle = darkenColor(theme.background, 30);
    roundRect(ctx, barX - 2, barY - 2, barWidth + 4, barHeight + 4, borderRadius);
    ctx.fill();

    // Progress bar background
    ctx.fillStyle = darkenColor(theme.primary, 20);
    roundRect(ctx, barX, barY, barWidth, barHeight, borderRadius - 1);
    ctx.fill();

    // Progress fill with gradient
    if (animatedProgress > 0) {
        const progressWidth = barWidth * animatedProgress;
        const gradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);

        // Dynamic colors based on progress
        if (progress >= 1) {
            // Complete - use highlight color
            gradient.addColorStop(0, theme.highlight);
            gradient.addColorStop(1, lightenColor(theme.highlight, 20));
        } else if (progress >= 0.75) {
            // Almost complete - green to highlight
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, theme.accent);
        } else if (progress >= 0.5) {
            // Half way - yellow to accent
            gradient.addColorStop(0, '#FFC107');
            gradient.addColorStop(1, theme.accent);
        } else {
            // Starting - red to secondary
            gradient.addColorStop(0, '#F44336');
            gradient.addColorStop(1, theme.secondary);
        }

        ctx.fillStyle = gradient;
        roundRect(ctx, barX, barY, progressWidth, barHeight, borderRadius - 1);
        ctx.fill();

        // Shimmer effect for completed progress
        if (progress >= 1 && levelProgressBar.shimmerOffset !== null) {
            const shimmerGradient = ctx.createLinearGradient(
                barX + levelProgressBar.shimmerOffset - 30, barY,
                barX + levelProgressBar.shimmerOffset + 30, barY
            );
            shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
            shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = shimmerGradient;
            roundRect(ctx, barX, barY, progressWidth, barHeight, borderRadius - 1);
            ctx.fill();

            // Update shimmer animation
            levelProgressBar.shimmerOffset += 3;
            if (levelProgressBar.shimmerOffset > barWidth + 60) {
                levelProgressBar.shimmerOffset = -60;
            }
        }
    }

    // Progress text with theme colors
    ctx.fillStyle = theme.highlight;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    const progressText = `${Math.floor(score)}/${levelTarget}`;
    ctx.fillText(progressText, barX + barWidth / 2, barY + barHeight + 15);

    // Percentage text
    ctx.font = '10px Arial';
    ctx.fillStyle = theme.secondary;
    const percentText = `${Math.floor(progress * 100)}%`;
    ctx.fillText(percentText, barX + barWidth / 2, barY - 8);

    ctx.textAlign = 'left'; // Reset alignment
}

// Helper function for smooth progress animation
function smoothStep(start, end, factor) {
    return start + (end - start) * factor;
}

// Helper function for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    obstacles.push({ x: lanes[lane], y: -60, w: 40, h: 40 });
}

function getDynamicSpawnRate() {
    // Super easy start, wordt geleidelijk moeilijker
    const baseRate = 0.005; // Zeer lage start rate
    const maxRate = 0.05;   // Maximum spawn rate

    // Difficulty increases every 500 points
    const difficultyMultiplier = Math.min(score / 500, 10);
    return Math.min(baseRate + (difficultyMultiplier * 0.005), maxRate);
}

function updateObstacles() {
    // Don't move obstacles if freeze is active
    if (!hasPowerUp('freeze')) {
        for (let obs of obstacles) {
            obs.y += speed;
        }
    }
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function handleTankCollision(obstacle) {
    if (player.activeSkin === 'tank' || player.activeSkin === 'rainbow') {
        // Tank destroys obstacles and gets coins
        coinsThisRun += 2;
        return true; // Obstacle destroyed
    }
    return false;
}

function handleGhostCollision() {
    if ((player.activeSkin === 'ghost' || player.activeSkin === 'rainbow') && player.ghostCharges > 0) {
        player.ghostCharges--;
        gameStats.ghostAbilityUses++;
        playSound('jump'); // Ghost phase sound
        createParticle(player.x + player.w / 2, player.y + player.h / 2, 'sparkle', '#BA55D3', 8);
        return true; // Phase through obstacle
    }
    return false;
}

function checkCollision() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (
            obs.x < player.x + player.w &&
            obs.x + obs.w > player.x &&
            obs.y < player.y + player.h &&
            obs.y + obs.h > player.y
        ) {
            // Check tank ability first
            if (handleTankCollision(obs)) {
                obstacles.splice(i, 1);
                continue;
            }

            // Check ghost ability
            if (handleGhostCollision()) {
                obstacles.splice(i, 1);
                continue;
            }

            return true; // Normal collision
        }
    }
    return false;
}

function updateGameLogic() {
    // Langzamere score toename
    score += scoreMultiplier;

    // Update bots in multiplayer mode
    if (isMultiplayer) {
        bots.forEach(bot => {
            if (bot.alive) {
                bot.update();

                // Check bot collision
                if (bot.checkCollision()) {
                    bot.alive = false;
                    showNotification(`${bot.name} is uitgeschakeld! 💀`, '#ff4444');
                }
            }
        });

        updateMultiplayerRanking();

        // Check if player won/lost
        const aliveBots = bots.filter(bot => bot.alive).length;
        if (player.lives <= 0 || aliveBots === 0) {
            // Game over or player won
            setTimeout(() => {
                let message;
                if (player.lives <= 0) {
                    const playerPosition = playerRanking.findIndex(p => p.isPlayer) + 1;
                    message = `Game Over! Je eindigde op positie ${playerPosition}/5\nJe score: ${Math.floor(score)}`;
                } else {
                    message = `🎉 VICTORY! 🎉\nJe hebt alle bots verslagen!\nJe score: ${Math.floor(score)}`;
                }
                showNotification(message, '#f59e0b');
            }, 100);
        }
    }

    // Update ghost charges elke 500 punten
    if ((player.activeSkin === 'ghost' || player.activeSkin === 'rainbow')) {
        const currentFiveHundred = Math.floor(score / 500);
        const lastFiveHundred = Math.floor(player.lastGhostScore / 500);

        if (currentFiveHundred > lastFiveHundred) {
            player.ghostCharges++;
            player.lastGhostScore = score;
        }
    }

    // Check voor 1000 punten schild
    const currentThousand = Math.floor(score / 1000);
    const lastThousand = Math.floor(lastShieldScore / 1000);

    if (currentThousand > lastThousand) {
        // Nieuwe 1000 punten bereikt - activeer schild!
        temporaryShield = true;
        shieldTimeLeft = 10; // 10 seconden
        lastShieldScore = score;

        // Visual feedback
        setTimeout(() => {
            showNotification(`🛡️ SCHILD GEACTIVEERD! 🛡️\n10 seconden bescherming!`, '#fbbf24');
        }, 100);
    }

    // Update schild timer
    if (temporaryShield && shieldTimeLeft > 0) {
        shieldTimeLeft -= 1 / 60; // Verminderen per frame (60fps)
        if (shieldTimeLeft <= 0) {
            temporaryShield = false;
            shieldTimeLeft = 0;
        }
    }

    // Coins verdienen (golden skin geeft bonus)
    const newCoins = Math.floor(score / 100) - Math.floor((score - scoreMultiplier) / 100);
    if (newCoins > 0) {
        let coinMultiplier = playerUpgrades.magnet ? 2 : 1;
        if (player.activeSkin === 'golden' || player.activeSkin === 'rainbow') {
            coinMultiplier *= 1.25; // 25% bonus
        }
        const earnedCoins = newCoins * coinMultiplier;
        coinsThisRun += earnedCoins;
        gameStats.totalCoinsCollected += earnedCoins;

        // Create coin particles
        createParticle(player.x + player.w / 2, player.y, 'coin', '#FFD700', 3);
        playSound('coin');
    }

    // Power-up spawning
    powerUpSpawnTimer++;
    if (powerUpSpawnTimer > 900 && Math.random() < 0.003) { // Every 15 seconds chance
        const lane = Math.floor(Math.random() * 3);
        const powerUpTypes = ['speedBoost', 'coinMagnet', 'jumpBoost', 'freeze', 'starPower'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

        collectiblePowerUps.push(new PowerUp(lanes[lane], -50, randomType));
        powerUpSpawnTimer = 0;
    }

    // Update power-ups
    collectiblePowerUps = collectiblePowerUps.filter(powerUp => {
        const alive = powerUp.update();
        if (alive) {
            powerUp.draw();

            // Check collision with player
            if (powerUp.checkCollision(player) && !powerUp.collected) {
                powerUp.collected = true;
                activatePowerUp(powerUp.type);
                gameStats.powerUpsCollected++;
                playSound('powerup');
                createParticle(powerUp.x + powerUp.w / 2, powerUp.y + powerUp.h / 2, 'sparkle', '#FFFFFF', 8);
                return false;
            }
        }
        return alive;
    });

    // Update active power-ups
    activePowerUps = activePowerUps.filter(powerUp => {
        powerUp.duration--;
        return powerUp.duration > 0;
    });

    // Weather effects
    if (currentWeather === 'storm') {
        lightningTimer++;
        if (lightningTimer > 120 && Math.random() < 0.02) { // Random lightning
            lightningTimer = 0;
            // Lightning effect will be drawn in drawBackground
        }
    }

    // Progressive difficulty system
    const oldDifficulty = difficultyLevel;
    difficultyLevel = Math.floor(score / 250) + 1; // Difficulty increases every 250 points

    if (difficultyLevel > oldDifficulty) {
        setTimeout(() => {
            showNotification(`🔥 DIFFICULTY LEVEL ${difficultyLevel}! 🔥\nThings are getting harder!`, '#f97316');
        }, 100);
    }

    if (gameMode === 'infinity') {
        // Progressive speed increase - starts very slow
        const speedIncrease = Math.min(difficultyLevel * 0.3, 8); // Max 8 extra speed
        speed = baseSpeed + speedIncrease;
    } else {
        // Level mode: check for level completion
        if (score >= levelTarget && currentLevel < levels.length) {
            // Level completed!
            currentLevel++;
            const newLevel = levels[currentLevel - 1];
            speed = newLevel.maxSpeed * (playerUpgrades.speed ? 0.4 : 0.3);
            baseSpeed = speed;
            levelTarget = newLevel.target;

            // Brief pause and notification
            setTimeout(() => {
                showNotification(`Level ${currentLevel - 1} Complete!\nEntering: ${newLevel.name}`, '#8b5cf6');
            }, 100);
        } else if (score >= levelTarget && currentLevel >= levels.length) {
            // Game completed!
            gameRunning = false;
            setTimeout(() => {
                coins += coinsThisRun;
                saveProgress();
                showNotification(`🎉 GAME COMPLETED! 🎉\nYou finished all levels!\nFinal Score: ${Math.floor(score)}\nCoins Earned: ${coinsThisRun} 🪙`, '#f59e0b');
                backToMenu();
            }, 100);
            return;
        }

        // Gradually increase speed within level
        const level = levels[currentLevel - 1];
        const levelProgress = (score - (currentLevel > 1 ? levels[currentLevel - 2].target : 0)) /
            (levelTarget - (currentLevel > 1 ? levels[currentLevel - 2].target : 0));
        speed = baseSpeed + (level.maxSpeed - baseSpeed) * levelProgress;
    }

    updateGameInfo();
    updateCoinDisplay();
    checkAchievements();

    // Save stats periodically
    if (Math.floor(score) % 100 === 0) {
        localStorage.setItem('subwayStats', JSON.stringify(gameStats));
    }
} function getSpawnRate() {
    if (gameMode === 'infinity') {
        return 0.03;
    } else {
        return levels[currentLevel - 1].spawnRate;
    }
}

function activatePowerUp(type) {
    switch (type) {
        case 'speedBoost':
            activePowerUps.push({ type: 'speedBoost', duration: 300 });
            showNotification('⚡ SPEED BOOST ACTIVATED!', 'success', 2000);
            break;
        case 'coinMagnet':
            activePowerUps.push({ type: 'coinMagnet', duration: 480 });
            showNotification('🧲 COIN MAGNET ACTIVATED!', 'success', 2000);
            break;
        case 'jumpBoost':
            // Instantly jump over next obstacle
            const nextObstacle = obstacles.find(obs => obs.y > player.y - 100 && obs.y < player.y + 50);
            if (nextObstacle) {
                obstacles = obstacles.filter(obs => obs !== nextObstacle);
                createParticle(nextObstacle.x + nextObstacle.w / 2, nextObstacle.y + nextObstacle.h / 2, 'sparkle', '#32CD32', 10);
            }
            showNotification('🦘 JUMPED OVER OBSTACLE!', 'success', 2000);
            break;
        case 'freeze':
            activePowerUps.push({ type: 'freeze', duration: 180 });
            showNotification('❄️ TIME FREEZE ACTIVATED!', 'success', 2000);
            break;
        case 'starPower':
            activePowerUps.push({ type: 'starPower', duration: 300 });
            showNotification('🌟 STAR POWER ACTIVATED!', 'success', 2000);
            break;
    }
}

function hasPowerUp(type) {
    return activePowerUps.some(powerUp => powerUp.type === type);
}

function drawPowerUpIndicators() {
    let yOffset = 50;
    activePowerUps.forEach(powerUp => {
        const timeLeft = Math.ceil(powerUp.duration / 60);

        let icon = '';
        let color = '#fff';
        switch (powerUp.type) {
            case 'speedBoost': icon = '⚡'; color = '#00BFFF'; break;
            case 'coinMagnet': icon = '🧲'; color = '#FFD700'; break;
            case 'freeze': icon = '❄️'; color = '#87CEEB'; break;
            case 'starPower': icon = '🌟'; color = '#FF6347'; break;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, yOffset, 80, 25);

        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.fillText(`${icon} ${timeLeft}s`, 15, yOffset + 18);

        yOffset += 30;
    });
}

function drawBackground() {
    // Get current theme colors
    const theme = themes[currentTheme];

    // Fix theme color access
    const themeColors = {
        background: theme.colors.primary,
        primary: theme.colors.secondary,
        secondary: theme.colors.accent,
        accent: theme.colors.rail,
        highlight: theme.colors.accent
    };

    // Always ensure canvas has a background - clear first
    ctx.fillStyle = themeColors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Theme and weather-based background colors
    let bgGradient;

    // Combine theme colors with weather effects
    switch (currentWeather) {
        case 'rain':
            bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, darkenColor(themeColors.primary, 20));
            bgGradient.addColorStop(0.5, themeColors.background);
            bgGradient.addColorStop(1, darkenColor(themeColors.background, 30));
            break;
        case 'snow':
            bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, lightenColor(themeColors.background, 20));
            bgGradient.addColorStop(0.5, themeColors.primary);
            bgGradient.addColorStop(1, themeColors.background);
            break;
        case 'night':
            bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, darkenColor(themeColors.background, 40));
            bgGradient.addColorStop(0.5, darkenColor(themeColors.primary, 30));
            bgGradient.addColorStop(1, darkenColor(themeColors.accent, 20));
            break;
        case 'storm':
            bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, themeColors.background);
            bgGradient.addColorStop(0.5, darkenColor(themeColors.background, 40));
            bgGradient.addColorStop(1, darkenColor(themeColors.background, 50));

            // Lightning effect
            if (lightningTimer === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            break;
        default: // normal
            bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, themeColors.background);
            bgGradient.addColorStop(0.5, themeColors.primary);
            bgGradient.addColorStop(1, themeColors.background);
    }

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tekenen van de drie railsporen met thema kleuren
    for (let i = 0; i < 3; i++) {
        const laneCenter = lanes[i] + 20; // Center van elke lane

        // Rail lijnen met thema kleur
        ctx.strokeStyle = currentWeather === 'night' ? darkenColor(themeColors.secondary, 20) : themeColors.secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laneCenter - 15, 0);
        ctx.lineTo(laneCenter - 15, canvas.height);
        ctx.moveTo(laneCenter + 15, 0);
        ctx.lineTo(laneCenter + 15, canvas.height);
        ctx.stroke();

        // Dwarsliggers (railroad ties) met thema accent
        ctx.fillStyle = currentWeather === 'snow' ? lightenColor(themeColors.accent, 10) : themeColors.accent;
        for (let y = -20; y < canvas.height + 20; y += 40) {
            const offsetY = (y + score * 2) % (canvas.height + 40) - 20;
            ctx.fillRect(laneCenter - 18, offsetY, 36, 6);
        }

        // Rail glans effect met thema highlight
        const railGloss = currentWeather === 'night' ?
            `rgba(150, 150, 150, 0.6)` :
            `rgba(200, 200, 200, 0.8)`;
        ctx.strokeStyle = railGloss;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(laneCenter - 14, 0);
        ctx.lineTo(laneCenter - 14, canvas.height);
        ctx.moveTo(laneCenter + 14, 0);
        ctx.lineTo(laneCenter + 14, canvas.height);
        ctx.stroke();
    }

    // Tunnel muren met thema kleuren
    const wallColor = currentWeather === 'night' ? darkenColor(themeColors.background, 50) : darkenColor(themeColors.primary, 30);
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, 100, canvas.height); // Links
    ctx.fillRect(380, 0, 100, canvas.height); // Rechts

    // Tunnel verlichting effect
    const lightIntensity = currentWeather === 'night' ? 0.05 : 0.1;
    const lightGradient = ctx.createRadialGradient(240, 100, 0, 240, 100, 200);
    lightGradient.addColorStop(0, `rgba(255, 255, 255, ${lightIntensity})`);
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw weather particles
    updateWeatherParticles();
}

function gameLoop() {
    // Ensure canvas always has background
    if (!ctx) {
        console.error('Canvas context not available');
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Draw bots first (behind player)
    if (isMultiplayer) {
        bots.forEach(bot => bot.draw());
    }

    drawPlayer();
    drawObstacles();
    drawLevelInfo();

    // Draw multiplayer UI
    if (isMultiplayer) {
        drawMultiplayerUI();
    }

    // Draw power-up indicators
    drawPowerUpIndicators();

    updateObstacles();

    // Power-ups affect obstacle movement
    const freezeActive = hasPowerUp('freeze');
    if (!freezeActive && Math.random() < getDynamicSpawnRate()) {
        spawnObstacle();
    }

    updateGameLogic();

    // Update and draw particles
    updateParticles();

    // Check collisions with star power protection
    if (checkCollision() && !hasPowerUp('starPower')) {
        if (temporaryShield && shieldTimeLeft > 0) {
            // Tijdelijk schild absorbeert hit
            temporaryShield = false;
            shieldTimeLeft = 0;
            playSound('shield');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'sparkle', '#FFD700', 15);
            // Remove colliding obstacle
            obstacles = obstacles.filter(obs => {
                return !(obs.x < player.x + player.w &&
                    obs.x + obs.w > player.x &&
                    obs.y < player.y + player.h &&
                    obs.y + obs.h > player.y);
            });
        } else if (player.lives > 1) {
            // Permanent shield absorbs hit
            player.lives--;
            playSound('shield');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'sparkle', '#00BFFF', 12);
            // Remove colliding obstacle
            obstacles = obstacles.filter(obs => {
                return !(obs.x < player.x + player.w &&
                    obs.x + obs.w > player.x &&
                    obs.y < player.y + player.h &&
                    obs.y + obs.h > player.y);
            });
        } else {
            // Game over
            gameRunning = false;
            playSound('crash');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'explosion', '#FF4444', 25);

            setTimeout(() => {
                coins += coinsThisRun;
                gameStats.totalCoinsCollected += coinsThisRun;

                // Update survival time
                const survivalTime = score / (60 * scoreMultiplier);
                if (survivalTime > gameStats.longestSurvival) {
                    gameStats.longestSurvival = survivalTime;
                }

                saveProgress();
                localStorage.setItem('subwayStats', JSON.stringify(gameStats));

                let message = `Game Over!\nScore: ${Math.floor(score)}\nCoins Earned: ${coinsThisRun} 🪙`;
                if (gameMode === 'level') {
                    message += `\nReached Level: ${currentLevel}`;
                } else if (gameMode === 'infinity') {
                    message += `\nSurvival Time: ${Math.floor(survivalTime)}s`;
                }
                showNotification(message, 'info');
                backToMenu();
            }, 100);
            return;
        }
    }

    // Draw notifications
    drawNotifications();

    if (gameRunning) requestAnimationFrame(gameLoop);
}

function backToMenu() {
    startScreen.style.display = 'block';
    canvas.style.display = 'none';
    gameInfo.style.display = 'none';

    // Hide mobile controls
    if (isMobile) {
        hideMobileControls();
        // Reset canvas size
        canvas.style.width = '';
        canvas.style.height = '';
    }

    // Restore body flex layout for menu
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
}

document.addEventListener('keydown', e => {
    console.log('🔍 Key pressed:', e.key, 'Game running:', gameRunning, 'Game mode:', gameMode);

    // Als het spel niet loopt en Enter wordt ingedrukt, start infinity mode
    if (!gameRunning && e.key === 'Enter') {
        startGame('infinity');
        return;
    }

    // Theme switching met T toets (werkt altijd)
    if (e.key.toLowerCase() === 't') {
        switchToNextTheme();
        return;
    }

    // Movement works in all modes when game is running
    if (gameRunning) {
        if (e.key === 'ArrowLeft' && player.lane > 0) {
            player.lane--;
            // Instant snelle movement voor iedereen
            player.x = lanes[player.lane];
            playSound('jump');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);
            console.log('👈 Moved left to lane:', player.lane);
        }
        if (e.key === 'ArrowRight' && player.lane < 2) {
            player.lane++;
            // Instant snelle movement voor iedereen
            player.x = lanes[player.lane];
            playSound('jump');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);
            console.log('👉 Moved right to lane:', player.lane);
        }
    }

    // Debug shortcuts (work when not in game)
    if (!gameRunning) {
        if (e.key.toLowerCase() === 'l') {
            console.log('🎯 Starting Level mode via L key');
            startGame('level');
        }
        if (e.key.toLowerCase() === 'm') {
            console.log('🤖 Starting Multiplayer mode via M key');
            startGame('multiplayer');
        }
    }
});

// Mobile Touch Controls
function initTouchControls() {
    // Touch events for canvas (swipe controls)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Prevent default touch behaviors
    canvas.addEventListener('touchstart', e => e.preventDefault());
    canvas.addEventListener('touchmove', e => e.preventDefault());
    canvas.addEventListener('touchend', e => e.preventDefault());
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    lastTouchTime = Date.now();
}

function handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling
}

function handleTouchEnd(e) {
    if (!gameRunning) return;

    const touch = e.changedTouches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const touchDuration = Date.now() - lastTouchTime;

    // Detect swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > touchSensitivity) {
        if (deltaX > 0 && player.lane < 2) {
            // Swipe right
            player.lane++;
            player.x = lanes[player.lane];
            playSound('jump');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);
        } else if (deltaX < 0 && player.lane > 0) {
            // Swipe left
            player.lane--;
            player.x = lanes[player.lane];
            playSound('jump');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);
        }
    }
    // Swipe up for theme switching
    else if (deltaY < -50 && Math.abs(deltaX) < 30) {
        switchToNextTheme();
    }
    // Tap for power-up activation (if available)
    else if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30 && touchDuration < 300) {
        // Quick tap - could be used for power-ups in the future
        activateNextPowerUp();
    }
}

function activateNextPowerUp() {
    // Find the next available power-up that can be manually activated
    const manualPowerUps = ['jumpBoost', 'freeze', 'coinRain'];
    const availablePowerUp = collectiblePowerUps.find(powerUp =>
        manualPowerUps.includes(powerUp.type) && !powerUp.collected
    );

    if (availablePowerUp) {
        availablePowerUp.collected = true;
        activatePowerUp(availablePowerUp.type);
        collectiblePowerUps = collectiblePowerUps.filter(p => p !== availablePowerUp);
    }
}

// Mobile UI Controls
function createMobileControls() {
    if (!isMobile) return;

    // Create mobile control overlay
    const mobileControlsDiv = document.createElement('div');
    mobileControlsDiv.id = 'mobile-controls';
    mobileControlsDiv.innerHTML = `
        <div class="mobile-control-panel">
            <button id="mobile-left" class="mobile-btn mobile-arrow">←</button>
            <button id="mobile-pause" class="mobile-btn mobile-center">⏸️</button>
            <button id="mobile-right" class="mobile-btn mobile-arrow">→</button>
        </div>
        <div class="mobile-info">
            <div class="mobile-hint">👆 Swipe left/right to move | ⬆️ Swipe up for themes</div>
        </div>
    `;

    document.body.appendChild(mobileControlsDiv);

    // Add event listeners
    document.getElementById('mobile-left').addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameRunning && player.lane > 0) {
            player.lane--;
            player.x = lanes[player.lane];
            playSound('jump');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);
        }
    });

    document.getElementById('mobile-right').addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameRunning && player.lane < 2) {
            player.lane++;
            player.x = lanes[player.lane];
            playSound('jump');
            createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);
        }
    });

    document.getElementById('mobile-pause').addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameRunning) {
            // Pause functionality
            gameRunning = false;
            showNotification('Game Paused\nTap to continue', 'info', 10000);
        } else if (canvas.style.display !== 'none') {
            gameRunning = true;
            requestAnimationFrame(gameLoop);
        }
    });
}

function showMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = 'flex';
    }
}

function hideMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = 'none';
    }
}

// ================================
// CLEAN BUTTON SYSTEM - WORKING
// ================================

// GLOBAL startGame function - CLEAN VERSION
window.startGame = function (mode = 'infinity') {
    console.log(`🚀 Starting game in ${mode} mode...`);

    try {
        // FORCE STOP ANY RUNNING GAME
        if (gameRunning) {
            gameRunning = false;
            console.log('🛑 Stopped previous game');
        }

        // CALL INTERNAL FUNCTION
        return startGameInternal(mode);

    } catch (error) {
        console.error('❌ BUTTON ERROR:', error);
        alert(`Game Error: ${error.message}`);
        return false;
    }
};

// INTERNAL GAME STARTER
function startGameInternal(mode = 'infinity') {
    console.log(`🎯 Internal start: ${mode} mode...`);
    console.log('🔧 Game state before start:', { gameRunning, gameMode, playerLane: player.lane });

    resetGame(mode);

    const startScreen = document.getElementById('start-screen');
    const canvas = document.getElementById('game-canvas');
    const gameInfo = document.getElementById('game-info');

    console.log('🔍 Elements found:', {
        startScreen: !!startScreen,
        canvas: !!canvas,
        gameInfo: !!gameInfo
    });

    if (startScreen) startScreen.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    if (gameInfo) gameInfo.style.display = 'block';

    // Center the game canvas
    document.body.style.display = 'block';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';

    // Show mobile controls if on mobile device
    if (isMobile) {
        showMobileControls();
        // Make canvas responsive
        adjustCanvasForMobile();
    }

    gameRunning = true;
    console.log('✅ Game started successfully:', { gameRunning, gameMode, mode });
    console.log('👤 Player position:', { x: player.x, y: player.y, lane: player.lane });
    console.log('🎮 Lanes:', lanes);

    requestAnimationFrame(gameLoop);
}

function adjustCanvasForMobile() {
    if (!isMobile) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate optimal canvas size for mobile
    const maxWidth = Math.min(screenWidth * 0.9, 480);
    const maxHeight = Math.min(screenHeight * 0.7, 640);

    // Maintain aspect ratio
    const aspectRatio = 480 / 640;
    let newWidth, newHeight;

    if (maxWidth / maxHeight > aspectRatio) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatio;
    }

    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';

    // Update touch sensitivity based on canvas size
    touchSensitivity = Math.max(30, newWidth * 0.1);
}

// Initialize canvas background on load
document.addEventListener('DOMContentLoaded', () => {
    // Skip authentication system - go directly to main game
    // Initialize as guest user
    coins = parseInt(localStorage.getItem('subwayCoins') || '0');
    playerUpgrades = JSON.parse(localStorage.getItem('subwayUpgrades') || '{}');

    // Show start screen directly
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'block';
    }

    // Event listeners for gamemode buttons
    const infinityBtn = document.getElementById('infinity-btn');
    const levelBtn = document.getElementById('level-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');

    console.log('🔍 Button debug:', {
        infinityBtn: !!infinityBtn,
        levelBtn: !!levelBtn,
        multiplayerBtn: !!multiplayerBtn,
        startScreen: !!startScreen
    });

    // Force wait for DOM to be fully ready
    setTimeout(() => {
        const infinityBtn2 = document.getElementById('infinity-btn');
        const levelBtn2 = document.getElementById('level-btn');
        const multiplayerBtn2 = document.getElementById('multiplayer-btn');

        console.log('🔍 Second check - Buttons found:', {
            infinityBtn2: !!infinityBtn2,
            levelBtn2: !!levelBtn2,
            multiplayerBtn2: !!multiplayerBtn2
        });

        // FIXED EVENT LISTENERS FOR BUTTONS
        if (infinityBtn2) {
            infinityBtn2.addEventListener('click', function () {
                console.log('🎮 Infinity button clicked via addEventListener!');
                window.startGame('infinity');
            });
            console.log('✅ Infinity button listener added');
        }

        if (levelBtn2) {
            levelBtn2.addEventListener('click', function () {
                console.log('🎮 Level button clicked via addEventListener!');
                window.startGame('level');
            });
            console.log('✅ Level button listener added');
        }

        if (multiplayerBtn2) {
            multiplayerBtn2.addEventListener('click', function () {
                console.log('🎮 Multiplayer button clicked via addEventListener!');
                window.startGame('multiplayer');
            });
            console.log('✅ Multiplayer button listener added');
        }
    }, 100);

    if (infinityBtn) {
        infinityBtn.onclick = () => {
            console.log('🎮 Infinity button clicked!');
            startGame('infinity');
        };
        console.log('✅ Infinity button listener attached');
    } else {
        console.error('❌ Infinity button not found!');
    }

    if (levelBtn) {
        levelBtn.onclick = () => {
            console.log('🎯 Level button clicked!');
            startGame('level');
        };
        console.log('✅ Level button listener attached');
    } else {
        console.error('❌ Level button not found!');
    }

    if (multiplayerBtn) {
        multiplayerBtn.onclick = () => {
            console.log('🤖 Multiplayer button clicked!');
            startGame('multiplayer');
        };
        console.log('✅ Multiplayer button listener attached');
    } else {
        console.error('❌ Multiplayer button not found!');
    }

    // EMERGENCY BUTTON FIX - Direct attachment
    console.log('🚨 EMERGENCY BUTTON FIX STARTING...');

    const buttonIds = ['infinity-btn', 'level-btn', 'multiplayer-btn'];

    buttonIds.forEach(buttonId => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            console.log(`✅ Found button: ${buttonId}`);

            // Remove any existing listeners
            btn.onclick = null;

            // Add new direct listener
            btn.onclick = function (e) {
                e.preventDefault();
                console.log(`🚀 BUTTON CLICKED: ${buttonId}`);

                const mode = buttonId.replace('-btn', '');
                console.log(`Starting game in ${mode} mode`);
                startGame(mode);
            };

            console.log(`🎯 Emergency listener attached to ${buttonId}`);
        } else {
            console.error(`❌ Button not found: ${buttonId}`);
        }
    });

    console.log('🚨 EMERGENCY BUTTON FIX COMPLETE');

    // Additional backup button detection
    document.querySelectorAll('.mode-btn').forEach((btn, index) => {
        console.log(`🔍 Mode button ${index}:`, btn.id, btn.textContent);

        btn.addEventListener('click', function (e) {
            console.log('🎯 Mode button clicked:', btn.id);

            switch (btn.id) {
                case 'infinity-btn':
                    console.log('Starting infinity mode...');
                    startGame('infinity');
                    break;
                case 'level-btn':
                    console.log('Starting level mode...');
                    startGame('level');
                    break;
                case 'multiplayer-btn':
                    console.log('Starting multiplayer mode...');
                    startGame('multiplayer');
                    break;
                default:
                    console.log('Unknown button:', btn.id);
            }
        });
    });

    // Set initial canvas background
    if (canvas && ctx) {
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawBackground();
    }

    // Update log functionality
    const showUpdatesBtn = document.getElementById('show-updates');
    const updateLog = document.getElementById('update-log');
    const closeUpdatesBtn = document.getElementById('close-updates');

    showUpdatesBtn.onclick = () => {
        updateLog.classList.add('active');
    };

    closeUpdatesBtn.onclick = () => {
        updateLog.classList.remove('active');
    };

    // Settings functionality
    const settingsBtn = document.getElementById('settings-btn');
    const settingsScreen = document.getElementById('settings-screen');
    const settingsCloseBtn = document.getElementById('settings-close-btn');

    settingsBtn.onclick = () => {
        settingsScreen.style.display = 'block';
        updateSettingsDisplay();
        updateStatsDisplay();
        updateAchievementsDisplay();
    };

    settingsCloseBtn.onclick = () => {
        settingsScreen.style.display = 'none';
    };

    // Audio controls
    const masterVolumeSlider = document.getElementById('master-volume');
    const effectsVolumeSlider = document.getElementById('effects-volume');
    const musicVolumeSlider = document.getElementById('music-volume');
    const muteToggle = document.getElementById('mute-toggle');

    masterVolumeSlider.oninput = () => {
        const value = masterVolumeSlider.value;
        document.getElementById('master-volume-value').textContent = value + '%';
        effectsVolume = (value / 100) * 0.5;
        musicVolume = (value / 100) * 0.3;
        localStorage.setItem('subwayMasterVolume', value);
    };

    effectsVolumeSlider.oninput = () => {
        const value = effectsVolumeSlider.value;
        document.getElementById('effects-volume-value').textContent = value + '%';
        effectsVolume = value / 100;
        localStorage.setItem('subwayEffectsVolume', value);
        playSound('coin'); // Test sound
    };

    musicVolumeSlider.oninput = () => {
        const value = musicVolumeSlider.value;
        document.getElementById('music-volume-value').textContent = value + '%';
        musicVolume = value / 100;
        localStorage.setItem('subwayMusicVolume', value);
    };

    muteToggle.onchange = () => {
        isMuted = muteToggle.checked;
        localStorage.setItem('subwayMuted', isMuted);
    };

    // Gameplay toggles
    const particlesToggle = document.getElementById('particles-toggle');
    const weatherToggle = document.getElementById('weather-toggle');
    const shakeToggle = document.getElementById('shake-toggle');

    particlesToggle.onchange = () => {
        localStorage.setItem('subwayParticles', particlesToggle.checked);
    };

    weatherToggle.onchange = () => {
        localStorage.setItem('subwayWeather', weatherToggle.checked);
        if (!weatherToggle.checked) {
            currentWeather = 'normal';
            weatherParticles = [];
        }
    };

    shakeToggle.onchange = () => {
        localStorage.setItem('subwayScreenShake', shakeToggle.checked);
    };

    function updateSettingsDisplay() {
        // Load saved settings
        masterVolumeSlider.value = localStorage.getItem('subwayMasterVolume') || 50;
        effectsVolumeSlider.value = localStorage.getItem('subwayEffectsVolume') || 70;
        musicVolumeSlider.value = localStorage.getItem('subwayMusicVolume') || 30;
        muteToggle.checked = localStorage.getItem('subwayMuted') === 'true';

        particlesToggle.checked = localStorage.getItem('subwayParticles') !== 'false';
        weatherToggle.checked = localStorage.getItem('subwayWeather') !== 'false';
        shakeToggle.checked = localStorage.getItem('subwayScreenShake') !== 'false';

        // Update display values
        document.getElementById('master-volume-value').textContent = masterVolumeSlider.value + '%';
        document.getElementById('effects-volume-value').textContent = effectsVolumeSlider.value + '%';
        document.getElementById('music-volume-value').textContent = musicVolumeSlider.value + '%';

        // Apply settings
        effectsVolume = effectsVolumeSlider.value / 100;
        musicVolume = musicVolumeSlider.value / 100;
        isMuted = muteToggle.checked;
    }

    function updateStatsDisplay() {
        document.getElementById('total-coins-stat').textContent = gameStats.totalCoinsCollected || 0;
        document.getElementById('ghost-uses-stat').textContent = gameStats.ghostAbilityUses || 0;
        document.getElementById('powerups-stat').textContent = gameStats.powerUpsCollected || 0;
        document.getElementById('survival-stat').textContent = Math.floor(gameStats.longestSurvival || 0) + 's';
    }

    function updateAchievementsDisplay() {
        const achievementsListElement = document.getElementById('achievements-list');
        achievementsListElement.innerHTML = '';

        Object.keys(achievementsList).forEach(key => {
            const achievement = achievementsList[key];
            const isUnlocked = achievements[key] || false;

            const achievementDiv = document.createElement('div');
            achievementDiv.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            let progress = '';
            if (!isUnlocked) {
                let current = 0;
                switch (key) {
                    case 'speedDemon': current = Math.floor(Math.max(gameStats.infinityBest || 0)); break;
                    case 'ghostMaster': current = gameStats.ghostAbilityUses || 0; break;
                    case 'coinCollector': current = gameStats.totalCoinsCollected || 0; break;
                    case 'botSlayer': current = gameStats.multiplayerWins || 0; break;
                    case 'survivor': current = Math.floor(gameStats.longestSurvival || 0); break;
                    case 'powerUser': current = gameStats.powerUpsCollected || 0; break;
                }
                progress = `<div class="achievement-progress">${current}/${achievement.requirement}</div>`;
            }

            achievementDiv.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${progress}
            `;

            achievementsListElement.appendChild(achievementDiv);
        });
    }

    // Shop tabs functionality
    const shopTabs = document.querySelectorAll('.shop-tab');
    const shopTabContents = document.querySelectorAll('.shop-tab-content');

    shopTabs.forEach(tab => {
        tab.onclick = () => {
            // Remove active from all tabs
            shopTabs.forEach(t => t.classList.remove('active'));
            shopTabContents.forEach(content => content.classList.remove('active'));

            // Add active to clicked tab
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        };
    });

    // Ad system
    const watchAdBtn = document.getElementById('watch-ad-btn');
    const adModal = document.getElementById('ad-modal');
    const adCloseBtn = document.getElementById('ad-close-btn');
    const adClaimBtn = document.getElementById('ad-claim-btn');
    const adCountdown = document.getElementById('ad-countdown');
    let adTimer = null;

    watchAdBtn.onclick = () => {
        adModal.style.display = 'flex';
        startAdTimer();
    };

    adCloseBtn.onclick = () => {
        adModal.style.display = 'none';
        if (adTimer) clearInterval(adTimer);
    };

    adClaimBtn.onclick = () => {
        coins += 10;
        coinsThisRun += 10;
        saveProgress();
        updateCoinDisplay();
        showNotification('🎉 +10 Coins verdiend! 🎉', '#4ade80');
        adModal.style.display = 'none';

        // Cooldown van 30 seconden
        watchAdBtn.disabled = true;
        watchAdBtn.textContent = 'Wacht...';
        setTimeout(() => {
            watchAdBtn.disabled = false;
            watchAdBtn.textContent = 'Bekijk Ad';
        }, 30000);
    };

    function startAdTimer() {
        let countdown = 5;
        adCountdown.textContent = countdown;
        adClaimBtn.disabled = true;

        adTimer = setInterval(() => {
            countdown--;
            adCountdown.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(adTimer);
                adClaimBtn.disabled = false;
                adClaimBtn.textContent = 'Claim 10 Coins! 🎉';
            }
        }, 1000);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) {
            if (e.key === 'l' || e.key === 'L') {
                startGame('level');
            } else if (e.key === 'm' || e.key === 'M') {
                startGame('multiplayer');
            }
        }
    });

    // Update active outfit display
    function updateActiveOutfitDisplay() {
        const activeOutfitSpan = document.getElementById('active-outfit');
        const skinNames = {
            'default': 'Default',
            'golden': 'Golden',
            'speed': 'Speed',
            'ghost': 'Ghost',
            'tank': 'Tank',
            'rainbow': 'Rainbow',
            'neon': 'Neon'
        };
        activeOutfitSpan.textContent = skinNames[player.activeSkin] || 'Default';
    }

    // Stats tracking
    let gameStats = JSON.parse(localStorage.getItem('subwayStats') || '{}');
    if (!gameStats.infinityBest) gameStats.infinityBest = 0;
    if (!gameStats.levelProgress) gameStats.levelProgress = 1;
    if (!gameStats.multiplayerWins) gameStats.multiplayerWins = 0;

    function updateStatsDisplay() {
        document.getElementById('infinity-best').textContent = Math.floor(gameStats.infinityBest);
        document.getElementById('level-progress').textContent = gameStats.levelProgress;
        document.getElementById('multiplayer-wins').textContent = gameStats.multiplayerWins;
    }

    function updateStats(mode, score, won = false) {
        if (mode === 'infinity' && score > gameStats.infinityBest) {
            gameStats.infinityBest = score;
        } else if (mode === 'level' && currentLevel > gameStats.levelProgress) {
            gameStats.levelProgress = currentLevel;
        } else if (mode === 'multiplayer' && won) {
            gameStats.multiplayerWins++;
        }
        localStorage.setItem('subwayStats', JSON.stringify(gameStats));
        updateStatsDisplay();
    }

    // Extend the existing resetGame to update outfit display
    const originalResetGame = resetGame;
    resetGame = function (mode = 'infinity') {
        originalResetGame(mode);
        updateActiveOutfitDisplay();
    };

    // Initialize settings
    updateSettingsDisplay();

    // Initialize displays
    updateStatsDisplay();
    updateActiveOutfitDisplay();

    // Load initial settings
    effectsVolume = (localStorage.getItem('subwayEffectsVolume') || 70) / 100;
    musicVolume = (localStorage.getItem('subwayMusicVolume') || 30) / 100;
    isMuted = localStorage.getItem('subwayMuted') === 'true';

    // Initialize mobile controls
    if (isMobile) {
        initTouchControls();
        createMobileControls();

        // Add mobile-specific instructions
        document.querySelector('.quick-controls p').innerHTML =
            '📱 <strong>Mobile:</strong> Swipe left/right to move | Swipe up for themes | Tap for power-ups<br>' +
            '⌨️ <strong>Desktop:</strong> Arrow keys to move | T for themes | Enter/L/M for game modes';
    }

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (gameRunning && isMobile) {
                adjustCanvasForMobile();
            }
        }, 500);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (gameRunning && isMobile) {
            adjustCanvasForMobile();
        }
    });
});// Add new items to shop
const newShopItems = {
    ...shopItems,
    neonSkin: { price: 400, name: "Neon Racer" },
    doubleJump: { price: 75, name: "Double Jump" },
    timeSlower: { price: 120, name: "Time Slower" },
    coinRain: { price: 90, name: "Coin Rain" },
    megaShield: { price: 200, name: "Mega Shield" }
};

// Initialize coin display and shop
updateCoinDisplay();
updateShopDisplay();

// Theme System Functions
function switchToNextTheme() {
    const themeNames = Object.keys(themes);
    const currentIndex = themeNames.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    const nextTheme = themeNames[nextIndex];

    // Check if theme is unlocked
    if (isThemeUnlocked(nextTheme)) {
        currentTheme = nextTheme;
        localStorage.setItem('currentTheme', currentTheme);

        // Show theme change notification
        showNotification(`Thema gewijzigd naar: ${themes[currentTheme].name}`, themes[currentTheme].primary);
        playSound('powerup'); // Use existing sound
    } else {
        const requirement = themes[nextTheme].unlockRequirement;
        showNotification(`Thema vergrendeld! Vereist: ${requirement}`, '#FF6B6B');
    }
}

function isThemeUnlocked(themeName) {
    if (themeName === 'subway') return true; // Default theme always unlocked

    const theme = themes[themeName];
    const requirement = theme.unlockRequirement;

    // Check different unlock requirements
    if (requirement.includes('Score')) {
        const requiredScore = parseInt(requirement.match(/\d+/)[0]);
        return highScore >= requiredScore;
    } else if (requirement.includes('Level')) {
        const requiredLevel = parseInt(requirement.match(/\d+/)[0]);
        return maxLevelReached >= requiredLevel;
    } else if (requirement.includes('coins')) {
        const requiredCoins = parseInt(requirement.match(/\d+/)[0]);
        return totalCoins >= requiredCoins;
    }

    return false;
}

function showNotification(message, color = '#4CAF50') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('gameNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'gameNotification';
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 2px solid ${color};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.style.borderColor = color;
    notification.style.opacity = '1';

    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// Color Manipulation Functions
function lightenColor(color, percent) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;

    const factor = percent / 100;
    return `rgb(${Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * factor))}, 
                ${Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * factor))}, 
                ${Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * factor))})`;
}

function darkenColor(color, percent) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;

    const factor = percent / 100;
    return `rgb(${Math.floor(rgb.r * (1 - factor))}, 
                ${Math.floor(rgb.g * (1 - factor))}, 
                ${Math.floor(rgb.b * (1 - factor))})`;
}

function hexToRgb(hex) {
    // Handle rgb() format
    if (hex && hex.startsWith('rgb')) {
        const matches = hex.match(/\d+/g);
        return matches ? {
            r: parseInt(matches[0]),
            g: parseInt(matches[1]),
            b: parseInt(matches[2])
        } : { r: 255, g: 255, b: 255 };
    }

    // Handle hex format
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

// Load saved theme on game start
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('currentTheme');
    if (savedTheme && themes[savedTheme] && isThemeUnlocked(savedTheme)) {
        currentTheme = savedTheme;
    }

    // Initialize shimmer effect for progress bar
    if (gameMode === 'level') {
        levelProgressBar.shimmerOffset = -60;
    }
}

// Call on game initialization
loadSavedTheme();
