// Updated models/Task.js - Added 'event' field to reference Event
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    task_title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // References the Event model
      required: true, // Made required as per frontend validation
    },
    assign_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer", // References the Volunteer model
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to Admin or creator
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;