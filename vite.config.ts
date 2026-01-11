import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages serves:
  // - project pages at "/<repo-name>/"
  // - user/org pages ("<owner>.github.io") at "/"
  const [owner, repoName] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
  const isUserOrOrgPages = !!owner && !!repoName && repoName === `${owner}.github.io`;
  const base = mode === 'production'
    ? (isUserOrOrgPages ? '/' : repoName ? `/${repoName}/` : '/')
    : '/';

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Prevent duplicate React instances (fixes "Cannot read properties of null (reading 'useState')")
      dedupe: ["react", "react-dom"],
    },
  };
});
