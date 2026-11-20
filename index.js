require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getDB } = require("./config/db");

const app = express();

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:3000"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// webhook ALOADA, express.json() er AGE rakhte hobe (raw body lagbe)
app.use("/api/webhook", require("./routes/webhook"));

app.use(express.json());

app.get("/", (req, res) => res.send("FixMate server is running"));

app.use("/api/services", require("./routes/services"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/users"));

getDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

module.exports = app;