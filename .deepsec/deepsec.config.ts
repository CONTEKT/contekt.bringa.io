import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "app.bringa.io", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
