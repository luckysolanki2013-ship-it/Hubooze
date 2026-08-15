/**
 * HUBOOZE FILE UPLOAD ROUTES
 * POST /api/upload/product-image  → upload product image (auto-compressed)
 * POST /api/upload/avatar         → upload user avatar
 */
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const sharp   = require('sharp');
const { protect, requireSeller } = require('../middleware');

const uploadDir = process.env.UPLOAD_PATH || './public/uploads';
['products', 'avatars'].forEach(d => {
  const dir = path.join(uploadDir, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Use memory storage so we can compress before saving
const storage = multer.memoryStorage();

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
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 8 * 1024 * 1024 }, // 8MB raw upload limit
});

async function compressAndSave(buffer, subDir, maxWidth) {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const filePath = path.join(uploadDir, subDir, filename);
  await sharp(buffer)
    .rotate() // auto-orient based on EXIF
    .resize({ width: maxWidth, height: maxWidth, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(filePath);
  const stats = fs.statSync(filePath);
  return { filename, size: stats.size };
}

// ── POST /api/upload/product-image ───────────────────────────────
router.post('/product-image', protect, requireSeller, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
    const { filename, size } = await compressAndSave(req.file.buffer, 'products', 1200);
    const url = `/uploads/products/${filename}`;
    res.status(201).json({ url, filename, size });
  } catch (e) {
    console.error('Image compression error:', e);
    res.status(500).json({ error: 'Failed to process image: ' + e.message });
  }
});

// ── POST /api/upload/avatar ───────────────────────────────────────
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No avatar file provided.' });
    const { filename } = await compressAndSave(req.file.buffer, 'avatars', 400);
    const url = `/uploads/avatars/${filename}`;
    res.status(201).json({ url, filename });
  } catch (e) {
    console.error('Avatar compression error:', e);
    res.status(500).json({ error: 'Failed to process image: ' + e.message });
  }
});

// ── Error handler for multer ──────────────────────────────────────
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'File too large. Maximum size is 8MB.' });
  res.status(400).json({ error: err.message });
});

module.exports = router;
