const base = require('./app.json');

const config = base.expo;

module.exports = {
  ...config,
  android: {
    ...config.android,
    // On EAS build server: GOOGLE_SERVICES_JSON is the file secret path.
    // Locally: falls back to the local file.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
};
