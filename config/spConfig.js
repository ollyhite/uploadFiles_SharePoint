const { sp } = require("@pnp/sp-commonjs");
const { SPFetchClient } = require("@pnp/nodejs-commonjs");
const { BearerTokenFetchClient } = require("@pnp/nodejs-commonjs");

// SharePoint configuration
const siteUrl = process.env.SITE_URL; // Your SharePoint site URL
const clientId = process.env.CLIENT_ID; // Your Azure AD App's Client ID
const clientSecret = process.env.CLIENT_SECRET; // Your Azure AD App's Client Secret
const tenantId = process.env.TENANT_ID;
const resource = process.env.RESOURCE;
const userName = process.env.USER_NAME;
const password = process.env.PASSWORD;

// Configures PnP with Node.js authentication
async function configureSP() {
  try {
    // sp.setup({
    //     sp: {
    //         baseUrl: siteUrl, // Your SharePoint site URL
    //         fetchClientFactory: () => {
    //             return new SPFetchClient(siteUrl, clientId, clientSecret);
    //         },
    //     },
    // });
    sp.setup({
      sp: {
        fetchClientFactory: () => {
          return new SPFetchClient(siteUrl, userName, password);
        },
      },
    });
    console.log("PnP JS configured successfully");
  } catch (error) {
    console.error("Error configuring PnP JS: ", error);
    throw new Error("Configuration failed");
  }
}

module.exports = configureSP;
