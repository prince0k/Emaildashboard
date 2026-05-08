import express from "express";
import Offer from "../models/Offer.js";
import Deploy from "../models/Deploy.js";
import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import creativesRoutes from "./offers/creatives/index.js";
import subjectLineRoutes from "./offers/subject-lines/index.js";
import fromLineRoutes from "./offers/from-lines/index.js";


const router = express.Router();

/* ======================
   HELPERS
====================== */
const normalize = (v = "") => String(v).toLowerCase().trim();

const isValidUrl = (v) =>
  /^https?:\/\//i.test(String(v || "").trim());

/**
 * Generated ONCE at offer creation
 */
const makeMd5FileName = ({ sponsor, cid, vid }) =>
  `${normalize(sponsor)}_${normalize(cid)}_${normalize(vid)}.txt`;

const makeZipFileName = ({ sponsor, cid }) =>
  `$${normalize(sponsor)}_${normalize(cid)}.zip`;

/* ======================
   CREATE OFFER
====================== */
router.post(
  "/",
  auth,
  checkPermission("offer.create"),
  async (req, res) => {
  try {
    const {
      sid,
      sponsor,
      cid,
      offer,
      vid,
      vertical,
      redirectLinks,
      optoutLink,

      // Optizmo
      optizmoAccessKey,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!sid || !sponsor || !cid || !offer || !optoutLink) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (
      !Array.isArray(redirectLinks) ||
      redirectLinks.length === 0 ||
      !redirectLinks.every(isValidUrl)
    ) {
      return res.status(400).json({
        message: "redirectLinks must be valid URLs",
      });
    }

    if (!isValidUrl(optoutLink)) {
      return res.status(400).json({
        message: "Invalid optoutLink",
      });
    }

    /* ---------- FILE NAMES (ONCE) ---------- */
    const md5FileName = makeMd5FileName({ sponsor, cid, vid });
    const zipFileName = makeZipFileName({ cid });

    const created = await Offer.create({
      sid,
      sponsor,
      cid,
      offer,
      vid,
      vertical,
      redirectLinks,
      optoutLink,

      md5FileName,
      zipFileName,

      optizmoAccessKey,
    });

    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Offer already exists",
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
});

/* ======================
   GET OFFERS
====================== */
router.get(
  "/",
  auth,
  checkPermission("offer.view"),
  async (req, res) => {
  const q = normalize(req.query.q || "");

  const filter = {
    isDeleted: false,
    ...(q && {
      $or: [
        { sponsor: q },
        { cid: q },
        { sid: q },
        { offer: { $regex: q, $options: "i" } },
      ],
    }),
  };

  const offers = await Offer.find(filter).sort({
    createdAt: -1,
  });

  res.json(offers);
});

/* ======================
   UPDATE OFFER
====================== */
router.put(
  "/:id",
  auth,
  checkPermission("offer.edit"),
  async (req, res) => {
  try {
    const existing = await Offer.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        message: "Offer not found",
      });
    }

    /* ---------- LOCK IDENTITY + FILES ---------- */
    delete req.body.sid;
    delete req.body.sponsor;
    delete req.body.cid;
    delete req.body.offer;
    delete req.body.md5FileName;
    delete req.body.zipFileName;

    if (req.body.redirectLinks) {
      if (
        !Array.isArray(req.body.redirectLinks) ||
        !req.body.redirectLinks.every(isValidUrl)
      ) {
        return res.status(400).json({
          message: "redirectLinks must be valid URLs",
        });
      }
    }

    if (
      req.body.optoutLink &&
      !isValidUrl(req.body.optoutLink)
    ) {
      return res.status(400).json({
        message: "Invalid optoutLink",
      });
    }

    const updated = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

/* ======================
   PAUSE / RESUME OFFER
====================== */
router.patch(
  "/:id/status",
  auth,
  checkPermission("offer.edit"),
  async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      message: "isActive must be boolean",
    });
  }

  const updated = await Offer.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({
      message: "Offer not found",
    });
  }

  res.json(updated);
});

/* ======================
   SOFT DELETE
====================== */
router.delete(
  "/:id",
  auth,
  checkPermission("offer.delete"),
  async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return res.status(404).json({ message: "Offer not found" });
  }

  const activeDeploy = await Deploy.findOne({
    sid: offer.sid,
    status: "DEPLOYED",
  });

  if (activeDeploy) {
    return res.status(400).json({
      message: "Cannot delete offer with active deploy",
    });
  }

  await Offer.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    isActive: false,
  });

  res.json({ success: true });
});

/* ======================
   CREATIVES (HTML TEMPLATES)
====================== */
router.use("/creatives", creativesRoutes);

/* ======================
   SUBJECT LINES
====================== */
router.use("/subject-lines", subjectLineRoutes);

/* ======================
   FROM LINES
====================== */
router.use("/from-lines", fromLineRoutes);


export default router;
