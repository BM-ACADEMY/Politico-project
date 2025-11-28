// Updated controllers/taskController.js - Added duplicate check in createTask
const Task = require("../models/Task");
const Volunteer = require("../models/Volunteer");
const User = require("../models/usermodel");
const Role = require("../models/role");
const Event = require("../models/Eventmodel"); // Added import for Event
const fs = require("fs");
const path = require("path");

const createTask = async (req, res) => {
  try {
    const { task_title, description, assign_to, event } = req.body; // Added event

    // Validate required fields
    if (!task_title || !description || !assign_to || !event) {
      return res.status(400).json({ message: "Task title, description, assignee, and event are required." });
    }

    // Validate assignee (Volunteer exists)
    const volunteer = await Volunteer.findById(assign_to).populate("ward", "ward_name ward_number");
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found." });
    }

    // Validate event (Event exists and is scheduled/ongoing)
    const validEvent = await Event.findById(event);
    if (!validEvent || !['scheduled', 'ongoing'].includes(validEvent.status)) {
      return res.status(400).json({ message: "Valid scheduled or ongoing event is required." });
    }

    // Check for duplicate task: same title, assigned to same volunteer, for same event, and pending status
    const existingTask = await Task.findOne({
      task_title,
      assign_to,
      event,
      status: 'pending'
    });
    if (existingTask) {
      return res.status(409).json({ 
        message: "A pending task with this title is already assigned to this volunteer for the selected event." 
      });
    }

    // Role-based access: Only admins or creators can assign tasks to their volunteers
    const userWithRole = await User.findById(req.user.id).populate("role_id", "name");
    const isAdmin = userWithRole && userWithRole.role_id.name === "admin";
    if (!isAdmin && volunteer.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only assign tasks to your volunteers." });
    }

    // Create Task
    const newTask = await Task.create({
      task_title,
      description,
      event, // Added event
      assign_to,
      created_by: req.user.id,
    });

    // Populate response with nested ward and expanded event fields
    await newTask.populate([
      { 
        path: 'assign_to',
        populate: { path: 'ward', select: 'ward_name ward_number' },
        select: 'name email ward localities'
      },
      { path: 'created_by', select: 'name email' },
      { 
        path: 'event', 
        select: 'eventTitle date time status venue eventType targetAttendance description' // Expanded for modal
      }
    ]);

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    // Base filter for pending tasks
    let filter = { status: "pending" };

    // Role-based filtering: Admins see all, others see only their assigned/created tasks
    const userWithRole = await User.findById(req.user.id).populate("role_id", "name");
    if (!userWithRole || userWithRole.role_id.name !== "admin") {
      const userVolunteersIds = (await Volunteer.find({ created_by: req.user.id }).select('_id')).map(v => v._id);
      filter.$or = [
        { created_by: req.user.id },
        { assign_to: { $in: userVolunteersIds } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate([
        { 
          path: 'assign_to',
          populate: { path: 'ward', select: 'ward_name ward_number' },
          select: 'name email ward localities'
        },
        { path: 'created_by', select: 'name email' },
        { 
          path: 'event', 
          select: 'eventTitle date time status venue eventType targetAttendance description' // Expanded for modal
        }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Failed to fetch tasks.", error: error.message });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    // 1. Find the volunteer linked to this user
    const volunteer = await Volunteer.findOne({ user_id: loggedInUserId });
    if (!volunteer) {
      return res.status(200).json([]); // Not a volunteer → return empty array
    }

    // 2. Find ALL tasks assigned to this volunteer (any status)
    const tasks = await Task.find({
      assign_to: volunteer._id
      // Removed: status: "pending" → now returns all statuses
    })
      .populate({
        path: "event",
        select: "eventTitle date time venue status eventType targetAttendance description"
      })
      .populate({
        path: "created_by",
        select: "name email"
      })
      .populate({
        path: "assign_to",
        select: "name email",
        populate: {
          path: "ward",
          select: "ward_name ward_number"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("getMyTasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// controllers/taskController.js → updateMyTask
const updateMyTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, volunteer_description, attachmentLinks, existingAttachments } = req.body;
    const files = req.files || [];

    const volunteer = await Volunteer.findOne({ user_id: req.user.id });
    if (!volunteer) return res.status(403).json({ message: "Only volunteers can update tasks." });

    const task = await Task.findOne({ _id: taskId, assign_to: volunteer._id });
    if (!task) return res.status(404).json({ message: "Task not found or not assigned to you." });

    // Update basic fields
    if (status) task.status = status;
    if (volunteer_description !== undefined) task.volunteer_description = volunteer_description;

    // === PRESERVE EXISTING ATTACHMENTS ===
    let keptAttachments = [];
    if (existingAttachments) {
      const urls = Array.isArray(existingAttachments) ? existingAttachments : [existingAttachments];
      keptAttachments = urls.map(url => ({ url: url.trim(), uploadedAt: new Date() }));
    }

    // === ADD NEW LINKS ===
    let newLinks = [];
    if (attachmentLinks) {
      const links = Array.isArray(attachmentLinks) ? attachmentLinks : [attachmentLinks];
      newLinks = links
        .filter(link => link && link.trim())
        .map(url => ({ url: url.trim(), uploadedAt: new Date() }));
    }

    // === ADD NEWLY UPLOADED FILES ===
    let newFiles = [];
    if (files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      newFiles = files.map(file => ({
        url: `${baseUrl}/uploads/task_attachments/${file.filename}`,
        uploadedAt: new Date()
      }));
    }

    // === FINAL ATTACHMENTS LIST ===
    task.attachments = [...keptAttachments, ...newLinks, ...newFiles];

    await task.save();

    // Repopulate
    await task.populate([
      { path: "event", select: "eventTitle date time venue status eventType targetAttendance description" },
      { path: "created_by", select: "name email" },
      { path: "assign_to", populate: { path: "ward" } }
    ]);

    res.status(200).json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    console.error("updateMyTask Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// controllers/taskController.js
const deleteAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { attachmentUrl } = req.body;

    const volunteer = await Volunteer.findOne({ user_id: req.user.id });
    if (!volunteer) return res.status(403).json({ message: "Unauthorized" });

    const task = await Task.findOne({ _id: taskId, assign_to: volunteer._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Remove from DB
    task.attachments = task.attachments.filter(att => att.url !== attachmentUrl);
    await task.save();

    // Delete file from server (if it's a local upload)
    if (attachmentUrl.includes("/uploads/task_attachments/")) {
      const filename = attachmentUrl.split("/uploads/task_attachments/").pop();
      const filePath = path.join(__dirname, "../uploads/task_attachments", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true, message: "Attachment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  updateMyTask, 
  deleteAttachment// ← ADD THIS
};
