const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const querystring = require("querystring");
const generateRandomString = require("./generateRandomString");
const app = express();
require("dotenv").config();

// connecting to mongodb server
const mongodbConnectionString = process.env.MONGODB_URI;

main().catch((err) => console.log(err));
async function main() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/musicAppTest");
    //   await mongoose.connect(mongodbConnectionString);
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cors());

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.get("/login", function (req, res) {
  var state = generateRandomString(30);
  const scope =
    "user-read-private user-read-email user-library-read user-library-modify streaming user-modify-playback-state user-read-playback-state user-read-currently-playing user-read-recently-played user-top-read";
  const redirect_uri = "http://localhost:3001/callback";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get("/callback", function (req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;

  if (state === null) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: "http://localhost:3001/callback",
        grant_type: "authorization_code",
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
          ).toString("base64"),
      },
      json: true,
    };
    axios
      .post(authOptions.url, querystring.stringify(), {
        headers: authOptions.headers,
      })
      .then((response) => {
        if (response.status === 200) {
          console.log(response.data.access_token);
          console.log(response.data.refresh_token);
          res.send(response.data.access_token);
        } else {
          console.error("Failed to exchange code for access token.");
        }
      })
      .catch((error) => {
        console.error("Error exchanging code for access token:", error);
      });
  }
});

app.listen(3001, function () {
  console.log("Server started on port 3001");
});
