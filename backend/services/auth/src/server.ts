import {env} from "./config/env";
import app from "./app.js";
import { db } from "./config/database.js";

const startServer = async () => {
    try{
        await db.query("SELECT 1");

        console.log("Database connection established successfully.");
        app.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT}`);
        });
    }
    catch (error) {
        console.error("Error connecting to the database:", error);
        db.end(); // Close the database connection
        process.exit(1);
    }   

};


startServer();