const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    phone: { type: String, required: true, maxlength: 20 },
    email: { type: String, required: true, unique: true, maxlength: 100 },
    photo: { type: String, default: "" }, // store uploaded image URL or path
    password: { type: String, required: true, maxlength: 255 },
    party: { type: mongoose.Schema.Types.ObjectId, ref: "Party", required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dob: { type: Date, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ✅ Hash password before saving
candidateSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password method
candidateSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Candidate", candidateSchema);
