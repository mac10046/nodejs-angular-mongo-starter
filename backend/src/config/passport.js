const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 *
 * Setup Instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Navigate to "APIs & Services" > "OAuth consent screen"
 * 4. Configure the consent screen (External for testing)
 * 5. Go to "APIs & Services" > "Credentials"
 * 6. Click "Create Credentials" > "OAuth client ID"
 * 7. Select "Web application"
 * 8. Add authorized redirect URI: http://localhost:5000/api/auth/google/callback
 * 9. Copy Client ID and Client Secret to .env file
 */

const configurePassport = () => {
  // Serialize user for session (we're using JWT, so this is minimal)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, return them
            return done(null, user);
          }

          // Check if user exists with the same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.isEmailVerified = true; // Google emails are verified
              if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`.trim(),
            email: email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || null,
            authProvider: 'google',
            isEmailVerified: true, // Google emails are pre-verified
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};

module.exports = configurePassport;
