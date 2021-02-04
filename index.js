"use strict";

require("dotenv").config();

const fs = require("fs");

const Docker = require("dockerode");
const docker = new Docker();

const express = require("express");
const app = express();

const ejs = require("ejs");

app.set("view engine", "ejs");
app.set("views", "views");

const expressWs = require('express-ws')(app);

app.use(express.json({
  inflate: true,
  limit: '500kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}));

const listener = app.listen(process.env.port, function() {
  console.log("The docker is running on port " + listener.address().port + ".");
});

app.use(function(req, res, next) {
  if (req._parsedUrl.pathname !== "/console" && req._parsedUrl.pathname !== "/console/" && req._parsedUrl.pathname !== "/console/.websocket") {
    // Proper api key check.
    let auth = req.headers['authorization'];
    if (auth) {
      if (auth == "Bearer " + process.env.auth) {
        // Proper path name check.
        let err = null;
        try {
          decodeURIComponent(req.path);
          for (let name of Object.entries(req.query)) {
            decodeURIComponent(name);
          }
        } catch(e) {
          err = e;
        };
        if (err) {
          return res.send({ error: "An error has occured on the path name." });
        };
      } else {
        res.send({ error: "An invalid API code has been given." });
        return;
      };
    } else {
      res.send({ error: "An invalid API code has been given." });
      return;
    };
  }
  next();
});

let apifiles = fs.readdirSync('./api').filter(file => file.endsWith('.js'));

apifiles.forEach(file => {
  let apifile = require(`./api/${file}`);
  apifile.load(app, docker);
});