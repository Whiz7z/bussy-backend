const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  // Make sure to convert the user.id to a string if it's not already
  done(null, String(user.id));
});

passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user ID:', id);
  try {
    // Convert id back to number if your database uses numeric IDs
    const numericId = parseInt(id, 10);
    const user = await prisma.user.findUnique({
      where: { id: numericId }
    });
    console.log('User found:', user ? 'Yes' : 'No');
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

const callbackURL = process.env.GOOGLE_CALLBACK_URL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile:', profile.id);
        const user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        console.log('User found in DB:', user ? 'Yes' : 'No');

        if (!user) {
          console.log('Creating new user');
          const newUser = await prisma.user.create({
            data: {
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0].value,
            },
          });
          console.log('New user created:', newUser.id);
          return done(null, newUser);
        }
        console.log('Returning existing user:', user.id);
        return done(null, user);
      } catch (error) {
        console.error('Error in Google strategy callback:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport; 