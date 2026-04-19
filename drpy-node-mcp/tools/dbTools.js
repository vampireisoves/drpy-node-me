import sqlite3pkg from 'node-sqlite3-wasm';
const { Database } = sqlite3pkg;
import { resolvePath } from "../utils/pathHelper.js";

export const sql_query = async (args) => {
    const { query } = args;
    if (!query || !query.trim().toLowerCase().startsWith("select")) {
      return { isError: true, content: [{ type: "text", text: "Only SELECT queries are allowed." }] };
    }

    const dbPath = resolvePath("database.db");
    let db;
    try {
        db = new Database(dbPath);
        const rows = db.all(query);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(rows, null, 2)
          }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `SQL Error: ${e.message}` }]
        };
    } finally {
        if (db) db.close();
    }
};
