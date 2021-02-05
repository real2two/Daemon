const Console = require("./console.js");

module.exports.load = async function(app, docker) {
  app.post("/start/:id", async (req, res) => {

    // Set the id variable.

    let id = req.params.id;

    // Gets and starts the container.

    let container = docker.getContainer(id);
    container.start((err) => {
      if (err) {
        return res.send({
          error: "An error has occured when attempting to start the container."
        });
      }

      Console.attachContainer(id);
      
      res.send({
        error: "none"
      });
      
    });
  });
};