/* global db */
// Runs only on this deployment's new empty volume, before normal database startup.
const shopDb = db.getSiblingDB("ec_shop_demo");
shopDb.createUser({
  user: "shop_app",
  pwd: process.env.APP_DB_PASSWORD,
  roles: [{ role: "readWrite", db: "ec_shop_demo" }],
});
