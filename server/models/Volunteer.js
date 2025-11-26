// models/Volunteer.js  ← UPDATE THIS FILE
const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: "Ward", required: true },
    localities: { type: [String], required: true },
    phoneNumber: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ADD THIS LINE — THIS IS THE FIX
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Volunteer", volunteerSchema);