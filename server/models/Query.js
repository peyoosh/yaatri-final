const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = anonymous
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      // Canonical going forward (snake_case tokens for the marketplace evolution).
      // Legacy human-readable values retained so existing rows still validate.
      enum: ['bug_report', 'suggestion', 'account_issue', 'Report Issue', 'Suggestion', 'General Feedback'],
      default: 'suggestion',
    },
    message: { type: String, required: true, maxlength: 4000 },

    // Server-rendered "mail template" snapshot — stored for admin dashboard inspection
    // without needing an actual SMTP delivery pipeline.
    mailRendered: { type: String, default: '' },

    // Support-team workflow fields. `assignedTo` indicates which tier currently owns
    // the ticket; admin can flip `isEscalated` for high-priority items and set
    // `assignedTo: 'admin'` to claim ownership directly.
    assignedTo: {
      type: String,
      enum: ['support', 'admin'],
      default: 'support',
    },
    isEscalated: { type: Boolean, default: false },

    status: {
      type: String,
      // Canonical going forward: 'pending' (newly received), 'open' (under work),
      // 'escalated' (admin-only), 'closed'.
      // Legacy values kept valid so the existing dashboard filter pills don't break.
      enum: ['pending', 'open', 'escalated', 'closed', 'new', 'in_progress', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Query', QuerySchema);
