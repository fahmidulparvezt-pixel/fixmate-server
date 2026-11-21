// Je status theke kon kon status e jawa jabe
const STATUS_TRANSITIONS = {
  requested: ["accepted", "rejected"],
  accepted: ["in-progress"],
  "in-progress": ["completed"],
};

// Ei status gulo "active" dhora hoy (duplicate request check er jonno)
const ACTIVE_STATUSES = ["requested", "accepted", "in-progress"];

module.exports = { STATUS_TRANSITIONS, ACTIVE_STATUSES };