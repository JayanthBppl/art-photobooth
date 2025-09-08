require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const User = require("./models/User");

const app = express();
app.use(cors({
  origin: ["https://map-art-photbooth.netlify.app", "http://localhost:3000"],
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ----------------- Storage Paths ----------------- //
// ✅ Use relative paths so they work on Render too
const baseDir = path.join(__dirname, "user-images");       // Canon raw images
const finalDir = path.join(__dirname, "public/final-images"); // Processed images

// Ensure folders exist
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

// Serve folders publicly
app.use("/user-images", express.static(baseDir));
app.use("/final-images", express.static(finalDir));

// Multer (for uploads)
const upload = multer({ storage: multer.memoryStorage() });

// ----------------- MongoDB ----------------- //
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DB_NAME,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----------------- Nodemailer ----------------- //
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ----------------- Routes ----------------- //

// Save user
app.post("/save-user", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  try {
    const newUser = new User({ name, email });
    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: "Failed to save user" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get latest Canon capture
app.get("/capture/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  // Just look in global Canon folder (not user-specific)
  const files = fs.readdirSync(baseDir)
    .filter(f => /^IMG_\d{4}\.JPG$/i.test(f)) // IMG_0001.JPG format
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(baseDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    return res.status(404).json({ error: "No Canon images found" });
  }

  const latestFile = files[0].name;
  const publicUrl = `${req.protocol}://${req.get("host")}/user-images/${latestFile}`;
res.json({ success: true, filepath: publicUrl });

});

// Retake → delete last captured Canon photo
app.post("/retake", (req, res) => {
  const files = fs.readdirSync(baseDir)
    .filter(f => /^IMG_\d{4}\.JPG$/i.test(f))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(baseDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    return res.status(404).json({ error: "No captured photo to delete" });
  }

  const lastFile = path.join(baseDir, files[0].name);
  try {
    fs.unlinkSync(lastFile);
    res.json({ success: true, message: "Last captured photo deleted" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// Remove background
app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    let fileBuffer, fileName;

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
    } else if (req.body.filepath) {
      const absPath = path.join(baseDir, path.basename(req.body.filepath));
      if (!fs.existsSync(absPath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      fileBuffer = fs.readFileSync(absPath);
      fileName = path.basename(absPath);
    } else {
      return res.status(400).json({ error: "No image provided" });
    }

    const formData = new FormData();
    formData.append("image_file", fileBuffer, fileName);
    formData.append("size", "auto");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": process.env.REMOVEBG_KEY,
      },
      responseType: "arraybuffer",
    });

    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    res.json({ success: true, data: { result_b64: base64Image } });
  } catch (error) {
    console.error("Remove.bg Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Background removal failed" });
  }
});

// Send email
app.post("/send-email", async (req, res) => {
  const { email, image } = req.body;
  if (!email || !image) {
    return res.status(400).json({ success: false, message: "Email and image are required" });
  }

  try {
    const imageBuffer = Buffer.from(image.split(",")[1], "base64");
    await transporter.sendMail({
      from: `"Art Photobooth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Your Photobooth Image",
      html: `<p>Hi 👋,<br/>Here’s your final image from the Art Photobooth.</p>
             <p>It’s also attached to this email.</p>`,
      attachments: [
        { filename: "photobooth.png", content: imageBuffer, encoding: "base64" },
      ],
    });

    console.log(`✅ Email sent to ${email}`);
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Save final image
app.post("/save-final-image", (req, res) => {
  const { imageBase64, userId } = req.body;
  if (!imageBase64 || !userId) {
    return res.status(400).json({ error: "Image and userId are required" });
  }

  const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
  const fileName = `final_${userId}_${Date.now()}.png`;
  const filePath = path.join(finalDir, fileName);

  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving final image:", err);
      return res.status(500).json({ error: "Failed to save image" });
    }
    res.json({ success: true, filePath: `/final-images/${fileName}` });
  });
});

// ----------------- Start server ----------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
