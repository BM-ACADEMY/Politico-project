const mongoose = require("mongoose");

const addressDetailsSchema = new mongoose.Schema({
  locality: { type: String, required: true },
  street: { type: String, required: true },
  postal_code: { type: String, required: true },
});

const wardSchema = new mongoose.Schema(
  {
    ward_name: { type: String, required: true },
    ward_number: { type: Number, required: true, unique: true },
    candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true }, // ← REQUIRED
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    population: { type: Number, required: true },
    localities: [{ type: String }],
    address_details: [addressDetailsSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ward", wardSchema);