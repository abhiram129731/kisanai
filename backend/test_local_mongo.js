const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/kisanai';

console.log('Attempting to connect to Local MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Connected to Local MongoDB successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Connection failed:', err.message);
    process.exit(1);
  });
