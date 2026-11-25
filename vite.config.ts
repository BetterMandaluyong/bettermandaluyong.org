import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import vinext from "vinext";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * The commit being built, shown in the footer. Workers Builds and GitHub
 * Actions set it in the environment; locally we ask git. "" if none works.
 */
function commitSha(): string {
  const fromEnv = process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

// vinext registers @vitejs/plugin-rsc itself when it finds an app/ directory
// — never add rsc() here (it fails with "Duplicate @vitejs/plugin-rsc").
export default defineConfig({
  define: {
    // Read through COMMIT_SHA in components/build.ts.
    __COMMIT_SHA__: JSON.stringify(commitSha()),
  },
  plugins: [
    vinext(),
    tailwindcss(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
