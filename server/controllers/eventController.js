// eventController.js - With debugging logs and proper error handling for createdBy
const Event = require("../models/eventModel");
const cron = require('node-cron');

// Helper to get user ID
const getUserId = (req) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    console.error('No user ID found in req.user:', req.user);
  }
  return userId;
};

// Create new event
exports.createEvent = async (req, res) => {
  try {
    console.log('req.user in createEvent:', req.user); // Debug log
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { date, time } = req.body;
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const eventData = {
      ...req.body,
      startTime,
      actualAttendance: 0,
      createdBy: userId,
    };

    console.log('Event data before save:', eventData); // Debug log

    const event = new Event(eventData);
    const savedEvent = await event.save();
    console.log('Event saved:', savedEvent); // Debug log

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: savedEvent,
    });
  } catch (error) {
    console.error('Create event error:', error); // Debug log
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all events for the authenticated user only
exports.getAllEvents = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const events = await Event.find({ createdBy: userId }).populate("createdBy", "name email");
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single event by ID (ensure it belongs to user)
exports.getEventById = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const event = await Event.findOne({ _id: req.params.id, createdBy: userId }).populate("createdBy", "name email");
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update event (ensure it belongs to user)
exports.updateEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { date, time } = req.body;
    let startTime = null;
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
    }

    const updateData = { ...req.body };
    if (startTime) updateData.startTime = startTime;

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedEvent)
      return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete event (ensure it belongs to user)
exports.deleteEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const deletedEvent = await Event.findOneAndDelete({ _id: req.params.id, createdBy: userId });
    if (!deletedEvent)
      return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cron job to update scheduled events to ongoing (runs every minute)
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const result = await Event.updateMany(
      {
        status: 'scheduled',
        startTime: { $lte: now }
      },
      { status: 'ongoing' }
    );
    if (result.modifiedCount > 0) {
      console.log(`${result.modifiedCount} events updated to ongoing at ${now}`);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});