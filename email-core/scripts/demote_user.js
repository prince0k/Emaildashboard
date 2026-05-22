import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/emailcore_dev');
  
  const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
  const Role = mongoose.model('Role', new mongoose.Schema({ name: String, permissions: Array }));

  // 1. Demote user
  await User.updateOne(
    { email: 'trirakesh19949@gmail.com' },
    { $set: { role: '69feee904636efebdb9bbf03' } } // Mailer ID
  );

  // 2. Strip Mailer role of all permissions
  await Role.updateOne(
    { _id: '69feee904636efebdb9bbf03' },
    { $set: { permissions: [] } }
  );
  
  console.log('✅ trirakesh19949@gmail.com demoted to MAILER (Zero Permissions)');
  process.exit();
}

run();
