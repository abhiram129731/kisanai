const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

if (dns.setServers) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Attempting to drop index email_1 on users collection...');
    try {
      await mongoose.connection.collection('users').dropIndex('email_1');
      console.log('Index email_1 dropped successfully!');
    } catch (err) {
      console.log('Failed or index already dropped:', err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
