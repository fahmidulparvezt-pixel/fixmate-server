const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
let indexesReady = false;
const ensureIndexes = async (db) => {
  if (indexesReady) return;
  await db.collection("payments").createIndex(
    {
      stripeSessionId: 1,
    },
    {
      unique: true,
    },
  );
  await db.collection("payments").createIndex(
    {
      bookingId: 1,
    },
    {
      unique: true,
    },
  );
  indexesReady = true;
};
const savePaidSession = async (session) => {
  if (session.payment_status !== "paid") {
    return {
      ok: false,
      reason: "Payment not completed",
    };
  }
  const bookingId = session.metadata?.bookingId;
  if (!ObjectId.isValid(bookingId)) {
    return {
      ok: false,
      reason: "Invalid booking in session",
    };
  }
  const db = await getDB();
  await ensureIndexes(db);
  const booking = await db.collection("bookings").findOne({
    _id: new ObjectId(bookingId),
  });
  if (!booking)
    return {
      ok: false,
      reason: "Booking not found",
    };
  const paymentDoc = {
    bookingId: bookingId,
    serviceTitle: booking.serviceTitle,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    technicianName: booking.technicianName,
    technicianEmail: booking.technicianEmail,
    amount: (session.amount_total || 0) / 100,
    currency: "usd",
    transactionId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || "",
    stripeSessionId: session.id,
    paymentStatus: "paid",
    paidAt: new Date(),
  };
  try {
    await db.collection("payments").updateOne(
      {
        stripeSessionId: session.id,
      },
      {
        $setOnInsert: paymentDoc,
      },
      {
        upsert: true,
      },
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
  await db.collection("bookings").updateOne(
    {
      _id: booking._id,
      paymentStatus: "unpaid",
    },
    {
      $set: {
        paymentStatus: "paid",
      },
      $push: {
        statusHistory: {
          status: "paid",
          changedAt: new Date(),
        },
      },
    },
  );
  const saved = await db.collection("payments").findOne({
    stripeSessionId: session.id,
  });
  return {
    ok: true,
    payment: saved,
  };
};
module.exports = {
  savePaidSession,
};
