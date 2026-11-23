require("dotenv").config();
const { getDB } = require("../config/db");
const TECH_EMAILS = ["rahim@fixmate.com", "sumaiya@fixmate.com"];
const CUSTOMER_EMAILS = ["nusrat@fixmate.com", "tanvir@fixmate.com"];
const COLORS = {
  Smartphone: ["#2563eb", "#7c3aed"],
  "Laptop & PC": ["#0f766e", "#2563eb"],
  AC: ["#0284c7", "#22d3ee"],
  Refrigerator: ["#4f46e5", "#06b6d4"],
  TV: ["#be185d", "#7c3aed"],
  "Washing Machine": ["#0891b2", "#2563eb"],
  Electrical: ["#d97706", "#dc2626"],
};
const banner = (category) => {
  const [c1, c2] = COLORS[category];
  const label = category.replace("&", "&amp;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><circle cx="660" cy="110" r="150" fill="#fff" fill-opacity="0.08"/><circle cx="120" cy="430" r="190" fill="#fff" fill-opacity="0.08"/><text x="400" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#fff">${label}</text><text x="400" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#fff" fill-opacity="0.85">FixMate Repair Service</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const SERVICES = [
  [
    0,
    "iPhone Screen Replacement",
    "Smartphone",
    45,
    "2-3 hours",
    "Shop Drop-off",
    "Mirpur, Dhaka",
    "Cracked or unresponsive iPhone screen replaced with a quality panel and tested before handover.",
    "approved",
  ],
  [
    0,
    "Android Battery Replacement",
    "Smartphone",
    25,
    "1-2 hours",
    "Shop Drop-off",
    "Mirpur, Dhaka",
    "Fast-draining Android phone? We fit a fresh battery and check charging and heat levels.",
    "approved",
  ],
  [
    0,
    "Laptop Servicing & Deep Cleaning",
    "Laptop & PC",
    30,
    "3-4 hours",
    "Home Visit",
    "Mirpur, Dhaka",
    "Dust removal, thermal paste renewal and fan check to fix slow, noisy and overheating laptops.",
    "approved",
  ],
  [
    0,
    "Laptop Screen & Keyboard Repair",
    "Laptop & PC",
    55,
    "1 day",
    "Shop Drop-off",
    "Mirpur, Dhaka",
    "Broken laptop screen or dead keys replaced with compatible parts and a short warranty.",
    "approved",
  ],
  [
    0,
    "LED TV Panel & Backlight Repair",
    "TV",
    60,
    "1-2 days",
    "Shop Drop-off",
    "Pallabi, Dhaka",
    "Dim screen, lines or no picture? We repair backlight strips and power boards for LED TVs.",
    "approved",
  ],
  [
    0,
    "Smart TV Software Fix & Setup",
    "TV",
    20,
    "1 hour",
    "Home Visit",
    "Mirpur, Dhaka",
    "Stuck apps, boot loops and Wi-Fi problems fixed at your home, plus full smart TV setup.",
    "approved",
  ],
  [
    0,
    "Home Electrical Wiring Check",
    "Electrical",
    35,
    "2-3 hours",
    "Home Visit",
    "Mirpur, Dhaka",
    "Safety inspection of sockets, circuit breakers and wiring with repairs for faults found.",
    "approved",
  ],
  [
    0,
    "Gaming PC Cleaning & Thermal Repaste",
    "Laptop & PC",
    40,
    "3 hours",
    "Home Visit",
    "Mirpur, Dhaka",
    "Full internal cleaning, new thermal paste and cable management for gaming desktops.",
    "pending",
  ],
  [
    1,
    "AC Servicing & Gas Refill",
    "AC",
    40,
    "2-3 hours",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Indoor and outdoor unit cleaning, gas pressure check and refill for split and window ACs.",
    "approved",
  ],
  [
    1,
    "Split AC Installation",
    "AC",
    70,
    "4-5 hours",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Professional wall mounting, piping and testing of new split AC units.",
    "approved",
  ],
  [
    1,
    "Refrigerator Cooling Repair",
    "Refrigerator",
    50,
    "3-4 hours",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Fridge not cooling or freezing too much? We find and fix thermostat and gas leak issues.",
    "approved",
  ],
  [
    1,
    "Refrigerator Compressor Replacement",
    "Refrigerator",
    95,
    "1 day",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Compressor diagnosis and replacement with genuine parts and a service warranty.",
    "approved",
  ],
  [
    1,
    "Washing Machine Drain & Motor Repair",
    "Washing Machine",
    45,
    "2-3 hours",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Water not draining, drum not spinning or loud noise? We repair pumps, belts and motors.",
    "approved",
  ],
  [
    1,
    "Front-Load Washer Deep Service",
    "Washing Machine",
    35,
    "2 hours",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Drum, door seal and filter deep cleaning to remove odor and restore wash quality.",
    "approved",
  ],
  [
    1,
    "Ceiling Fan & Switch Fitting",
    "Electrical",
    18,
    "1-2 hours",
    "Home Visit",
    "Dhanmondi, Dhaka",
    "Quick and neat fitting of ceiling fans, switches and light points at your home.",
    "approved",
  ],
  [
    1,
    "Generator Overhaul",
    "Electrical",
    120,
    "2 days",
    "Shop Drop-off",
    "Dhanmondi, Dhaka",
    "Complete generator servicing and overhaul for home and small shop use.",
    "rejected",
  ],
];
const BOOKINGS = [
  [
    "iPhone Screen Replacement",
    0,
    "requested",
    false,
    3,
    null,
    "The screen of my iPhone 12 is cracked and the touch is not working in the lower half.",
  ],
  [
    "AC Servicing & Gas Refill",
    1,
    "accepted",
    false,
    2,
    null,
    "My 1.5 ton split AC is not cooling properly and makes a rattling sound.",
  ],
  [
    "Laptop Servicing & Deep Cleaning",
    0,
    "in-progress",
    false,
    0,
    null,
    "Laptop gets very hot and the fan is loud even when I only browse the web.",
  ],
  [
    "Refrigerator Cooling Repair",
    1,
    "completed",
    false,
    -1,
    55,
    "The fridge section is not cooling and the freezer makes a clicking noise.",
  ],
  [
    "Washing Machine Drain & Motor Repair",
    0,
    "completed",
    true,
    -6,
    50,
    "Water does not drain after the wash cycle and the machine stops with an error.",
  ],
  [
    "LED TV Panel & Backlight Repair",
    1,
    "rejected",
    false,
    -4,
    null,
    "The TV screen is very dark and only visible when I shine a torch on it.",
  ],
  [
    "Smart TV Software Fix & Setup",
    0,
    "cancelled",
    false,
    -3,
    null,
    "Smart TV keeps restarting and apps do not open after the latest update.",
  ],
  [
    "Android Battery Replacement",
    1,
    "completed",
    true,
    -9,
    28,
    "My phone battery drains from full to zero in two hours and the back feels hot.",
  ],
];
const PATHS = {
  requested: ["requested"],
  accepted: ["requested", "accepted"],
  "in-progress": ["requested", "accepted", "in-progress"],
  completed: ["requested", "accepted", "in-progress", "completed"],
  rejected: ["requested", "rejected"],
  cancelled: ["requested", "cancelled"],
};
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
async function run() {
  const db = await getDB();
  const users = await db
    .collection("user")
    .find({
      email: {
        $in: [...TECH_EMAILS, ...CUSTOMER_EMAILS],
      },
    })
    .toArray();
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const missing = [...TECH_EMAILS, ...CUSTOMER_EMAILS].filter((e) => !byEmail[e]);
  if (missing.length) {
    console.error("Missing users:", missing.join(", "));
    console.error(
      "Run the client user seed first: node --env-file=.env.local scripts/seed-users.mjs",
    );
    process.exit(1);
  }
  await db.collection("services").deleteMany({
    technicianEmail: {
      $in: TECH_EMAILS,
    },
  });
  await db.collection("bookings").deleteMany({
    technicianEmail: {
      $in: TECH_EMAILS,
    },
  });
  await db.collection("payments").deleteMany({
    technicianEmail: {
      $in: TECH_EMAILS,
    },
  });
  const now = Date.now();
  const serviceDocs = SERVICES.map(
    (
      [
        techIndex,
        title,
        category,
        basePrice,
        estimatedDuration,
        serviceMode,
        serviceArea,
        description,
        approvalStatus,
      ],
      i,
    ) => {
      const tech = byEmail[TECH_EMAILS[techIndex]];
      return {
        title,
        category,
        description,
        image: banner(category),
        basePrice,
        estimatedDuration,
        serviceMode,
        serviceArea,
        technicianName: tech.name,
        technicianEmail: tech.email,
        approvalStatus,
        isAvailable: true,
        createdAt: new Date(now - i * 45 * 60 * 1000),
      };
    },
  );
  const serviceResult = await db.collection("services").insertMany(serviceDocs);
  const serviceByTitle = {};
  serviceDocs.forEach((s, i) => {
    serviceByTitle[s.title] = {
      ...s,
      _id: serviceResult.insertedIds[i],
    };
  });
  const bookingDocs = BOOKINGS.map(
    ([title, customerIndex, status, paid, dayOffset, finalAmount, problem]) => {
      const service = serviceByTitle[title];
      const customer = byEmail[CUSTOMER_EMAILS[customerIndex]];
      const created = new Date(now - (Math.abs(Math.min(dayOffset, 0)) + 1) * DAY);
      const steps = [...PATHS[status]];
      if (paid) steps.push("paid");
      const statusHistory = steps.map((s, i) => ({
        status: s,
        changedAt: new Date(created.getTime() + i * 3 * HOUR),
      }));
      return {
        serviceId: service._id.toString(),
        serviceTitle: service.title,
        serviceImage: service.image,
        category: service.category,
        basePrice: service.basePrice,
        technicianName: service.technicianName,
        technicianEmail: service.technicianEmail,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || "+880 1700-000000",
        address:
          customerIndex === 0
            ? "House 21, Road 4, Section 10, Mirpur, Dhaka"
            : "Sector 7, Road 12, Uttara, Dhaka",
        preferredDate: new Date(now + dayOffset * DAY),
        problemDescription: problem,
        status,
        finalAmount: finalAmount ?? service.basePrice,
        paymentStatus: paid ? "paid" : "unpaid",
        statusHistory,
        createdAt: created,
      };
    },
  );
  const bookingResult = await db.collection("bookings").insertMany(bookingDocs);
  const paymentDocs = [];
  bookingDocs.forEach((b, i) => {
    if (b.paymentStatus !== "paid") return;
    const n = paymentDocs.length + 1;
    paymentDocs.push({
      bookingId: bookingResult.insertedIds[i].toString(),
      serviceTitle: b.serviceTitle,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      technicianName: b.technicianName,
      technicianEmail: b.technicianEmail,
      amount: b.finalAmount,
      currency: "usd",
      transactionId: `pi_seed_sample_00${n}`,
      stripeSessionId: `cs_test_seed_sample_00${n}`,
      paymentStatus: "paid",
      paidAt: b.statusHistory[b.statusHistory.length - 1].changedAt,
    });
  });
  if (paymentDocs.length) await db.collection("payments").insertMany(paymentDocs);
  const approved = serviceDocs.filter((s) => s.approvalStatus === "approved").length;
  console.log(`Services: ${serviceDocs.length} (${approved} approved, 1 pending, 1 rejected)`);
  console.log(`Bookings: ${bookingDocs.length}`);
  console.log(`Payments: ${paymentDocs.length}`);
  console.log("Seed finished.");
  process.exit(0);
}
run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
