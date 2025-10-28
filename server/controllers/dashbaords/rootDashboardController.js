const Party = require("../../models/Party");
const Candidate = require("../../models/candidateModel");

// ✅ GET /api/rootdashboard/stats - All time totals
exports.getDashboardStats = async (req, res) => {
  try {
    const [partyStats, candidateStats] = await Promise.all([
      Party.aggregate([{ $match: {} }, { $count: "total" }]),
      Candidate.aggregate([{ $match: {} }, { $count: "total" }]),
    ]);

    res.json({
      totalParties: partyStats[0]?.total || 0,
      totalCandidates: candidateStats[0]?.total || 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET /api/rootdashboard/chart/line - Last 30 days by date
exports.getLineChartData = async (req, res) => {
  try {
    // Last 30 days
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const pipeline = [
      { $match: { created_at: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const [partyData, candidateData] = await Promise.all([
      Party.aggregate(pipeline),
      Candidate.aggregate(pipeline),
    ]);

    const map = {};
    partyData.forEach((item) => {
      const key = item._id;
      if (!map[key]) map[key] = { name: key, parties: 0, candidates: 0 };
      map[key].parties = item.count;
    });
    candidateData.forEach((item) => {
      const key = item._id;
      if (!map[key]) map[key] = { name: key, parties: 0, candidates: 0 };
      map[key].candidates = item.count;
    });

    // Fill missing dates with 0s
    const result = Object.values(map);
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (!map[dateStr]) {
        result.unshift({ name: dateStr, parties: 0, candidates: 0 });
      }
    }

    res.json(result.slice(0, 30)); // Limit to 30 days
  } catch (error) {
    console.error("Line chart error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET /api/rootdashboard/chart/bar - Last 12 weeks by week
exports.getBarChartData = async (req, res) => {
  try {
    // Last 12 weeks (~84 days)
    const start = new Date();
    start.setDate(start.getDate() - 84);

    const pipeline = [
      { $match: { created_at: { $gte: start } } },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            week: { $week: "$created_at" }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      {
        $project: {
          _id: 0,
          name: {
            $concat: [
              "Week ",
              { $toString: "$_id.week" },
              " (",
              { $toString: "$_id.year" },
              ")"
            ]
          },
          count: 1,
        },
      },
    ];

    const [partyData, candidateData] = await Promise.all([
      Party.aggregate(pipeline),
      Candidate.aggregate(pipeline),
    ]);

    const map = {};
    partyData.forEach((item) => {
      if (!map[item.name]) map[item.name] = { name: item.name, parties: 0, candidates: 0 };
      map[item.name].parties = item.count;
    });
    candidateData.forEach((item) => {
      if (!map[item.name]) map[item.name] = { name: item.name, parties: 0, candidates: 0 };
      map[item.name].candidates = item.count;
    });

    res.json(Object.values(map));
  } catch (error) {
    console.error("Bar chart error:", error);
    res.status(500).json({ message: "Server error" });
  }
};