const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const JoinSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    aadharNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    candidate_mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    image: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Join = model('Join', JoinSchema);
module.exports = Join;
