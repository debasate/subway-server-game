// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

class GameHubAPI {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Get authorization headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Handle API responses
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    }

    // Register new user
    async register(username, password, email = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password, email })
            });

            const data = await this.handleResponse(response);

            // Store token and user data
            this.setToken(data.token);
            this.user = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });

            const data = await this.handleResponse(response);

            // Store token and user data
            this.setToken(data.token);
            this.user = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Get user profile
    async getProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            return data.user;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    // Save game data
    async saveGameData(gameName, gameData) {
        try {
            const response = await fetch(`${API_BASE_URL}/game/save`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ gameName, gameData })
            });

            const data = await this.handleResponse(response);
            return data;
        } catch (error) {
            console.error('Save game data error:', error);
            // Fallback to localStorage if server is down
            localStorage.setItem(`gameData_${this.user?.id}_${gameName}`, JSON.stringify(gameData));
            console.log('Saved to localStorage as fallback');
        }
    }

    // Load game data
    async loadGameData(gameName) {
        try {
            const response = await fetch(`${API_BASE_URL}/game/load/${gameName}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            return data.gameData;
        } catch (error) {
            console.error('Load game data error:', error);
            // Fallback to localStorage if server is down
            const fallbackData = localStorage.getItem(`gameData_${this.user?.id}_${gameName}`);
            if (fallbackData) {
                console.log('Loaded from localStorage as fallback');
                return JSON.parse(fallbackData);
            }
            return null;
        }
    }

    // Get all user games
    async getUserGames() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/games`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            return data.games;
        } catch (error) {
            console.error('Get user games error:', error);
            throw error;
        }
    }

    // Logout user
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!(this.token && this.user);
    }

    // Check server connection
    async checkConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.warn('Server connection check failed:', error);
            return false;
        }
    }
}

// Global API instance
window.gameHubAPI = new GameHubAPI();