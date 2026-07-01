
const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log("Connected to DB, dropping schema...");
  await client.query("DROP SCHEMA public CASCADE;");
  await client.query("CREATE SCHEMA public;");
  await client.query("GRANT ALL ON SCHEMA public TO postgres;");
  await client.query("GRANT ALL ON SCHEMA public TO public;");
  console.log("Schema dropped and recreated!");
  await client.end();
}

main().catch(console.error);

