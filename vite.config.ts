// @lovable.dev/vite-tanstack-config already includes the required plugins.
// Do not import TanStack, React, Tailwind or Nitro plugins manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({

  tanstackStart: {
    // Redirect TanStack Start's server entry to src/server.ts.
    server: { entry: "server" },
  },
});