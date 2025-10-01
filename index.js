export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Helper: hash password with SHA-256
        async function hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            // Convert buffer to hex string
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Leaderboard GET
        if (request.method === 'GET' && url.pathname === '/leaderboard') {
            const list = await env.KV.list({ prefix: 'score:' });
            const scores = [];
            for (const key of list.keys) {
                const value = await env.KV.get(key.name, { type: 'json' });
                scores.push(value);
            }
            scores.sort((a, b) => b.totalScore - a.totalScore);
            return new Response(JSON.stringify(scores.slice(0, 20)), { headers: { 'Content-Type': 'application/json' } });
        }

        // Leaderboard POST
        if (request.method === 'POST' && url.pathname === '/leaderboard') {
            const { username, score, game } = await request.json();
            const key = `score:${username}`;
            let entry = await env.KV.get(key, { type: 'json' });
            if (entry) {
                entry.totalScore += score;
            } else {
                entry = { username, totalScore: score, game };
            }
            await env.KV.put(key, JSON.stringify(entry));
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }

        // Register endpoint
        if (request.method === 'POST' && url.pathname === '/register') {
            const { username, password } = await request.json();
            const userKey = `user:${username}`;
            const existing = await env.KV.get(userKey, { type: 'json' });
            if (existing) {
                return new Response(JSON.stringify({ error: 'Username already exists' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            const hashedPassword = await hashPassword(password);
            const user = {
                username,
                password: hashedPassword,
                registeredAt: new Date().toISOString(),
                gamesPlayed: 0,
                totalScore: 0
            };
            await env.KV.put(userKey, JSON.stringify(user));
            return new Response(JSON.stringify({ user }), { headers: { 'Content-Type': 'application/json' } });
        }

        // Login endpoint
        if (request.method === 'POST' && url.pathname === '/login') {
            const { username, password } = await request.json();
            const userKey = `user:${username}`;
            const user = await env.KV.get(userKey, { type: 'json' });
            const hashedPassword = await hashPassword(password);
            if (!user || user.password !== hashedPassword) {
                return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
            user.lastLogin = new Date().toISOString();
            await env.KV.put(userKey, JSON.stringify(user));
            return new Response(JSON.stringify({ user }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response('Not found', { status: 404 });
    }
};
