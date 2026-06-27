import "dotenv/config";
import { connectRedis } from "./db/redis.js";
import app from "./app.js";
import connectDB from "./db/index.js";
const port = process.env.PORT || 8000;

async function server() {
  try {
    const database = await Promise.all([connectDB(), connectRedis()]);
    if (database.every((db) => db)) {
      const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
      });
      server.on("error", (err) => {
        console.error("EXPRESS SERVER FAILURE: Could not bind to port :", err);
        process.exit(1);
      });
    }
  } catch (error) {
    console.error("System boot halted due to database failure.", error);
    process.exit(1);
  }
}
server();
