const http = require('http');

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function createSuperAdmin() {
  console.log('----- CREATING SUPER ADMIN -----');

  const adminRes = await makeRequest('/api/auth/register', 'POST', {
    name: 'Global Administrator',
    email: 'admin@app.com',
    password: 'superpassword123',
    role: 'SuperAdmin',
  });

  if (adminRes.status === 201) {
    console.log('\n✅ SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('-------------------------------------------');
    console.log('Email: admin@app.com');
    console.log('Password: superpassword123');
    console.log('-------------------------------------------');
  } else {
    console.log('\n⚠️ Failed to create Super Admin:', adminRes.data);
  }
}

createSuperAdmin();
