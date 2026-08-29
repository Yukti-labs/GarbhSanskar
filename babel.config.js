module.exports = function (api) {
  api.cache.using(() => [
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    process.env.FIREBASE_API_KEY || "",
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
    process.env.FIREBASE_APP_ID || "",
  ].join("|"));
  return {
    presets: ["babel-preset-expo"],
  };
};
