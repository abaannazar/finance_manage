import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true},
  note: { type: String },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', transactionSchema);
