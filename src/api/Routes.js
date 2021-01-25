"use strict";
module.exports = function (app) {
  var dockerAPI = require("./Controller");

  app.route("/api/container/").post(dockerAPI.create);
  app.route("/api/container/:containerID").delete(dockerAPI.delete).put(dockerAPI.update)
};
