const router = require('express').Router();
const prisma = require('../config/prisma');
const { isAuthenticated } = require('../middleware/auth');

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        reviews: true
      }
    });
    res.json(businesses);
  } catch (error) {
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
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Create business
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, category, formattedAddress, phoneNumber, website } = req.body;
    const business = await prisma.business.create({
      data: {
        name,
        category,
        formattedAddress,
        phoneNumber,
        website
      }
    });
    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Update business
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, category, formattedAddress, phoneNumber, website } = req.body;
    const business = await prisma.business.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        category,
        formattedAddress,
        phoneNumber,
        website
      }
    });
    res.json(business);
  } catch (error) {
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