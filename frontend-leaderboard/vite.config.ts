import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Vite configuration for Preact
export default defineConfig({
    plugins: [preact()],
}); 