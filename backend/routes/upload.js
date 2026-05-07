/**
 * HUBOOZE FILE UPLOAD ROUTES
 * POST /api/upload/product-image  → upload product image
 * POST /api/upload/avatar         → upload user avatar
 */
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect, requireSeller } = require('../middleware');

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_PATH || './public/uploads';
['products', 'avatars'].forEach(d => {
  const dir = path.join(uploadDir, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Multer config ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.path.includes('avatar') ? 'avatars' : 'products';
    cb(null, path.join(uploadDir, sub));
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
  if (!allowed.test(file.originalname)) {
    return cb(new Error('Only image files allowed (jpg, png, webp, gif)'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, // 5MB
});

// ── POST /api/upload/product-image ───────────────────────────────
router.post('/product-image', protect, requireSeller, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
  const url = `/uploads/products/${req.file.filename}`;
  res.status(201).json({ url, filename: req.file.filename, size: req.file.size });
});

// ── POST /api/upload/avatar ───────────────────────────────────────
router.post('/avatar', protect, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No avatar file provided.' });
  const url = `/uploads/avatars/${req.file.filename}`;
  // Could update user.avatar in DB here
  res.status(201).json({ url, filename: req.file.filename });
});

// ── Error handler for multer ──────────────────────────────────────
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  res.status(400).json({ error: err.message });
});

module.exports = router;
