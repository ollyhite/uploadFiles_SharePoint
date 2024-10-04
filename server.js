const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

// Use body-parser to parse JSON requests
const app = express();
const port = 8088;

const extRoutes = require("./api/extroutes");
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// const corsOptions = {
//   origin: "http://localhost:3000", // Change this to your frontend's origin
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true, // Enable credentials if you're using cookies or authentication headers
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));

// Use /api/routes for api calls from UI
app.use("/ext", extRoutes);
// app.use(express.static("build"));

// app.get("*", (req, res) => {
//   //res.send("Hello from the GET API!");
//   res.sendDate(__dirname + "/build/index.html");
// });

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
