import { drizzle } from 'drizzle-orm/neon-serverless'

import * as schema from './schema.ts'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
