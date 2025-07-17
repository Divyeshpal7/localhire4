const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
require("dotenv").config(); // ✅ Load .env variables

const Worker = require("./models/Worker");
const User = require("./models/User");

const app = express();

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB Atlas connected successfully");
}).catch((err) => {
  console.log("❌ MongoDB connection error:", err);
});

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// ✅ Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// ✅ Routes

// Home
app.get("/", (req, res) => {
  res.render("home", { user: req.session.user });
});

// Worker Registration Form
app.get("/register", (req, res) => {
  res.render("register");
});

// Save Worker
app.post("/register", async (req, res) => {
  const { name, service, phone, location } = req.body;
  try {
    const worker = new Worker({ name, service, phone, location });
    await worker.save();
    res.redirect(`/workers?service=${service}`);
  } catch (err) {
    console.error("❌ Error saving worker:", err);
    res.status(500).send("Something went wrong during registration.");
  }
});

// List Workers
app.get("/workers", async (req, res) => {
  const service = req.query.service;
  let query = service ? { service } : {};
  try {
    const workers = await Worker.find(query);
    res.render("workers", { workers, serviceName: service || "All" });
  } catch (err) {
    console.error("❌ Error fetching workers:", err);
    res.status(500).send("Failed to load workers.");
  }
});

// ✅ Signup
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.send("❌ Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    req.session.user = { name: user.name, email: user.email };
    res.redirect("/");
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).send("Server error during signup.");
  }
});

// ✅ Login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send("❌ User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("❌ Incorrect password");

    req.session.user = { name: user.name, email: user.email };
    res.redirect("/");
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).send("Server error during login.");
  }
});

// ✅ Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
