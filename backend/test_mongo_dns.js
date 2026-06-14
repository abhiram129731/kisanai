const mongoose = require('mongoose');
const dns = require('dns');

const MONGODB_URI = 'mongodb+srv://kisanai_admin:Abhi%40123@firstcluster.spyqpb3.mongodb.net/kisanai?retryWrites=true&w=majority&appName=FirstCluster';

async function testWithDnsOrder(order) {
  if (order) {
    dns.setDefaultResultOrder(order);
    console.log(`\nTesting connection with dns.setDefaultResultOrder('${order}')...`);
  } else {
    console.log(`\nTesting connection with default DNS result order...`);
  }

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`SUCCESS: Connected to MongoDB Atlas with ${order || 'default'} order!`);
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
    console.log('\nResult: Connection succeeded in at least one DNS configuration.');
  } else {
    console.log('\nResult: All DNS configurations failed.');
  }
  process.exit(0);
}

run();
