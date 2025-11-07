import mongoose from "mongoose";

const { Schema, model } = mongoose;

const complaintSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    Complaint_image: {
        type: String,
        default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // reference to user who submitted the complaint
      required: true,
    },
  },
  { timestamps: true }
);

const Complaint = model("Complaint", complaintSchema);

export default Complaint;
