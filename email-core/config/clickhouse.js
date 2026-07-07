import { createClient } from "@clickhouse/client";
import dotenv from "dotenv";

dotenv.config();

let client = null;
let active = false;

const CLICKHOUSE_HOST = process.env.CLICKHOUSE_HOST || "http://127.0.0.1:8123";
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || "default";
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || "";
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || "emailcore";

if (process.env.CLICKHOUSE_ENABLED === "true" || process.env.CLICKHOUSE_HOST) {
  try {
    client = createClient({
      host: CLICKHOUSE_HOST,
      username: CLICKHOUSE_USER,
      password: CLICKHOUSE_PASSWORD,
      database: CLICKHOUSE_DATABASE,
      clickhouse_settings: {
        connection_timeout: 5000,
      },
    });
    active = true;
    console.log(`✅ ClickHouse client initialized at ${CLICKHOUSE_HOST}`);
    
    // Ensure tables exist asynchronously
    ensureTablesExist();
  } catch (err) {
    console.error("❌ Failed to initialize ClickHouse client:", err.message);
    active = false;
  }
} else {
  console.log("ℹ️ ClickHouse is disabled. Logs will fallback to MongoDB.");
}

async function ensureTablesExist() {
  try {
    // Create database if not exists
    await client.exec({
      query: `CREATE DATABASE IF NOT EXISTS ${CLICKHOUSE_DATABASE}`,
    });

    // Create opens table
    await client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS ${CLICKHOUSE_DATABASE}.opens (
          offer_id String,
          campaignId Nullable(String),
          offerId Nullable(String),
          email Nullable(String),
          send_domain Nullable(String),
          vmta Nullable(String),
          list_id Nullable(String),
          day String,
          ip Nullable(String),
          userAgent Nullable(String),
          country Nullable(String),
          bot UInt8,
          timestamp DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY (day, offer_id)
      `,
    });

    // Create clicks table
    await client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS ${CLICKHOUSE_DATABASE}.clicks (
          offer_id String,
          campaignId Nullable(String),
          offerId Nullable(String),
          email Nullable(String),
          send_domain Nullable(String),
          vmta Nullable(String),
          list_id Nullable(String),
          rl UInt8,
          url String,
          ip Nullable(String),
          userAgent Nullable(String),
          country Nullable(String),
          bot UInt8,
          timestamp DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY (day, offer_id, rl)
      `,
    });
    console.log("✅ ClickHouse schema checked and verified.");
  } catch (err) {
    console.error("❌ ClickHouse schema sync failed:", err.message);
  }
}

/**
 * Inserts a single row or batch of rows into ClickHouse
 * @param {string} table - ClickHouse table name
 * @param {object|object[]} rows - Data object or array of objects matching the schema
 */
export async function insertLog(table, rows) {
  if (!active || !client) return false;

  const dataset = Array.isArray(rows) ? rows : [rows];
  
  try {
    await client.insert({
      table,
      values: dataset,
      format: "JSONEachRow",
    });
    return true;
  } catch (err) {
    console.error(`❌ ClickHouse insert error on table ${table}:`, err.message);
    return false;
  }
}

/**
 * Runs a query against ClickHouse
 * @param {string} query - ClickHouse SQL query
 * @param {object} query_params - Query parameters
 * @returns {Promise<any[]>} Array of result rows
 */
export async function queryLogs(query, query_params = {}) {
  if (!active || !client) {
    throw new Error("ClickHouse client is not active.");
  }

  try {
    const resultSet = await client.query({
      query,
      query_params,
      format: "JSONEachRow",
    });
    return await resultSet.json();
  } catch (err) {
    console.error("❌ ClickHouse query error:", err.message);
    throw err;
  }
}

export { client as clickhouseClient, active as isClickHouseEnabled };
