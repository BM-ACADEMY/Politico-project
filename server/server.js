const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const connectDB = require("./config/db");

const path = require("path");

dotenv.config();

const app = express();

// ======== CORS Setup ========
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://admin.namathumakkalkazhagam.com",
  "https://www.admin.namathumakkalkazhagam.com",
  "https://namathumakkalkazhagam.com",
  "https://www.namathumakkalkazhagam.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS rejected origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

// ======== Helmet Setup ========
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.SERVER_URL], // Allow images from backend
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow cross-origin resource sharing

app.use(express.json());
app.use(cookieParser());

// ======== FIXED: Serve static files for uploaded images with DYNAMIC CORS headers ========
// Now checks req.origin dynamically, like general CORS
app.use(
  "/Uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    console.log(`Serving static file: ${req.path} from origin: ${origin}`);

    // Dynamic check: Allow if origin is in allowedOrigins (or no origin)
    if (!origin || allowedOrigins.includes(origin)) {
      // Echo back the request's origin (secure & matches browser expectation)
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else {
      // Reject with error log (optional: or set to false to block)
      console.error(`Static file CORS rejected origin: ${origin}`);
      return res.status(403).json({ error: "CORS not allowed for this origin" });
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }

    next();
  },
  express.static(path.join(__dirname, "Uploads"))
);

// ======== Routes ========
// (unchanged)
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/party", require("./routes/partyRoutes"));
app.use("/api/candidates", require("./routes/candidateRoutes"));
app.use("/api/wards", require("./routes/wardRoutes"));
app.use("/api/voters", require("./routes/voterRoutes"));
app.use("/api/events", require("./routes/EventRoutes"));
app.use("/api/banners", require("./routes/bannerroutes"));
app.use("/api/volunteers", require("./routes/volunteerRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/joinus", require("./routes/joinRoutes"));

// Dashboards (unchanged)
app.use("/api/reports", require("./routes/dashboardroute/reportsRoutes"));
app.use("/api/rootdashboard", require("./routes/dashboardroute/dashboardRoutes"));

// ======== Server & DB Connection ========
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  });