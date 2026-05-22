import mongoose from 'mongoose';

const TestIdSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true
  },
  label: { type: String, default: 'Global Test ID' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const TestId = mongoose.models.TestId || mongoose.model('TestId', TestIdSchema);
export default TestId;
