
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 5174,
        strictPort: true,
        allowedHosts: [
            ".trycloudflare.com",
            "persuaded-voter-shore.ngrok-free.dev",
        ],
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8080",
                changeOrigin: true,
            },
        },
    },
});
