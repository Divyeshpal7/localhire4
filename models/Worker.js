// models/Worker.js
const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true, // Example: plumber, electrician
  },
  phone: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Worker", workerSchema);
