const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Using connection string:', MONGODB_URI);
console.log('Connecting...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Successfully connected to the production MongoDB Atlas cluster!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Could not connect to MongoDB Atlas. Error:', err.message);
    process.exit(1);
  });
