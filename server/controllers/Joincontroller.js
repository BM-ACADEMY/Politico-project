const Join = require('../models/Joinusmodel');
const { processFile } = require('../utils/upload');

exports.createJoin = async (req, res) => {
  try {
    const { name, aadharNo, phone, candidate_mobileNumber, area, dob } = req.body;
    let imageUrl = '';

    if (!dob) {
      return res.status(400).json({ message: 'Date of birth is required.' });
    }

    const existingJoin = await Join.findOne({ aadharNo });
    if (existingJoin) {
      return res.status(400).json({ message: 'Aadhar number already registered.' });
    }

    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = Date.now() + '_' + req.file.originalname.replace(/\s+/g, '_');
      imageUrl = await processFile(fileBuffer, req.file.mimetype, 'joinus', fileName);
    }

    const join = new Join({
      name,
      aadharNo,
      phone,
      candidate_mobileNumber,
      area,
      dob: new Date(dob),
      image: imageUrl,
    });

    await join.save();

    res.status(201).json({
      message: 'Join request created successfully',
      join,
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getAllJoins = async (req, res) => {
  try {
    const joins = await Join.find().sort({ createdAt: -1 });
    res.status(200).json(joins);
  } catch (error) {
    console.error('Error fetching joins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getJoinById = async (req, res) => {
  try {
    const join = await Join.findById(req.params.id);
    if (!join) return res.status(404).json({ message: 'Join record not found' });
    res.status(200).json(join);
  } catch (error) {
    console.error('Error fetching join:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.updateJoinStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const join = await Join.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!join) return res.status(404).json({ message: 'Join record not found' });

    res.status(200).json({ message: 'Status updated successfully', join });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getJoinByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const join = await Join.findOne({ phone, status: 'approved' }).select('-_id -__v'); // Exclude sensitive fields if needed
    if (!join) {
      return res.status(404).json({ message: 'No approved record found for this phone number.' });
    }
    res.status(200).json(join);
  } catch (error) {
    console.error('Error fetching join by phone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteJoin = async (req, res) => {
  try {
    const join = await Join.findByIdAndDelete(req.params.id);
    if (!join) return res.status(404).json({ message: 'Join record not found' });
    res.status(200).json({ message: 'Join record deleted successfully' });
  } catch (error) {
    console.error('Error deleting join:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
