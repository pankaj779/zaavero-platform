const { expo } = require('./app.json');

/**
 * Dynamic Expo config so local Windows exports can opt into JSC when Hermes
 * bytecode compilation fails due to Windows MAX_PATH limits on hermesc.exe.
 * EAS / Linux / macOS keep Hermes from app.json unless EXPO_JS_ENGINE overrides.
 */
module.exports = () => ({
  ...expo,
  jsEngine: process.env.EXPO_JS_ENGINE === 'jsc' ? 'jsc' : expo.jsEngine,
});
