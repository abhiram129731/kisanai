const mongoose = require('mongoose');

// Direct non-srv connection string pointing to the three Atlas nodes
const MONGODB_URI = 'mongodb://kisanai_admin:Abhi%40123@ac-ks2djtw-shard-00-00.spyqpb3.mongodb.net:27017,ac-ks2djtw-shard-00-01.spyqpb3.mongodb.net:27017,ac-ks2djtw-shard-00-02.spyqpb3.mongodb.net:27017/kisanai?ssl=true&replicaSet=atlas-s56828-shard-0&authSource=admin&retryWrites=true&w=majority';

console.log('Attempting to connect to MongoDB Atlas (Direct Nodes)...');
mongoose.connect(MONGODB_URI, { family: 4 })
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB Atlas directly!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Connection failed:', err.message);
    process.exit(1);
  });
