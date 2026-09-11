const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function generateFilename(originalName) {
  const ext = path.extname(originalName) || '';
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase().slice(0, 10);
  const base = crypto.randomBytes(16).toString('hex');
  return `${base}${safeExt}`;
}

async function save(file, subfolder) {
  const dir = subfolder ? path.join(UPLOADS_DIR, subfolder) : UPLOADS_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = generateFilename(file.originalname);
  const filePath = path.join(dir, filename);

  if (file.path && fs.existsSync(file.path)) {
    fs.renameSync(file.path, filePath);
  } else if (file.buffer) {
    fs.writeFileSync(filePath, file.buffer);
  } else {
    throw new Error('Aucune donnée de fichier disponible');
  }

  const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`;
  return { filename, url, size: file.size || 0, mimetype: file.mimetype };
}

async function remove(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}

module.exports = { save, remove };