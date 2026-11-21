require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getDB } = require("./config/db");

const app = express();

// CLIENT_URL er sheshe "/" thakle bad dao (CORS match korbe na nahole)
const clientUrl = (process.env.CLIENT_URL || "").replace(/\/+$/, "");
const allowedOrigins = [clientUrl, "http://localhost:3000"].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// webhook ALOADA, express.json() er AGE rakhte hobe (raw body lagbe)
app.use("/api/webhook", require("./routes/webhook"));

app.use(express.json());

app.get("/", (req, res) => res.send("FixMate server is running"));

app.use("/api/services", require("./routes/services"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/users"));

// Unknown route
app.use((req, res) => {
  res.status(404).send({ message: "Route not found" });
});

// Unexpected error (server crash na kore JSON dey)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: "Internal server error" });
});

getDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err.message));

// Vercel e server nijei chole, tai shudhu local e listen korbe
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server on ${PORT}`));
}

module.exports = app;