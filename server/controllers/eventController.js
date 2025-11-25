// Updated eventController.js - Added handling for 'published' field with toggle endpoint
const Event = require("../models/Eventmodel");
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
const createEvent = async (req, res) => {
  try {
    console.log('req.user in createEvent:', req.user); // Debug log
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { date, time, published = false } = req.body;
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const eventData = {
      ...req.body,
      startTime,
      actualAttendance: 0,
      published,
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

// Toggle published status for an event
const togglePublished = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { id } = req.params;
    const event = await Event.findOne({ _id: id, createdBy: userId });
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.published = !event.published;
    const updatedEvent = await event.save();

    res.status(200).json({
      success: true,
      message: `Event ${event.published ? 'unpublished' : 'published'}`,
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Toggle published error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all events for the authenticated user only (with optional published and status filters)
const getAllEvents = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { published, status } = req.query; // Added status query param support
    const filter = { createdBy: userId };
    if (published !== undefined) {
      filter.published = published === 'true';
    }
    if (status) {
      // Handle comma-separated statuses (e.g., 'scheduled,ongoing')
      const statusArray = status.split(',').map(s => s.trim());
      filter.status = { $in: statusArray };
    }

    const events = await Event.find(filter).populate("createdBy", "name email");
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single event by ID (ensure it belongs to user)
const getEventById = async (req, res) => {
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
const updateEvent = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { date, time, published } = req.body;
    let startTime = null;
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
    }

    const updateData = { ...req.body };
    if (startTime) updateData.startTime = startTime;
    if (published !== undefined) updateData.published = published;

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
const deleteEvent = async (req, res) => {
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

const getPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ published: true })
      .sort({ startTime: -1 }) // newest first
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching published events:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching published events",
    });
  }
};

module.exports = {
  createEvent,
  togglePublished,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
};