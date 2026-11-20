const express = require("express");
const Stripe = require("stripe");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { verifyToken, verifyCustomer } = require("../middlewares/auth");
const { savePaidSession } = require("../utils/savePayment");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payments/create-checkout-session
router.post("/create-checkout-session", verifyToken, verifyCustomer, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!ObjectId.isValid(bookingId)) {
      return res.status(400).send({ message: "Invalid booking" });
    }

    const db = await getDB();

    // amount kokhono client theke nibo na, database theke nibo
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      customerEmail: req.user.email,
    });
    if (!booking) return res.status(404).send({ message: "Booking not found" });

    // payment gate: shudhu completed + unpaid
    if (booking.status !== "completed") {
      return res.status(400).send({ message: "Payment is only possible for completed jobs" });
    }
    if (booking.paymentStatus !== "unpaid") {
      return res.status(400).send({ message: "This booking is already paid" });
    }

    const amount = Number(booking.finalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).send({ message: "Invalid payment amount" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: booking.serviceTitle },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: bookingId, customerEmail: req.user.email },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    res.send({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).send({ message: "Failed to start payment" });
  }
});

// GET /api/payments/verify?session_id=...
router.get("/verify", verifyToken, verifyCustomer, async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).send({ message: "session_id is required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // onno customer er session verify kora jabe na
    if (session.metadata?.customerEmail !== req.user.email) {
      return res.status(403).send({ message: "Forbidden: this payment is not yours" });
    }

    const result = await savePaidSession(session);
    if (!result.ok) return res.status(400).send({ message: result.reason });

    res.send(result.payment);
  } catch (err) {
    console.error("Verify error:", err.message);
    res.status(500).send({ message: "Failed to verify payment" });
  }
});

// GET /api/payments/my  -> customer er payment history
router.get("/my", verifyToken, verifyCustomer, async (req, res) => {
  try {
    const db = await getDB();
    const payments = await db
      .collection("payments")
      .find({ customerEmail: req.user.email })
      .sort({ paidAt: -1 })
      .toArray();
    res.send(payments);
  } catch (err) {
    res.status(500).send({ message: "Failed to load payments" });
  }
});

module.exports = router;