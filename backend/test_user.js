const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');

async function test() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  
  try {
    const user = await User.create({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('User created:', user.name);
  } catch (err) {
    console.error('ERROR:', err.message);
    if(err.stack) console.error(err.stack.split('\n')[0]);
  }
  
  process.exit(0);
}

test();
