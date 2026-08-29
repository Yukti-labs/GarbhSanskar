const { readFirebaseConfigFromEnv, isFirebaseConfigComplete } = require("../lib/firebaseEnv.cjs");

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

module.exports = async function handler(req, res) {
  withCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const firebase = readFirebaseConfigFromEnv(process.env);
  return res.status(200).json({
    firebase,
    configured: isFirebaseConfigComplete(firebase),
  });
};
