const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kisanai_admin:Abhi%40123@firstcluster.spyqpb3.mongodb.net/kisanai?retryWrites=true&w=majority&appName=FirstCluster';

console.log('Attempting to connect to MongoDB Atlas (SRV)...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB Atlas via SRV!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Connection failed:', err.message);
    process.exit(1);
  });
