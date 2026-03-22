import { pool } from './pool'
import fs from 'fs'
import path from 'path'

async function migrate() {
  const client = await pool.connect()
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Read migration files
    const migrationsDir = path.join(__dirname, '../../migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found')
      return
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    // Get already executed migrations
    const { rows } = await client.query('SELECT name FROM _migrations')
    const executed = new Set(rows.map((r: { name: string }) => r.name))

    for (const file of files) {
      if (executed.has(file)) {
        console.log(`  Skipping: ${file} (already executed)`)
        continue
      }

      console.log(`  Running: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`  Done: ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }

    console.log('Migrations complete')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
