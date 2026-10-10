import "dotenv/config";

const PORT = Number(process.env.PORT) || 8000;

const orgins = process.env.ORIGIN?.split(",").map(origin => origin.trim()).filter(Boolean);

const databaseURL = process.env.DATABASE_URL;

if(!databaseURL){
  throw new Error("DATABASE_URL is not defined in the environment variables. Please define DATABASE_URL as a valid PostgreSQL connection string.");
}

if(!orgins?.length){
  throw new Error("ORIGIN is not defined in the environment variables. Please define ORIGIN as a comma-separated list of allowed origins.");  
}

if (!process.env.PORT) {
  console.warn("PORT is not defined in the environment variables. Using default port 8000.");
}

export const env = {
    PORT : PORT,
    ORIGIN: orgins,
    DATABASE_URL: databaseURL
}as const


