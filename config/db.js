const dns = require("dns");
const { MongoClient, ServerApiVersion } = require("mongodb");

// ISP DNS e SRV lookup fail korle Google/Cloudflare DNS use hobe
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
});

let db;
async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME);
  }
  return db;
}

module.exports = { getDB };