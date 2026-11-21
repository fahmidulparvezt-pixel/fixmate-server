const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { verifyToken, verifyCustomer, verifyTechnician } = require("../middlewares/auth");
const { STATUS_TRANSITIONS, ACTIVE_STATUSES } = require("../utils/constants");

const router = express.Router();

const ALL_STATUSES = [
  "requested",
  "accepted",
  "rejected",
  "in-progress",
  "completed",
  "cancelled",
];

/* ---------------- CUSTOMER ---------------- */

// POST /api/bookings  -> create a repair request
router.post("/", verifyToken, verifyCustomer, async (req, res) => {
  try {
    const { serviceId, customerPhone, address, preferredDate, problemDescription } = req.body;

    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).send({ message: "Invalid service" });
    }

    const phone = (customerPhone || "").trim();
    const addr = (address || "").trim();
    const problem = (problemDescription || "").trim();

    if (!phone) return res.status(400).send({ message: "Phone is required" });
    if (!addr) return res.status(400).send({ message: "Address is required" });
    if (problem.length < 20) {
      return res
        .status(400)
        .send({ message: "Problem description must be at least 20 characters" });
    }

    // preferred date: today or future only (format: YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate || "")) {
      return res.status(400).send({ message: "Invalid preferred date" });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (preferredDate < today) {
      return res.status(400).send({ message: "Preferred date cannot be in the past" });
    }

    const db = await getDB();

    const service = await db.collection("services").findOne({
      _id: new ObjectId(serviceId),
      approvalStatus: "approved",
      isAvailable: true,
    });
    if (!service) {
      return res.status(404).send({ message: "Service not found or unavailable" });
    }

    if (service.technicianEmail === req.user.email) {
      return res.status(403).send({ message: "You cannot request your own service" });
    }

    // duplicate active request check
    const duplicate = await db.collection("bookings").findOne({
      serviceId: serviceId,
      customerEmail: req.user.email,
      status: { $in: ACTIVE_STATUSES },
    });
    if (duplicate) {
      return res
        .status(409)
        .send({ message: "You already have an active request for this service" });
    }

    const now = new Date();
    const doc = {
      serviceId: serviceId,
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: phone,
      address: addr,
      preferredDate: new Date(preferredDate),
      problemDescription: problem,
      status: "requested",
      finalAmount: service.basePrice,
      paymentStatus: "unpaid",
      statusHistory: [{ status: "requested", changedAt: now }],
      createdAt: now,
    };

    const result = await db.collection("bookings").insertOne(doc);
    res.status(201).send({ insertedId: result.insertedId, ...doc });
  } catch (err) {
    res.status(500).send({ message: "Failed to create request" });
  }
});

// GET /api/bookings/my  -> only the logged-in customer's bookings
router.get("/my", verifyToken, verifyCustomer, async (req, res) => {
  try {
    const db = await getDB();
    const bookings = await db
      .collection("bookings")
      .find({ customerEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.send(bookings);
  } catch (err) {
    res.status(500).send({ message: "Failed to load bookings" });
  }
});

// PATCH /api/bookings/:id/cancel  -> only while status is "requested"
router.patch("/:id/cancel", verifyToken, verifyCustomer, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({ message: "Booking not found" });
    }

    const db = await getDB();
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(req.params.id),
      customerEmail: req.user.email,
    });
    if (!booking) return res.status(404).send({ message: "Booking not found" });

    if (booking.status !== "requested") {
      return res
        .status(400)
        .send({ message: "Only a requested booking can be cancelled" });
    }

    const result = await db.collection("bookings").updateOne(
      { _id: booking._id, status: "requested" },
      {
        $set: { status: "cancelled" },
        $push: { statusHistory: { status: "cancelled", changedAt: new Date() } },
      }
    );
    if (result.matchedCount === 0) {
      return res.status(409).send({ message: "Booking status has changed, please refresh" });
    }

    res.send({ message: "Booking cancelled" });
  } catch (err) {
    res.status(500).send({ message: "Failed to cancel booking" });
  }
});

/* ---------------- TECHNICIAN ---------------- */

// GET /api/bookings/technician?status=  -> only this technician's jobs
router.get("/technician", verifyToken, verifyTechnician, async (req, res) => {
  try {
    const db = await getDB();
    const query = { technicianEmail: req.user.email };
    if (req.query.status && ALL_STATUSES.includes(req.query.status)) {
      query.status = req.query.status;
    }

    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.send(bookings);
  } catch (err) {
    res.status(500).send({ message: "Failed to load requests" });
  }
});

// PATCH /api/bookings/:id/status  -> job status pipeline
router.patch("/:id/status", verifyToken, verifyTechnician, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({ message: "Booking not found" });
    }

    const { status: nextStatus, finalAmount } = req.body;

    const db = await getDB();

    // only the technician who owns the job can touch it
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(req.params.id),
      technicianEmail: req.user.email,
    });
    if (!booking) return res.status(404).send({ message: "Booking not found" });

    const allowed = STATUS_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).send({
        message: `Cannot change status from "${booking.status}" to "${nextStatus}"`,
      });
    }

    const set = { status: nextStatus };

    if (nextStatus === "completed") {
      const amount = Number(finalAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res
          .status(400)
          .send({ message: "Final amount must be a number greater than 0" });
      }
      set.finalAmount = amount;
    }

    // filter includes current status so two quick clicks cannot both succeed
    const result = await db.collection("bookings").updateOne(
      { _id: booking._id, technicianEmail: req.user.email, status: booking.status },
      {
        $set: set,
        $push: { statusHistory: { status: nextStatus, changedAt: new Date() } },
      }
    );
    if (result.matchedCount === 0) {
      return res.status(409).send({ message: "Booking status has changed, please refresh" });
    }

    res.send({ message: `Booking marked as ${nextStatus}` });
  } catch (err) {
    res.status(500).send({ message: "Failed to update status" });
  }
});

module.exports = router;