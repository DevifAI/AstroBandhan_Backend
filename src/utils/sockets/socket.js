import { Server as socketIo } from "socket.io"; // Named import for socket.io

// Store connected users
export let users = {}; // Export users object
let io; // Declare io variable to be initialized later

// Function to handle socket connections and events
export const initSocket = (server) => {
    console.log({ server })
    io = new socketIo(server, {
        cors: {
            origin: "http://localhost:6000", // Adjust based on where your client is hosted
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    console.log({ io })
    // Socket connection handling
    io.on("connection", (socket) => {
        console.log("A user connected");

        // When a user logs in or connects, store their userId and socketId
        socket.on("user_connected", (userId) => {
            users[userId] = socket.id;
            console.log(`User ${userId} connected with socket ID: ${socket.id}`);
        });

        // Disconnect handler
        socket.on("disconnect", () => {
            for (let userId in users) {
                if (users[userId] === socket.id) {
                    delete users[userId];
                    break;
                }
            }
            console.log("A user disconnected");
        });
    });
};

// Export the io instance after initialization
export { io };
