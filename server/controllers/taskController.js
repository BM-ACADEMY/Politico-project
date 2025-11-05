// controllers/taskController.js (Fixed populate chaining, added status filter, role-based filtering, nested populate)
const Task = require("../models/Task");
const Volunteer = require("../models/Volunteer");
const User = require("../models/usermodel");
const Role = require("../models/role");

const createTask = async (req, res) => {
  try {
    const { task_title, description, assign_to } = req.body;

    // Validate required fields
    if (!task_title || !description || !assign_to) {
      return res.status(400).json({ message: "Task title, description, and assignee are required." });
    }

    // Validate assignee (Volunteer exists)
    const volunteer = await Volunteer.findById(assign_to).populate("ward", "ward_name ward_number");
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found." });
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
      assign_to,
      created_by: req.user.id,
    });

    // Populate response with nested ward
    await newTask.populate([
      { 
        path: 'assign_to',
        populate: { path: 'ward', select: 'ward_name ward_number' },
        select: 'name email ward localities'
      },
      { path: 'created_by', select: 'name email' }
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
        { path: 'created_by', select: 'name email' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Failed to fetch tasks.", error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
};