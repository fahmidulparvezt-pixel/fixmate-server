require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getDB } = require("./config/db");
const app = express();
const clientUrl = (process.env.CLIENT_URL || "").replace(/\/+$/, "");
const allowedOrigins = [clientUrl, "http://localhost:3000"].filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
const loadRoute = (file) => {
  const route = require(file);
  console.log(`route ${file}: ${typeof route}`);
  if (typeof route !== "function") {
    throw new Error(`Route ${file} did not export a router (got ${typeof route})`);
  }
  return route;
};
app.use("/api/webhook", loadRoute("./routes/webhook"));
app.use(express.json());
app.get("/", (req, res) => res.send("FixMate server is running"));
app.use("/api/services", loadRoute("./routes/services"));
app.use("/api/bookings", loadRoute("./routes/bookings"));
app.use("/api/payments", loadRoute("./routes/payments"));
app.use("/api/admin", loadRoute("./routes/admin"));
app.use("/api/users", loadRoute("./routes/users"));
app.use((req, res) => {
  res.status(404).send({
    message: "Route not found",
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({
    message: "Internal server error",
  });
});
getDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err.message));
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server on ${PORT}`));
}
module.exports = app;
