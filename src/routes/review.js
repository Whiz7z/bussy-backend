const router = require('express').Router();
const prisma = require('../config/prisma');
const { isAuthenticated } = require('../middleware/auth');

// Get all reviews for a business
router.get('/business/:businessId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { businessId: parseInt(req.params.businessId) },
      include: {
        user: true
      }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: true,
        business: true
      }
    });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Create review
router.post('/', isAuthenticated, async (req, res) => {
  console.log({ ...req.body, userId: req.user.id });
  try {
    const { rating, comment, businessId } = req.body;
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId: req.user.id,
        businessId: parseInt(businessId)
      },
      include: {
        user: true,
        business: true
      }
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    const { rating, comment } = req.body;
    const updatedReview = await prisma.review.update({
      where: { id: parseInt(req.params.id) },
      data: {
        rating,
        comment
      },
      include: {
        user: true,
        business: true
      }
    });
    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await prisma.review.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router; 