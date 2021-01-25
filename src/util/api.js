var fetch = require("node-fetch");

exports.getVersion = (data) => {
  return fetch(
    "https://raw.githubusercontent.com/RoboPanel/Daemon/main/latest",
    {
      method: "GET",
    }
  ).then((res) => res.text());
};
