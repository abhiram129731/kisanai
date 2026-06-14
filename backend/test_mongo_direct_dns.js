const mongoose = require('mongoose');
const dns = require('dns');

// Direct non-srv connection string
const MONGODB_URI = 'mongodb://kisanai_admin:Abhi%40123@ac-ks2djtw-shard-00-00.spyqpb3.mongodb.net:27017,ac-ks2djtw-shard-00-01.spyqpb3.mongodb.net:27017,ac-ks2djtw-shard-00-02.spyqpb3.mongodb.net:27017/kisanai?ssl=true&replicaSet=atlas-s56828-shard-0&authSource=admin&retryWrites=true&w=majority';

async function testWithDnsOrder(order) {
  if (order) {
    dns.setDefaultResultOrder(order);
    console.log(`\nTesting direct connection with dns.setDefaultResultOrder('${order}')...`);
  } else {
    console.log(`\nTesting direct connection with default DNS result order...`);
  }

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`SUCCESS: Connected to MongoDB Atlas directly with ${order || 'default'} order!`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(`FAILURE: Connection failed with ${order || 'default'} order:`, err.message);
    return false;
  }
}

async function run() {
  const success1 = await testWithDnsOrder('ipv4first');
  const success2 = await testWithDnsOrder('verbatim');
  const success3 = await testWithDnsOrder();
  
  if (success1 || success2 || success3) {
    console.log('\nResult: Connection succeeded in at least one configuration.');
  } else {
    console.log('\nResult: All configurations failed.');
  }
  process.exit(0);
}

run();
