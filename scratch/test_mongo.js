const mongoose = require('mongoose');

// Fixed URI: removed angle brackets and URL-encoded '@' in password to '%40'
const MONGODB_URI = 'mongodb+srv://kisanai_admin:Abhi%40123@firstcluster.spyqpb3.mongodb.net/kisanai?retryWrites=true&w=majority&appName=FirstCluster';

console.log('Attempting to connect to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB Atlas successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Connection failed:', err.message);
    process.exit(1);
  });
