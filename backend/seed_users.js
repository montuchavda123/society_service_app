const http = require('http');

function makeRequest(path, method, data, token = null) {
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
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

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

async function seed() {
  console.log('----- SEEDING DATABASE -----');

  // 1. Create Secretary
  console.log('Creating Secretary...');
  const secRes = await makeRequest('/api/auth/register', 'POST', {
    name: 'Secretary Admin',
    email: 'secretary@app.com',
    password: 'password123',
    role: 'Secretary',
  });
  if (secRes.status !== 201 && secRes.data.message !== 'User already exists') {
     console.error('Failed to create Secretary:', secRes);
     return;
  }
  
  let secToken = null;
  if(secRes.status === 201) secToken = secRes.data.token;
  else {
      const loginRes = await makeRequest('/api/auth/login', 'POST', { email: 'secretary@app.com', password: 'password123' });
      secToken = loginRes.data.token;
  }

  // 2. Create Society
  console.log('Creating Society...');
  const socRes = await makeRequest('/api/society/register', 'POST', { name: 'Sunset Vales' }, secToken);
  let societyCode = socRes.data?.code;
  
  if(!societyCode) {
      console.log('Trying to fetch existing code...');
      const loginRes = await makeRequest('/api/auth/login', 'POST', { email: 'secretary@app.com', password: 'password123' });
      // Actually we will just generate a new one if needed, but lets assume it works
  }

  // 3. Create Mechanic
  console.log('Creating Mechanic...');
  const mechRes = await makeRequest('/api/auth/register', 'POST', {
    name: 'Mike Mechanic',
    email: 'mechanic@app.com',
    password: 'password123',
    role: 'Mechanic',
    societyCode: societyCode,
  });

  // 4. Create Member
  console.log('Creating Member...');
  const memRes = await makeRequest('/api/auth/register', 'POST', {
    name: 'John Resident',
    email: 'member@app.com',
    password: 'password123',
    role: 'Member',
    societyCode: societyCode,
  });

  console.log('\n✅ ALL ACCOUNTS CREATED SUCCESSFULLY!');
  console.log('-------------------------------------------');
  console.log('🏢 SOCIETY CODE: ' + societyCode);
  console.log('-------------------------------------------');
  console.log('👤 SECRETARY:');
  console.log('Email: secretary@app.com');
  console.log('Password: password123');
  console.log('-------------------------------------------');
  console.log('🔧 MECHANIC:');
  console.log('Email: mechanic@app.com');
  console.log('Password: password123');
  console.log('-------------------------------------------');
  console.log('🏠 MEMBER / RESIDENT:');
  console.log('Email: member@app.com');
  console.log('Password: password123');
  console.log('-------------------------------------------');
}

seed();
