// cypress.config.js
import { defineConfig } from "cypress";
import { cloudPlugin } from "cypress-cloud/plugin";

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      return cloudPlugin(on, config);
    }
  },
  viewportWidth: 1920,
  viewportHeight: 1080
});