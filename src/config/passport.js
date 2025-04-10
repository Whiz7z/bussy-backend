const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../config/prisma');

passport.serializeUser((user, done) => {
//console.log('user2', user);
  done(null, String(user.id));
});

passport.deserializeUser(async(user, done) => {
  //console.log('user', user);
  try {
    const userRetrieved = await prisma.user.findUnique({ where: { id: user.id } });
    done(null, userRetrieved); 
  } catch (error) {
    console.log(error);
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
      //console.log(accessToken, refreshToken, profile, done);
      try {

        const user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        

        if (!user) {
          const newUser = await prisma.user.create({
            data: {
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0].value,
              accessToken,
              refreshToken,
            },
          });

          return done(null, newUser);
        } else {
          const currentUser = {
            id: user.id,
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0].value,
            accessToken,
            refreshToken, 
          };

          console.log('user', currentUser);

          return done(null, currentUser);
        }
        
      } catch (error) {
        console.log(error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport; 