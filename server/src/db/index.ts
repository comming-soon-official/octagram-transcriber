import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

dotenv.config()
console.log('🔌 Initializing database connection')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
pool.on('connect', () => {
    console.log('✅ Connected to database successfully')
})
pool.on('error', (err) => {
    console.error('❌ Database pool error:', err)
})

const db = drizzle(pool, {
    schema
})
console.log('🔧 Drizzle ORM initialized')

export { db, schema }
