const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const https = require("https");
const multer = require("multer"); // Ensure multer is installed
const fs = require("fs");
const { sp } = require("@pnp/sp-commonjs");
const { NodeFetchClient } = require("pnp-auth");
const { SPFetchClient } = require("@pnp/nodejs-commonjs");
// const msal = require("@azure/msal-node");
require("dotenv").config();
const { BearerTokenFetchClient } = require("@pnp/nodejs-commonjs");
const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Adjust the destination as needed

// SharePoint configuration
const siteUrl = process.env.SITE_URL; // Your SharePoint site URL
const clientId = process.env.CLIENT_ID; // Your Azure AD App's Client ID
const clientSecret = process.env.CLIENT_SECRET; // Your Azure AD App's Client Secret
const tenantId = process.env.TENANT_ID;
const resource = process.env.RESOURCE;

const config = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret: clientSecret,
  },
};
// const cca = new msal.ConfidentialClientApplication(config);
// Function to get the access token
async function getAccessToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const requestBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `${resource}/.default`,
  });

  try {
    const response = await axios.post(tokenEndpoint, requestBody, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data.access_token;
  } catch (error) {
    console.error("Error obtaining token:", error.response.data);
    throw new Error("Failed to obtain access token");
  }
}

// Acquire the token
// async function getAccessToken() {
//   try {
//     const tokenResponse = await cca.acquireTokenByClientCredential({
//       scopes: [`${resource}/.default`],
//     });

//     return tokenResponse.accessToken;
//   } catch (error) {
//     console.error("Error obtaining access token:", error);
//     throw new Error("Failed to obtain access token");
//   }
// }

async function configureSP(accessToken) {
  sp.setup({
    sp: {
      fetchClientFactory: () => new SPFetchClient(siteUrl, accessToken),
    },
  });
}

async function configureSP() {
  sp.setup({
    sp: {
      fetchClientFactory: () => {
        return new SPFetchClient(siteUrl, clientId, clientSecret);
      },
    },
  });
}

async function uploadFileToSharePoint(filePath, fileName, folderPath) {
  const accessToken = await getAccessToken(); // Get the access token
  console.log("Access Token:", accessToken);
  console.log("fileName", fileName);
  console.log("siteUrl", process.env.SITE_URL);

  const file = fs.readFileSync(filePath); // Read the file from disk

  try {
    const response = await axios.put(
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl(${folderPath})/Files/add(url=${fileName},overwrite=true)`,
      file,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/octet-stream",
        },
      }
    );

    return response.data.d; // Return the response data from SharePoint
  } catch (error) {
    console.error(
      "Error uploading to SharePoint:",
      error.response ? error.response.data : error.message
    );
    throw new Error("File upload to SharePoint failed.");
  }
}

router.post("/NoteFilesUpload", upload.array("files"), async (req, res) => {
  const files = req.files;
  const folderName = "test"; // Get dynamic folder name from the request body
  console.log("files", files);

  if (!files || !folderName) {
    return res.status(400).send("Files and folder name are required.");
  }

  const folderPath = `/sites/ProviderTeam/Shared Documents/Documents/`; // Define your SharePoint folder path dynamically

  try {
    // Array to store share links for all uploaded files
    const shareLinks = [];

    // Upload each file to SharePoint and get the share link
    for (const file of files) {
      const shareLink = await uploadFileToSharePoint(
        file.path,
        file.originalname,
        folderPath
      );
      shareLinks.push({
        fileName: file.originalname,
        shareLink: shareLink.Url,
      });

      // Cleanup uploaded file from server after uploading to SharePoint
      fs.unlinkSync(file.path);
    }

    // Send all share links back to the frontend
    res.json({ shareLinks });
  } catch (error) {
    res.status(500).send("Error uploading files to SharePoint");
  }
});

module.exports = router;
