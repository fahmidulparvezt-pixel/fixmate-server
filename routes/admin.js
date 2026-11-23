const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");
const router = express.Router();
router.use(verifyToken, verifyAdmin);
const ROLES = ["customer", "technician", "admin"];
const APPROVALS = ["pending", "approved", "rejected"];
const BOOKING_STATUSES = [
  "requested",
  "accepted",
  "rejected",
  "in-progress",
  "completed",
  "cancelled",
];
router.get("/stats", async (req, res) => {
  try {
    const db = await getDB();
    const [totalUsers, totalTechnicians, pendingServices, totalServices, totalBookings] =
      await Promise.all([
        db.collection("user").countDocuments(),
        db.collection("user").countDocuments({
          role: "technician",
        }),
        db.collection("services").countDocuments({
          approvalStatus: "pending",
        }),
        db.collection("services").countDocuments(),
        db.collection("bookings").countDocuments(),
      ]);
    const byStatus = await db
      .collection("bookings")
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();
    const revenueAgg = await db
      .collection("payments")
      .aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ])
      .toArray();
    res.send({
      totalUsers,
      totalTechnicians,
      pendingServices,
      totalServices,
      totalBookings,
      totalRevenue: revenueAgg[0]?.total || 0,
      bookingsByStatus: byStatus.map((s) => ({
        status: s._id,
        count: s.count,
      })),
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to load stats",
    });
  }
});
router.get("/users", async (req, res) => {
  try {
    const db = await getDB();
    const users = await db
      .collection("user")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send({
      message: "Failed to load users",
    });
  }
});
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        message: "User not found",
      });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).send({
        message: "Invalid role",
      });
    }
    if (req.params.id === req.user.id) {
      return res.status(403).send({
        message: "You cannot change your own role",
      });
    }
    const db = await getDB();
    const result = await db.collection("user").updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          role,
        },
      },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "User not found",
      });
    }
    res.send({
      message: `Role changed to ${role}`,
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to change role",
    });
  }
});
router.get("/services", async (req, res) => {
  try {
    const db = await getDB();
    const query = {};
    if (req.query.status && APPROVALS.includes(req.query.status)) {
      query.approvalStatus = req.query.status;
    }
    const services = await db
      .collection("services")
      .find(query)
      .sort({
        createdAt: -1,
      })
      .toArray();
    res.send(services);
  } catch (err) {
    res.status(500).send({
      message: "Failed to load services",
    });
  }
});
router.patch("/services/:id/approval", async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).send({
        message: "Status must be approved or rejected",
      });
    }
    const db = await getDB();
    const result = await db.collection("services").updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          approvalStatus,
        },
      },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    res.send({
      message: `Service ${approvalStatus}`,
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to update approval",
    });
  }
});
router.get("/bookings", async (req, res) => {
  try {
    const db = await getDB();
    const query = {};
    if (req.query.status && BOOKING_STATUSES.includes(req.query.status)) {
      query.status = req.query.status;
    }
    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort({
        createdAt: -1,
      })
      .toArray();
    res.send(bookings);
  } catch (err) {
    res.status(500).send({
      message: "Failed to load bookings",
    });
  }
});
router.get("/payments", async (req, res) => {
  try {
    const db = await getDB();
    const payments = await db
      .collection("payments")
      .find({})
      .sort({
        paidAt: -1,
      })
      .toArray();
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.send({
      totalRevenue,
      payments,
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to load payments",
    });
  }
});
module.exports = router;
