const { getDB } = require("../config/db");
let jwks;
const getJWKS = async () => {
  if (!jwks) {
    const { createRemoteJWKSet } = await import("jose");
    jwks = createRemoteJWKSet(new URL(process.env.JWKS_URL));
  }
  return jwks;
};
const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).send({
      message: "Unauthorized: token missing",
    });
  }
  const token = header.split(" ")[1];
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, await getJWKS());
    if (!payload.email) {
      return res.status(401).send({
        message: "Unauthorized: invalid token",
      });
    }
    const db = await getDB();
    const user = await db.collection("user").findOne({
      email: payload.email,
    });
    if (!user) {
      return res.status(401).send({
        message: "Unauthorized: user not found",
      });
    }
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || "",
      role: user.role || "customer",
    };
    next();
  } catch (err) {
    return res.status(401).send({
      message: "Unauthorized: invalid or expired token",
    });
  }
};
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).send({
      message: `Forbidden: ${role} access only`,
    });
  }
  next();
};
const verifyCustomer = requireRole("customer");
const verifyTechnician = requireRole("technician");
const verifyAdmin = requireRole("admin");
module.exports = {
  verifyToken,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin,
};
