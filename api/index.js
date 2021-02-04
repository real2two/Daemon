const fetch = require("node-fetch");

module.exports.load = async function(app, docker) {
  let latest = (await getVersion()).trim();
  if (latest == process.env.version) {
    console.log("You are using the latest version of RoboPanel.");
  } else {
    console.log("There is a new update avaliable!\nCurrent version: " + process.env.version + "\nLatest version: " + latest);
  }

  app.get("/", async (req, res) => {
    res.send(
      {
        error: "none",
        version: process.env.version
      }
    );
  });

  async function getVersion() {
    return fetch(
      "https://raw.githubusercontent.com/RoboPanel/Daemon/main/latest",
      {
        method: "GET",
      }
    ).then((res) => res.text());
  }
};