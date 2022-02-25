exports.redis = redis = require('redis');
exports.client = client = redis.createClient(process.env.REDIS_PORT, '127.0.0.1'); // this creates a new client

client.on('connect', function () {
    console.log('Redis client connected');
});
// echo redis errors to the console
client.on('error', (err) => {
    console.log("Error on redis" + err)
});
