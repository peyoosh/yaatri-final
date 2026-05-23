const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = anonymous
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['Report Issue', 'Suggestion', 'General Feedback'],
      default: 'General Feedback',
    },
    message: { type: String, required: true, maxlength: 4000 },

    // Server-rendered "mail template" snapshot — stored for admin dashboard inspection
    // without needing an actual SMTP delivery pipeline.
    mailRendered: { type: String, default: '' },

    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'dismissed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Query', QuerySchema);
