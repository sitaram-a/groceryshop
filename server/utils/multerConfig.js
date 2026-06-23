const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../uploads/${folder}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${folder}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
};

const uploadProduct  = multer({ storage: createStorage('products'),  fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadCategory = multer({ storage: createStorage('categories'), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadProduct, uploadCategory };
