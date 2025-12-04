// Quick script to initialize and seed the database
const http = require('http');

const postData = JSON.stringify({ seed: true });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/init-db',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ Database initialized and seeded successfully!');
      } else {
        console.log('❌ Error:', result.error);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.log('\nMake sure the dev server is running (npm run dev)');
});

req.write(postData);
req.end();
