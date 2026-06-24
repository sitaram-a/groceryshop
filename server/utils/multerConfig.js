const multer         = require('multer');
const path           = require('path');
const cloudinary     = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
};

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         `groceryshop/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const uploadProduct  = multer({ storage: createStorage('products'),  fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadCategory = multer({ storage: createStorage('categories'), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadProduct, uploadCategory, cloudinary };