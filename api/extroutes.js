const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const https = require("https");
const multer = require("multer"); // Ensure multer is installed
const fs = require("fs");
const { sp } = require("@pnp/sp-commonjs");
const { NodeFetchClient } = require("pnp-auth");
const { SPFetchClient } = require("@pnp/nodejs-commonjs");
const msal = require("@azure/msal-node");

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
// async function getAccessToken() {
//   const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

//   const requestBody = new URLSearchParams({
//     grant_type: "client_credentials",
//     client_id: clientId,
//     client_secret: clientSecret,
//     scope: `${resource}/.default`,
//   });

//   try {
//     const response = await axios.post(tokenEndpoint, requestBody, {
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     });

//     return response.data.access_token;
//   } catch (error) {
//     console.error("Error obtaining token:", error.response.data);
//     throw new Error("Failed to obtain access token");
//   }
// }
// Acquire the token
async function getAccessToken() {
  try {
    const tokenResponse = await cca.acquireTokenByClientCredential({
      scopes: [`${resource}/.default`],
    });

    return tokenResponse.accessToken;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    throw new Error("Failed to obtain access token");
  }
}

async function setupPnP() {
  const accessToken = await getAccessToken();
  console.log("accessToken in setupPnP", accessToken);
  sp.setup({
    sp: {
      fetchClientFactory: () =>
        new SPFetchClient(
          "https://ollyhite.sharepoint.com/sites/Team_demo",
          accessToken
        ),
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

// Call the SharePoint configuration on router initialization

router.post("/NoteFilesUpload", upload.array("files"), async (req, res) => {
  try {
    // Step 1: Get the access token
    //const accessToken = await getAccessToken();

    //await configureSP(); // Ensure PnP JS is configured before making any requests
    await setupPnP();
    console.log("files", req.files); // Log the files to check their presence

    const uploadPromises = req.files.map(async (file) => {
      const fileName = file.originalname;

      // Define the folder path where you want to upload the file
      const folderPath = "/sites/Team_demo/Documents/Dynamic_Folder_test"; // Use your dynamic folder name

      // Ensure the folder exists

      await sp.web.folders.add(folderPath); // This will create the folder if it doesn't exist
      // await sp.web.getFolderByServerRelativeUrl("/test").files.add(fileName);
      // Upload the file to SharePoint
      const uploadResponse = await sp.web
        .getFolderByServerRelativeUrl(folderPath)
        .files.add(fileName, file.buffer, true); // Use file.buffer directly

      // Get the uploaded file’s URL

      return uploadResponse.file;
    });

    // Wait for all uploads to complete
    const uploadedFiles = await Promise.all(uploadPromises);

    // Optionally, generate shareable links for each uploaded file
    const shareableLinks = await Promise.all(
      uploadedFiles.map(async (uploadedFile) => {
        return await uploadedFile.getShareLink({
          emailData: null, // Optionally specify emailData to send emails about the share link
          linkKind: 2, // 2 = Anonymous view link
        });
      })
    );

    // Map the results to URLs
    const results = uploadedFiles.map((file, index) => ({
      fileUrl: file.ServerRelativeUrl,
      shareableLink: shareableLinks[index].url,
    }));

    res.json({
      message: "Files uploaded successfully!",
      files: results,
    });
  } catch (error) {
    console.error("Error uploading files or generating share links: ", error);
    res
      .status(500)
      .send(`File upload or share link generation failed: ${error.message}`);
  }
});

module.exports = router;
