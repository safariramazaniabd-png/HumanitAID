const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const env = require('../config/env');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALL_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    const name = crypto.randomBytes(16).toString('hex') + '-' + Date.now() + safeExt;
    cb(null, name);
  },
});

function verifyImageSignature(filePath, mimetype) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(16);
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  const signatures = {
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
  };

  const sigs = signatures[mimetype];
  if (!sigs) return false;

  return sigs.some((sig) => sig.every((b, i) => buffer[i] === b));
}

function fileFilter(_req, file, cb) {
  if (!ALL_TYPES.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non supporté: ' + file.mimetype), false);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Extension de fichier non supportée: ' + ext), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxSizeMB * 1024 * 1024,
    files: 1,
  },
});

function verifyUploadedFile(req, res, next) {
  if (!req.file) return next();
  const valid = verifyImageSignature(req.file.path, req.file.mimetype);
  if (!valid) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Fichier corrompu ou type réel non reconnu' });
  }
  next();
}

module.exports = { upload, verifyUploadedFile, IMAGE_TYPES, VIDEO_TYPES };