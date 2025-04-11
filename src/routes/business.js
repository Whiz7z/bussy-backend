const router = require('express').Router();
const prisma = require('../config/prisma');
const { isAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                picture: true
              }
            }
          }
        }
      }
    });
    
    // Calculate average rating for each business
    const businessesWithRating = businesses.map(business => {
      const totalReviews = business.reviews.length;
      const averageRating = totalReviews > 0
        ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...business,
        averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
      };
    });
    
    res.json(businessesWithRating);
  } catch (error) {
    console.error('Fetch businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get single business
router.get('/:id', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reviews: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Calculate average rating
    const totalReviews = business.reviews.length;
    const averageRating = totalReviews > 0
      ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
    
    const businessWithRating = {
      ...business,
      averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
    };
    
    res.json(businessWithRating);
  } catch (error) {
    console.error('Fetch business error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Create business
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, category, formattedAddress, phoneNumber, website, promotion } = req.body;
    
    let imageUrl = null;
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'business-images',
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
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ error: 'Failed to upload image' });
      }
    }
    
    // Create business with image URL if available
    const business = await prisma.business.create({
      data: {
        name,
        category,
        formattedAddress,
        phoneNumber,
        website,
        imageUrl,
        promotion
      }
    });
    
    res.status(201).json(business);
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Update business
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, category, formattedAddress, phoneNumber, website, promotion } = req.body;
    
    let imageUrl = undefined; // undefined means don't update the field
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'business-images',
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
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ error: 'Failed to upload image' });
      }
    }
    
    const business = await prisma.business.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        category,
        formattedAddress,
        phoneNumber,
        website,
        promotion,
        ...(imageUrl !== undefined && { imageUrl })
      }
    });
    
    res.json(business);
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// Delete business
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    await prisma.business.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

module.exports = router; 