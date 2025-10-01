const https = require('https');

const webhookData = {
    content: "🚀 **MEGA UPDATE v1.8.0 IS LIVE!**\n\n🎮 **NEW GAME:** Racing Arena - High-speed racing action!\n📱 **PWA Support** - Install as native app!\n🎁 **Daily Rewards** - Login bonuses & streaks!\n🌙 **Theme Toggle** - Dark/Light mode switch!\n💎 **Premium Currency** - New Gems system!\n🎯 **Daily Challenges** - Complete tasks for rewards!\n📸 **Screenshot Sharing** - Share your achievements!\n\nPlay now at **gtstijn.space** 🌐"
};

const postData = JSON.stringify(webhookData);

const options = {
    hostname: 'discord.com',
    port: 443,
    path: '/api/webhooks/1290669345946185819/0z_BHdjrvbC-0oUE8xRCqk3qIhxoE26ozMl2reFXLdrd4vNF8W5ISLS1-NIJ6LZfkFKu',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    if (res.statusCode === 204) {
        console.log('✅ MEGA UPDATE Discord notification sent successfully! 🎉');
    } else {
        console.log(`❌ Failed: Status ${res.statusCode}`);
    }
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.write(postData);
req.end();