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
const upload = multer({ dest: 'uploads/' });

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



app.post('/api/upload-profile-picture', upload.single('image'), async (req, res) => {
  const { userId } = req.body; // Get user ID from request
  console.log(req.file);
  const filePath = req.file.path; // Path to the uploaded file

  // Upload the file to cloud storage and get the URL
  const imageUrl = await uploadToCloudStorage(filePath); // Implement this function

  // Update the user's profile in the database
  await prisma.user.update({
    where: { id: userId },
    data: { picture: imageUrl },
  });

  res.json({ message: 'Profile picture updated successfully', imageUrl });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 