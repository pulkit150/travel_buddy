// config/cloudinary.js - Image upload: uses Cloudinary if configured, else local disk
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let uploadProfile, uploadTrip;

if (useCloudinary) {
  // ── Cloudinary storage (production) ──────────────────────────────────────
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'travel-buddy/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 400, height: 400, crop: 'fill' }],
    },
  });

  const tripStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'travel-buddy/trips',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 600, crop: 'fill' }],
    },
  });

  uploadProfile = multer({ storage: profileStorage });
  uploadTrip    = multer({ storage: tripStorage });

  console.log('📸 Image uploads: Cloudinary');
} else {
  // ── Local disk storage (development fallback) ─────────────────────────────
  // Images saved to backend/uploads/ and served as static files
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  });

  const localFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  };

  const localMulter = multer({ storage: localStorage, fileFilter: localFilter });
  uploadProfile = localMulter;
  uploadTrip    = localMulter;

  console.log('📸 Image uploads: Local disk (./uploads) — set Cloudinary env vars for production');
}

module.exports = { uploadProfile, uploadTrip };