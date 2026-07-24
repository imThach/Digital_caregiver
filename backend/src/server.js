import "dotenv/config";
import app from "./app.js";
import {
    connectDatabase,
    disconnectDatabase,
} from "./configs/database.js";
import { checkOverdueMedicationsAndNotify } from "./services/medicationService.js";

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {
            console.log(`🚀 Backend running at http://localhost:${PORT}`);
        });

        const checkInterval = setInterval(async () => {
            try {
                await checkOverdueMedicationsAndNotify();
            } catch (err) {
                console.error("Lỗi khi kiểm tra lịch uống thuốc định kỳ:", err);
            }
        }, 5 * 60 * 1000);

        async function shutdown(signal) {
            console.log(`\n${signal} received. Shutting down...`);
            clearInterval(checkInterval);

            server.close(async () => {
                await disconnectDatabase();
                process.exit(0);
            });
        }

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("Backend could not start because database is unavailable");
        console.error("Error:", error.message);
        process.exit(1);
    }
}

startServer();