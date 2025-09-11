require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const QRCode = require("qrcode");
const axios = require("axios");
const FormData = require("form-data");
const User = require("./models/User");

const app = express();

// ----------------- Middleware ----------------- //
app.use(
  cors({
    origin: ["https://map-art-photobooth.netlify.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ----------------- Cloudinary Setup ----------------- //
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------- Multer (Memory Storage) ----------------- //
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
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use STARTTLS, keep false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


// ----------------- Routes ----------------- //

// Save user
app.post("/save-user", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and email are required" });

  try {
    const newUser = new User({ name, email });
    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Email already exists" });
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

// ----------------- Get Latest DSLR Image ----------------- //
app.get("/cloudinary/latest-dslr", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:dslr-images")
      .sort_by("created_at", "desc")
      .max_results(1)
      .execute();

    if (!result.resources || result.resources.length === 0) {
      return res.json({ url: null });
    }

    const latest = result.resources[0];
    res.json({ url: latest.secure_url });
  } catch (err) {
    console.error("❌ Error fetching latest DSLR photo:", err);
    res.status(500).json({ error: "Failed to fetch latest photo" });
  }
});

// ----------------- Retake Latest DSLR ----------------- //
app.post("/retake", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:dslr-images")
      .sort_by("created_at", "desc")
      .max_results(1)
      .execute();

    if (!result.resources || result.resources.length === 0) {
      return res.status(404).json({ success: false, error: "No image to delete" });
    }

    const publicId = result.resources[0].public_id;
    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: "Last photo deleted, please capture a new one",
      waitTime: 3000,
    });
  } catch (err) {
    console.error("❌ Retake error:", err);
    res.status(500).json({ success: false, error: "Failed to delete photo" });
  }
});

// ----------------- Remove Background ----------------- //
app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    let fileBuffer, fileName;

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
    } else if (req.body.filepath) {
      const response = await axios.get(req.body.filepath, {
        responseType: "arraybuffer",
      });
      fileBuffer = response.data;
      fileName = path.basename(req.body.filepath);
    } else {
      return res.status(400).json({ error: "No image provided" });
    }

    const formData = new FormData();
    formData.append("image_file", fileBuffer, fileName);
    formData.append("size", "auto");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": process.env.REMOVEBG_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    res.json({ success: true, data: { result_b64: base64Image } });
  } catch (error) {
    console.error("Remove.bg Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Background removal failed" });
  }
});

// ----------------- Upload Final Image to Cloudinary ----------------- //
app.post("/upload-final", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image)
      return res.status(400).json({ success: false, message: "No image provided" });

    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "final-layouts",
    });

    res.json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, message: "Failed to upload image" });
  }
});

const lastSent = new Map();

app.post("/send-email", async (req, res) => {
  const { email, imageUrl } = req.body;

  if (!email || !imageUrl) {
    return res
      .status(400)
      .json({ success: false, message: "Email and imageUrl are required" });
  }

  const now = Date.now();
  const lastTime = lastSent.get(email) || 0;

  // prevent duplicate sends within 15 seconds
  if (now - lastTime < 15000) {
    console.log(`⚠️ Duplicate email blocked for ${email}`);
    return res.json({
      success: true,
      message: "Email already sent recently (blocked duplicate)",
    });
  }

  try {
    await transporter.sendMail({
      from: `"Art Photobooth" <${process.env.SMTP_SENDER}>`,
      to: email,
      subject: "🎉 Your Photobooth Image",
      html: `
        <p>Hi 👋,</p>
        <p>Thanks for using our photobooth! 🎨✨</p>
        <p>You can view your final image below:</p>
        <div style="text-align:center; margin:20px 0;">
          <img src="${imageUrl}" alt="Final Image" style="max-width:100%; border-radius:8px;"/>
        </div>
        <p>Or download it here: <a href="${imageUrl}" target="_blank">${imageUrl}</a></p>
        <br/>
        <p>Cheers,<br/>Art Photobooth Team</p>
      `,
    });

    // record timestamp to block future duplicates
    lastSent.set(email, now);

    console.log(`✅ Email sent to ${email}`);
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});



// ----------------- Generate QR Code ----------------- //
app.post("/generate-qr", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl)
    return res.status(400).json({ success: false, message: "Image URL is required" });

  try {
    const qrDataUrl = await QRCode.toDataURL(imageUrl, { width: 300 });
    res.json({ success: true, qrCode: qrDataUrl });
  } catch (err) {
    console.error("❌ QR Code error:", err);
    res.status(500).json({ success: false, message: "Failed to generate QR code" });
  }
});

// ----------------- Start Server ----------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
