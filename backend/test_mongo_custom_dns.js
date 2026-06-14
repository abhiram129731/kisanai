const mongoose = require('mongoose');
const dns = require('dns');

// Configure Node to use Google and Cloudflare DNS to bypass local broken DNS proxies
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = 'mongodb+srv://kisanai_admin:Abhi%40123@firstcluster.spyqpb3.mongodb.net/kisanai?retryWrites=true&w=majority&appName=FirstCluster';

console.log('Attempting to connect to MongoDB Atlas using Custom DNS (8.8.8.8)...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB Atlas using custom Google DNS resolver!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Connection failed:', err.message);
    process.exit(1);
  });
