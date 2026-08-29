const appJson = require("./app.json");
const { readFirebaseConfigFromEnv } = require("./lib/firebaseEnv.cjs");

module.exports = () => {
  const firebase = readFirebaseConfigFromEnv(process.env);
  return {
    ...appJson.expo,
    extra: {
      firebaseApiKey: firebase.apiKey,
      firebaseAuthDomain: firebase.authDomain,
      firebaseProjectId: firebase.projectId,
      firebaseStorageBucket: firebase.storageBucket,
      firebaseMessagingSenderId: firebase.messagingSenderId,
      firebaseAppId: firebase.appId,
    },
  };
};
