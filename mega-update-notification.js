const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1290669345946185819/0z_BHdjrvbC-0oUE8xRCqk3qIhxoE26ozMl2reFXLdrd4vNF8W5ISLS1-NIJ6LZfkFKu';

const payload = {
    embeds: [{
        title: "🚀 MEGA UPDATE v1.8.0 RELEASED!",
        description: "The biggest Game Hub update yet is now LIVE with revolutionary features!",
        color: 0x00ff00,
        fields: [
            {
                name: "🎮 NEW GAME: Racing Arena",
                value: "• High-speed racing with AI opponents\n• 3-lap championship races\n• Boost system & performance tracking\n• Mobile touch controls included",
                inline: false
            },
            {
                name: "📱 Progressive Web App (PWA)",
                value: "• Install Game Hub as native app\n• Offline gameplay support\n• Push notifications\n• App shortcuts for each game",
                inline: false
            },
            {
                name: "🎁 Daily Login Rewards",
                value: "• Earn coins every day you login\n• Streak bonuses up to +500 coins\n• Auto-detection and notifications\n• Persistent streak tracking",
                inline: false
            },
            {
                name: "🌙 Dark/Light Theme Toggle",
                value: "• Switch between themes instantly\n• Persistent theme preferences\n• Optimized for both modes\n• Better accessibility",
                inline: false
            },
            {
                name: "💎 Premium Currency System",
                value: "• New Gems currency introduced\n• Earn through achievements\n• Special rewards and bonuses\n• Cross-game progression",
                inline: false
            },
            {
                name: "🎯 Daily Challenges",
                value: "• 4 different challenge types\n• Play games, earn rewards\n• Progressive difficulty\n• Gem rewards for completion",
                inline: false
            },
            {
                name: "📸 Screenshot & Sharing",
                value: "• Take and save screenshots\n• Share stats on social media\n• Generate achievement cards\n• Export your progress",
                inline: false
            }
        ],
        footer: {
            text: "Game Hub Development Team • Play now at gtstijn.space"
        },
        timestamp: new Date().toISOString()
    }]
};

const data = JSON.stringify(payload);

const url = new URL(webhookUrl);
const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    if (res.statusCode === 204) {
        console.log('✅ MEGA UPDATE notification sent to Discord successfully! 🎉');
    } else {
        console.log('❌ Failed to send notification');
    }
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();