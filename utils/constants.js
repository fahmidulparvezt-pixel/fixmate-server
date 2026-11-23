const STATUS_TRANSITIONS = {
  requested: ["accepted", "rejected"],
  accepted: ["in-progress"],
  "in-progress": ["completed"],
};
const ACTIVE_STATUSES = ["requested", "accepted", "in-progress"];
module.exports = {
  STATUS_TRANSITIONS,
  ACTIVE_STATUSES,
};
