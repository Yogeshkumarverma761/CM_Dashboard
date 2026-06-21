import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, 'neon_setup.sql');

function splitSqlStatements(sqlText) {
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let inDollarQuote = false;
  
  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const nextChar = sqlText[i + 1] || '';
    
    // Check for dollar quotes ($$)
    if (char === '$' && nextChar === '$') {
      inDollarQuote = !inDollarQuote;
      currentStatement += '$$';
      i++; // skip next char
      continue;
    }
    
    // Check for string literal quotes (')
    if (char === "'" && !inDollarQuote) {
      // Check if escaped
      const prevChar = sqlText[i - 1] || '';
      if (prevChar !== '\\') {
        inString = !inString;
      }
    }
    
    // Semicolon splits statements if not inside quotes/dollar quotes
    if (char === ';' && !inString && !inDollarQuote) {
      currentStatement += ';';
      const stmt = currentStatement.trim();
      if (stmt) {
        statements.push(stmt);
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }
  
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements;
}

async function initialize() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is not set in your .env file.');
    process.exit(1);
  }

  console.log('⏳ Connecting to NeonDB...');
  
  try {
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove comments
    const sqlWithoutComments = sqlContent
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('--')) return '';
        return line;
      })
      .join('\n');
      
    const statements = splitSqlStatements(sqlWithoutComments);
    const sql = neon(dbUrl);
    
    console.log(`⏳ Executing ${statements.length} SQL statements sequentially...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      try {
        await sql.query(stmt);
      } catch (stmtErr) {
        console.error(`❌ Error executing statement #${i + 1}:`);
        console.error(stmt);
        console.error('Reason:', stmtErr.message);
        process.exit(1);
      }
    }
    
    console.log('✅ NeonDB schema created and seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ General initialization error:', err.message);
    process.exit(1);
  }
}

initialize();
