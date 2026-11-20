require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getDB } = require("./config/db");

const app = express();

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:3000"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Stripe webhook er jonno raw body lagbe, tai eta express.json() er age rakhbe (Step 6 e korbo)
app.use(express.json());

app.get("/", (req, res) => res.send("FixMate server is running"));

(async () => {
  await getDB();
  console.log("MongoDB connected");
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

module.exports = app; // Vercel deploy er jonno