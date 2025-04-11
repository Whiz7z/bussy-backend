const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
require('dotenv').config();
require('../src/config/passport');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('image');

const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  resave: true, // Force save, even if nothing changed
  saveUninitialized: true, // Save new sessions
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'none',
    secure: true,
    httpOnly: true,
  },
  name: 'bussy.sid', // Custom name for the session cookie
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require('../src/routes/auth');
const businessRoutes = require('../src/routes/business');
const reviewRoutes = require('../src/routes/review');

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

app.post('/api/upload-profile-picture', async (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Something went wrong' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
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
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 