const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true, // URL or Cloudinary path
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // references the User who created it
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
