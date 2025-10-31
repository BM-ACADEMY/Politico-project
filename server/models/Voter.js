// models/voterModel.js (Updated Schema)
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  house_no: { type: String, required: true },
  locality: { type: String, required: true },
  street: {
    type: String,
    required: true,
  },
  city: { type: String, required: true },
  postal_code: { type: String, required: true },
});

const voterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fathers_name: { type: String, required: true },
    dob: { type: Date },
    phone: { type: String, required: true, unique: true },
    voter_id: { type: String, required: true, unique: true },
    voter_image: { type: String, required: true },
    aadhar_number: { type: String, required: true, unique: true },
    aadhar_image: { type: String, required: true },

    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    },

    address: { type: addressSchema, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Added created_by
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voter", voterSchema);