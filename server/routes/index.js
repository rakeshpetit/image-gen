/**
 * Main routes file - aggregates all route modules
 */

const express = require("express");
const router = express.Router();

const uploadRoutes = require("./uploadRoutes");
const taskRoutes = require("./taskRoutes");

// Mount route modules
router.use("/", uploadRoutes);
router.use("/", taskRoutes);

module.exports = router;
