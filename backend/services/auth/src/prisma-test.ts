import {prisma} from "./config/primsa.js";
import {env} from "./config/env.js";

async function main() {
    try{
        await prisma.$connect();

       const result =  await prisma.$queryRaw<{version : string}[]>`SELECT version() As version`;

        console.log("Prisma connection established successfully ");
        console.log(`Database version:` , result[0]?.version);
    } catch (error) {
        console.error("Error testing Prisma connection:", error);
    }finally {
        await prisma.$disconnect();
    }
}

main();

