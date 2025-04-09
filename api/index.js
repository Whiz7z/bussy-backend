const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
require('dotenv').config();
require('../src/config/passport');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Session configuration


// Create a PostgreSQL client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

app.use(session({
  store: new PgSession({
    pool: pool, 
    tableName: 'Session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none', 
    secure: true,
    httpOnly: true,
    
  },
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require('../src/routes/auth');
const businessRoutes = require('../src/routes/business');
const reviewRoutes = require('../src/routes/review');
const uploadToCloudStorage = require('../utils/uploadToCloudStorage');

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post('/api/upload-profile-picture', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-pictures',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Create a buffer from the file
      const buffer = req.file.buffer;
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      bufferStream.pipe(uploadStream);
    });

    // Update user's picture URL in the database
    await prisma.user.update({
      where: { id: req.user.id },
      data: { picture: result.secure_url }
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 