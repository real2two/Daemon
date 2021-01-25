// Load modules.

const rfr = require("rfr");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Load settings.

require("dotenv").config();

const port = process.env.port;
const Package = rfr("package.json");


// Load API.

const Containers = require("./api/Model");

// Load utilities.

const api = require("./util/api");
const Log = require("./util/logger");
const Docker = require("./docker/docker.js");

const express = require("express");

const app = express();
const expressWs = require('express-ws')(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require("./api/Routes"); //importing route
routes(app); //register the route

//app.use(function (req, res) {
//  res.status(404).send({ url: req.originalUrl + " not found" });
//});
const path = require('path')
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/console.html'));
});

app.listen(port);

Log.Info("RoboPanel RESTful API server started on: " + port);

const Main = async () => {
  Log.Info("Running Robopanel Daemon version" + Package.version);
  Log.Info("Checking for updates…");

  /*
  app.use(function(req, res, next) {
    // proper api key check
    let auth = req.headers['authorization'];
    if (auth) {
      if (auth == "Bearer " + process.env.auth) {
        // proper path name check
        let err = null;
        try {
          decodeURIComponent(req.path);
          for (let name of Object.entries(req.query)) {
            decodeURIComponent(name);
          }
          if (req.body) {
            if (typeof req.body !== "object") return res.send("Body must be an object.");
          }
        } catch(e) {
          err = e;
        };
        if (err) {
          return res.send("An error has occured on your path name.");
        };

        next();
      } else {
        res.status(403);
        res.send("invalid api code")
        return;
      };
    } else {
      res.status(403);
      res.send("invalid api code")
      return;
    };
  });
  */
  //Check for updates
  let latestVersion = await api.getVersion();
  if (latestVersion.trim() === Package.version.trim()) {
    Log.Info("Latest version: " + latestVersion);
  } else {
    Log.Warn(
      "Updates are avaliable \nCurrent version: " +
        Package.version +
        "\nLatest version: " +
        latestVersion
    );
  }
  
  app.get('/servers/list', Docker.ListServers); 
  app.post('/servers/install', Docker.install); 

  app.get('/servers/power/start', Docker.Start); 
  app.get('/servers/power/stop', Docker.Stop); 
  app.get('/servers/power/restart', Docker.Restart); 
  app.get('/servers/power/kill', Docker.Kill); 
  
  app.get('/servers/delete', Docker.Remove);
  
  app.ws('/servers/console', Docker.Console);  

  /*
  app.get('/start/minecraft', function(req,res){ 
    res.send("<h2>Have a nice day</h2>");
  });
  */
};

Main();
