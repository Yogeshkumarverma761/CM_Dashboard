import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

let sql = null;
if (dbUrl && dbUrl.trim() !== '') {
  try {
    sql = neon(dbUrl);
  } catch (err) {
    console.error('Failed to initialize Neon connection:', err.message);
  }
} else {
  console.warn('⚠️ DATABASE_URL is not defined in environment variables. Database queries will fail.');
}

/**
 * Execute a parameterized SQL query against NeonDB.
 * @param {string} queryText - SQL query string with $1, $2 placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<Array>} - Rows returned
 */
export async function query(queryText, params = []) {
  if (!sql) {
    throw new Error('Database connection is not initialized because DATABASE_URL is missing in your .env file.');
  }
  const rows = await sql.query(queryText, params);
  return rows;
}

export default sql;
