import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";

const ii_url =
  process.env.DFX_NETWORK === "local"
    ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
    : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL =
  process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";

// Ensure CANISTER_ vars are always strings (empty string, not undefined).
// This prevents vite-plugin-environment from injecting literal "undefined"
// into the bundle when the platform hasn't set the env var yet.
// The real value is injected by the Caffeine platform at build time when
// deployed; during local dev it falls back to "" and runtime detection kicks in.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("CANISTER_") && process.env[key] === undefined) {
    process.env[key] = "";
  }
}
// Guarantee CANISTER_ID_BACKEND is always a string so Vite never emits "undefined"
if (!process.env.CANISTER_ID_BACKEND) {
  process.env.CANISTER_ID_BACKEND = process.env.CANISTER_ID_BACKEND ?? "";
}

export default defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment(["II_URL"]),
    environment(["STORAGE_GATEWAY_URL"]),
    react(),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent"]
  },
});
