import { defineConfig } from "drizzle-kit";

/**
 * Drizzle CLI configuration.
 */
export default defineConfig({dialect:"postgresql",schema:"./src/db/schema.ts",dbcredentials:{url:process.env.DATABASE_URL}});
