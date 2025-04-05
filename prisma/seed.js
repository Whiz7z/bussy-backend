const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mockBusinesses = [
  {
    name: "The Brew & Bean",
    category: "Café",
    formattedAddress: "42 Brick Lane, Shoreditch, London E1 6RF",
    phoneNumber: "+44 20 7123 4567",
    website: "https://brewandbean.co.uk"
  },
  {
    name: "The Royal Oak Gastropub",
    category: "Restaurant",
    formattedAddress: "125 Marylebone High Street, London W1U 4RJ",
    phoneNumber: "+44 20 7234 5678",
    website: "https://royaloakmarylebone.co.uk"
  },
  {
    name: "PureGym Canary Wharf",
    category: "Gym",
    formattedAddress: "Unit 3, Jubilee Place, Canary Wharf, London E14 5NY",
    phoneNumber: "+44 20 7345 6789",
    website: "https://puregym.co.uk/canarywharf"
  },
  {
    name: "Daunt Books",
    category: "Bookstore",
    formattedAddress: "83-84 Marylebone High Street, London W1U 4QW",
    phoneNumber: "+44 20 7456 7890",
    website: "https://dauntbooks.co.uk"
  },
  {
    name: "Headmasters Mayfair",
    category: "Beauty Salon",
    formattedAddress: "12 South Molton Street, Mayfair, London W1K 5QP",
    phoneNumber: "+44 20 7567 8901",
    website: "https://headmasters.com/mayfair"
  }
];

const mockUsers = [
  {
    email: "oliver.smith@gmail.com",
    name: "Oliver Smith",
    googleId: "uk_google_id_oliver_123",
    picture: "https://ui-avatars.com/api/?name=Oliver+Smith"
  },
  {
    email: "emma.wilson@gmail.com",
    name: "Emma Wilson",
    googleId: "uk_google_id_emma_456",
    picture: "https://ui-avatars.com/api/?name=Emma+Wilson"
  },
  {
    email: "harry.brown@gmail.com",
    name: "Harry Brown",
    googleId: "uk_google_id_harry_789",
    picture: "https://ui-avatars.com/api/?name=Harry+Brown"
  }
];

const generateReview = (userId, businessId) => {
  const ratings = [3, 4, 5];
  const comments = [
    "Proper British service, absolutely brilliant!",
    "Lovely atmosphere and fantastic staff.",
    "Top notch, would definitely recommend!",
    "Brilliant place, will be back soon!",
    "Excellent service, very pleased indeed.",
    "Great value for London, quite impressed.",
    "Superb experience, truly outstanding!"
  ];

  return {
    rating: ratings[Math.floor(Math.random() * ratings.length)],
    comment: comments[Math.floor(Math.random() * comments.length)],
    userId,
    businessId
  };
};

async function main() {
  console.log('Start seeding...');

  // Create users
  const createdUsers = await Promise.all(
    mockUsers.map(user => 
      prisma.user.create({
        data: user
      })
    )
  );
  console.log('Created users:', createdUsers.length);

  // Create businesses
  const createdBusinesses = await Promise.all(
    mockBusinesses.map(business =>
      prisma.business.create({
        data: business
      })
    )
  );
  console.log('Created businesses:', createdBusinesses.length);

  // Create 2-3 reviews for each business
  for (const business of createdBusinesses) {
    const numberOfReviews = Math.floor(Math.random() * 2) + 2; // 2-3 reviews
    const reviewsToCreate = [];

    for (let i = 0; i < numberOfReviews; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      reviewsToCreate.push(generateReview(randomUser.id, business.id));
    }

    await Promise.all(
      reviewsToCreate.map(review =>
        prisma.review.create({
          data: review
        })
      )
    );
  }
  console.log('Created reviews');

  console.log('Seeding finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 