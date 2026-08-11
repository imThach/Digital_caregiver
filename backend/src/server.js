
import "dotenv/config";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import {
    connectDatabase,
    disconnectDatabase,
} from "./configs/database.js";
import { User } from "./models/index.js";
import { checkOverdueMedicationsAndNotify } from "./services/medicationService.js";

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {
            console.log(`🚀 Backend running at http://localhost:${PORT}`);
        });

        // KHỞI TẠO SOCKET.IO
        const io = new Server(server, {
            cors: {
                origin: true,
                credentials: true,
                methods: ["GET", "POST"]
            }
        });

        app.set("io", io);

        // Middleware xác thực Token cho Socket.IO
        io.use(async (socket, next) => {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error("Authentication error: Token missing"));
            }
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (!user || !user.isActive) {
                    return next(new Error("Authentication error: User not found or inactive"));
                }
                if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
                    return next(new Error("Authentication error: Token revoked"));
                }
                socket.user = decoded;
                next();
            } catch (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
        });

        io.on("connection", (socket) => {
            console.log(`🔌 Client kết nối Socket: ${socket.id}`);
            socket.on("join_room", (room) => {
                if (room) socket.join(String(room));
            });
            socket.on("trigger_sos", (data) => {
                console.log("🚨 Nhận tín hiệu SOS:", data);
                socket.broadcast.emit("receive_sos", data);
            });
            socket.on("disconnect", () => {
                console.log(`❌ Client ngắt kết nối Socket: ${socket.id}`);
            });
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

            io.close();
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