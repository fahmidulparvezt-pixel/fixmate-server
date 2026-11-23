const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { verifyToken, verifyTechnician } = require("../middlewares/auth");
const router = express.Router();
const CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "AC",
  "Refrigerator",
  "TV",
  "Washing Machine",
  "Electrical",
];
const MODES = ["Home Visit", "Shop Drop-off"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const validateService = (body) => {
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const estimatedDuration = (body.estimatedDuration || "").trim();
  const serviceArea = (body.serviceArea || "").trim();
  const image = (body.image || "").trim();
  const basePrice = Number(body.basePrice);
  if (!title)
    return {
      error: "Title is required",
    };
  if (!CATEGORIES.includes(body.category))
    return {
      error: "Invalid category",
    };
  if (!description)
    return {
      error: "Description is required",
    };
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return {
      error: "Base price must be a positive number",
    };
  }
  if (!estimatedDuration)
    return {
      error: "Estimated duration is required",
    };
  if (!MODES.includes(body.serviceMode))
    return {
      error: "Invalid service mode",
    };
  if (!serviceArea)
    return {
      error: "Service area is required",
    };
  if (!image)
    return {
      error: "Service image is required",
    };
  return {
    data: {
      title,
      category: body.category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode: body.serviceMode,
      serviceArea,
    },
  };
};
router.get("/", async (req, res) => {
  try {
    const db = await getDB();
    const { search, category, serviceMode, sort, limit } = req.query;
    const query = {
      approvalStatus: "approved",
      isAvailable: true,
    };
    if (category) query.category = category;
    if (serviceMode) query.serviceMode = serviceMode;
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [
        {
          title: rx,
        },
        {
          category: rx,
        },
      ];
    }
    let sortOption = {
      createdAt: -1,
    };
    if (sort === "price-asc")
      sortOption = {
        basePrice: 1,
      };
    if (sort === "price-desc")
      sortOption = {
        basePrice: -1,
      };
    let cursor = db.collection("services").find(query).sort(sortOption);
    const lim = parseInt(limit);
    if (lim > 0) cursor = cursor.limit(lim);
    res.send(await cursor.toArray());
  } catch (err) {
    res.status(500).send({
      message: "Failed to load services",
    });
  }
});
router.get("/my", verifyToken, verifyTechnician, async (req, res) => {
  try {
    const db = await getDB();
    const services = await db
      .collection("services")
      .find({
        technicianEmail: req.user.email,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();
    res.send(services);
  } catch (err) {
    res.status(500).send({
      message: "Failed to load your services",
    });
  }
});
router.post("/", verifyToken, verifyTechnician, async (req, res) => {
  try {
    const { error, data } = validateService(req.body);
    if (error)
      return res.status(400).send({
        message: error,
      });
    const db = await getDB();
    const doc = {
      ...data,
      technicianName: req.user.name,
      technicianEmail: req.user.email,
      approvalStatus: "pending",
      isAvailable: true,
      createdAt: new Date(),
    };
    const result = await db.collection("services").insertOne(doc);
    res.status(201).send({
      insertedId: result.insertedId,
      ...doc,
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to add service",
    });
  }
});
router.patch("/:id/availability", verifyToken, verifyTechnician, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    if (typeof req.body.isAvailable !== "boolean") {
      return res.status(400).send({
        message: "isAvailable must be true or false",
      });
    }
    const db = await getDB();
    const result = await db.collection("services").updateOne(
      {
        _id: new ObjectId(req.params.id),
        technicianEmail: req.user.email,
      },
      {
        $set: {
          isAvailable: req.body.isAvailable,
        },
      },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    res.send({
      message: "Availability updated",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to update availability",
    });
  }
});
router.patch("/:id", verifyToken, verifyTechnician, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    const { error, data } = validateService(req.body);
    if (error)
      return res.status(400).send({
        message: error,
      });
    const db = await getDB();
    const result = await db.collection("services").updateOne(
      {
        _id: new ObjectId(req.params.id),
        technicianEmail: req.user.email,
      },
      {
        $set: {
          ...data,
          approvalStatus: "pending",
        },
      },
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    res.send({
      message: "Service updated and sent for approval again",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to update service",
    });
  }
});
router.delete("/:id", verifyToken, verifyTechnician, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    const db = await getDB();
    const result = await db.collection("services").deleteOne({
      _id: new ObjectId(req.params.id),
      technicianEmail: req.user.email,
    });
    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    res.send({
      message: "Service deleted",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to delete service",
    });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const db = await getDB();
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).send({
        message: "Service not found",
      });
    }
    const service = await db.collection("services").findOne({
      _id: new ObjectId(req.params.id),
      approvalStatus: "approved",
      isAvailable: true,
    });
    if (!service)
      return res.status(404).send({
        message: "Service not found",
      });
    const tech = await db.collection("user").findOne(
      {
        email: service.technicianEmail,
      },
      {
        projection: {
          name: 1,
          image: 1,
          area: 1,
          bio: 1,
        },
      },
    );
    res.send({
      ...service,
      technician: tech,
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to load service",
    });
  }
});
module.exports = router;
