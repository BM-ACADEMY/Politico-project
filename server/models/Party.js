// models/Party.js
const mongoose = require("mongoose");

const partySchema = new mongoose.Schema(
  {
    parties_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    logo: {
      type: String, // URL or path to logo image
      default: "",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to the User model
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // automatically add createdAt and updatedAt fields
  }
);

const Party = mongoose.model("Party", partySchema);

module.exports = Party;
