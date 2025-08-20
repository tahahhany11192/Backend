const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['instapay', 'vodafone_cash', 'etisalat_cash', 'orange_cash', 'telda'], required: true },
  walletId: { type: String, required: true }, // the account/username they send to
  screenshotUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  processedAt: Date,
  rejectionReason: String
});

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
