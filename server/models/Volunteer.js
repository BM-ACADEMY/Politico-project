const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward", // ✅ References the Ward model
      required: true,
    },

    localities: {
      type: [String], // ✅ Array of locality names
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    //   match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ Reference to Admin or whoever created it
      required: true,
    },
  },
  { timestamps: true }
);

const Volunteer = mongoose.model("Volunteer", volunteerSchema);

module.exports = Volunteer;
