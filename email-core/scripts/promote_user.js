import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/emailcore_dev');
  
  // Use existing model if defined, else define it
  let User;
  try {
    User = mongoose.model('User');
  } catch {
    User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
  }
  
  await User.updateOne(
    { email: 'trirakesh19949@gmail.com' },
    { $set: { role: '69feee904636efebdb9bbf02' } }
  );
  
  console.log('✅ trirakesh19949@gmail.com PROMOTED TO SUPER ADMIN');
  process.exit();
}

run();
