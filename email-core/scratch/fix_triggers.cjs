const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/emailcore_dev');
  console.log('Connected to DB');

  const TriggerSetting = mongoose.model('TriggerSetting', new mongoose.Schema({
    triggerType: String,
    senderId: mongoose.Schema.Types.ObjectId,
    routeId: String,
    active: Boolean
  }));

  const jak25Id = '69ff2c36c495d1e717b49461';
  const jak25RouteId = '69ff2c36c495d1e717b49462';

  const res1 = await TriggerSetting.updateOne(
    { triggerType: 'WELCOME' },
    { $set: { senderId: jak25Id, routeId: jak25RouteId, active: true } },
    { upsert: true }
  );
  console.log('Welcome update:', res1);

  const res2 = await TriggerSetting.updateOne(
    { triggerType: 'VERIFICATION' },
    { $set: { senderId: jak25Id, routeId: jak25RouteId, active: true } },
    { upsert: true }
  );
  console.log('Verification update:', res2);

  const final = await TriggerSetting.find().lean();
  console.log('Final Settings:', JSON.stringify(final, null, 2));

  process.exit();
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
