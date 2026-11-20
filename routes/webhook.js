const express = require("express");
const Stripe = require("stripe");
const { savePaidSession } = require("../utils/savePayment");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/webhook
// express.raw lagbe, nahole Stripe signature verify hobe na
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await savePaidSession(event.data.object);
    }
    res.send({ received: true });
  } catch (err) {
    console.error("Webhook handling failed:", err.message);
    // 500 dile Stripe pore abar try korbe
    res.status(500).send({ message: "Webhook handler failed" });
  }
});

module.exports = router;