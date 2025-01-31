import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Initialize dotenv config
dotenv.config()

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql', // Changed from 'pglite' to 'pg' as it's more commonly used
    dbCredentials: {
        url: process.env.DATABASE_URL as string
    }
})
