import { defineConfig } from "vitest/config";
import { yamlPlugin } from "./vite-plugins/yaml.ts";

// Standalone test config so unit tests don't boot the vinext/Cloudflare
// plugins from vite.config.ts. Tests live next to code as *_test.ts.
export default defineConfig({
  plugins: [yamlPlugin()],
  test: {
    include: ["**/*_test.ts"],
    exclude: ["**/node_modules/**", ".claude/**", "dist/**", ".cloudflare/**"],
    environment: "node",
  },
});
