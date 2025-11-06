// controllers/reportsController.js
const Voter = require("../../models/Voter");
const Volunteer = require("../../models/Volunteer");
const Ward = require("../../models/ward");
const Candidate = require("../../models/candidateModel");
const User = require("../../models/usermodel");
const Role = require("../../models/role");

const getReports = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const { period = 'today', support = 'all' } = req.query; // For progress filter
    const userId = req.user.id;

    // Role-based access
    const userWithRole = await User.findById(userId).populate("role_id", "name");
    const isAdmin = userWithRole && userWithRole.role_id.name === "admin";
    const userCandidate = await Candidate.findOne({ created_by: userId });

    // Base query for voters: role-based ward filtering
    let voterQuery = {};
    if (!isAdmin && userCandidate) {
      const userWards = await Ward.find({ candidate_id: userCandidate._id }).select("_id");
      voterQuery.ward = { $in: userWards.map(w => w._id) };
    }

    // Apply support filter if specified
    if (support !== 'all' && ['neutral', 'supporter', 'opposition'].includes(support)) {
      voterQuery.support = support;
    }

    // Fetch voters
    const voters = await Voter.find(voterQuery)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    // Fetch volunteers (role-based)
    let volunteerQuery = {};
    if (!isAdmin) {
      volunteerQuery.created_by = userId;
    }
    const volunteers = await Volunteer.find(volunteerQuery)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    // Fetch wards (role-based)
    let wardQuery = {};
    if (!isAdmin && userCandidate) {
      wardQuery.candidate_id = userCandidate._id;
    }
    const wards = await Ward.find(wardQuery)
      .populate("candidate_id", "name email party photo")
      .populate("created_by", "name email");

    // Compute totals
    const totalVoters = voters.length;
    const totalSupporters = voters.filter(v => v.support === 'supporter').length;
    const totalVolunteers = volunteers.length;

    // Compute progress data based on period
    const now = new Date();
    let progressData = [];
    switch (period) {
      case 'today':
        const todayCount = voters.filter(v => {
          const created = new Date(v.createdAt);
          return created.toDateString() === now.toDateString();
        }).length;
        progressData = [{ name: 'Today', additions: todayCount }];
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayCount = voters.filter(v => {
          const created = new Date(v.createdAt);
          return created.toDateString() === yesterday.toDateString();
        }).length;
        progressData = [{ name: 'Yesterday', additions: yesterdayCount }];
        break;
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(now.getDate() - i);
          const dayCount = voters.filter(v => {
            const created = new Date(v.createdAt);
            return created.toDateString() === day.toDateString();
          }).length;
          progressData.push({ name: day.toLocaleDateString('en-US', { weekday: 'short' }), additions: dayCount });
        }
        break;
      case 'month':
        // Approximate weekly buckets for the last month
        for (let i = 0; i < 4; i++) { // 4 weeks
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const weekCount = voters.filter(v => {
            const created = new Date(v.createdAt);
            return created >= weekStart && created <= weekEnd;
          }).length;
          progressData.push({ name: `Week ${4 - i}`, additions: weekCount });
        }
        progressData.reverse();
        break;
      default:
        progressData = [{ name: 'Total', additions: totalVoters }];
    }

    // Sentiment data (percentages)
    const sentimentCounts = {
      supporter: voters.filter(v => v.support === 'supporter').length,
      neutral: voters.filter(v => v.support === 'neutral').length,
      opposition: voters.filter(v => v.support === 'opposition').length,
    };
    const total = totalVoters;
    const sentimentData = total > 0 ? [
      { name: 'Supporter', value: ((sentimentCounts.supporter / total) * 100).toFixed(2), color: '#10B981' },
      { name: 'Neutral', value: ((sentimentCounts.neutral / total) * 100).toFixed(2), color: '#F59E0B' },
      { name: 'Opposition', value: ((sentimentCounts.opposition / total) * 100).toFixed(2), color: '#EF4444' },
    ] : [];

    // Ward-wise data
    const wardData = wards.map(ward => {
      const wardVoters = voters.filter(v => v.ward && v.ward._id.toString() === ward._id.toString());
      return {
        ward: `${ward.ward_name} (${ward.ward_number})`,
        supporters: wardVoters.filter(v => v.support === 'supporter').length,
        neutral: wardVoters.filter(v => v.support === 'neutral').length,
        opposition: wardVoters.filter(v => v.support === 'opposition').length,
      };
    }).filter(w => w.supporters + w.neutral + w.opposition > 0);

    // Age group data
    const ageGroups = {
      '18-30': { supporters: 0, neutral: 0, opposition: 0 },
      '31-45': { supporters: 0, neutral: 0, opposition: 0 },
      '46-60': { supporters: 0, neutral: 0, opposition: 0 },
      '60+': { supporters: 0, neutral: 0, opposition: 0 },
    };

    voters.forEach(voter => {
      if (voter.dob) {
        const today = new Date();
        const birthDate = new Date(voter.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        let group;
        if (age >= 18 && age <= 30) group = '18-30';
        else if (age >= 31 && age <= 45) group = '31-45';
        else if (age >= 46 && age <= 60) group = '46-60';
        else if (age > 60) group = '60+';

        if (group) {
          ageGroups[group][voter.support]++;
        }
      }
    });

    const ageGroupData = Object.entries(ageGroups).map(([age, counts]) => ({
      age,
      supporters: counts.supporters,
      neutral: counts.neutral,
      opposition: counts.opposition,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalVoters,
        totalSupporters,
        totalVolunteers,
      },
      charts: {
        progressData,
        sentimentData,
        wardData,
        ageGroupData,
      },
      rawData: {
        voters,
        volunteers,
        wards,
      },
    });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({ success: false, message: "Error fetching reports", error: error.message });
  }
};

module.exports = {
  getReports,
};