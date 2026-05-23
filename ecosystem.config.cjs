module.exports = {
  apps: [
    {
      name: "v2-api",
      script: "./api.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-tracking",
      script: "./tracking-server.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-scheduler",
      script: "./workers/scheduler.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-pmta-scheduler",
      script: "./workers/pmtaScheduler.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-google-sheet-worker",
      script: "./workers/googleSheetWorker.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-offer-sheet-worker",
      script: "./workers/offerSheetWorker.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-campaign-create-worker",
      script: "./workers/googleSheetCampaignCreateWorker.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-complaint-worker",
      script: "./workers/complaintWorker.js",
      cwd: "./email-core",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "v2-frontend",
      script: "npm",
      args: "run start",
      cwd: "./suppression-ui",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3010
      }
    }
  ]
};
