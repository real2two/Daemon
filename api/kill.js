const Console = require("./console.js");

module.exports.load = async function(app, docker) {
  app.post("/kill/:id", async (req, res) => {

    // Set the id variable.

    let id = req.params.id;

    // Gets and deletes the container.

    let container = docker.getContainer(id);
    container.kill((err) => {
      if (err) {
        return res.send({
          error: "An error has occured when attempting to kill the container."
        });
      }

      Console.resetContainer(id);
      
      res.send({
        error: "none"
      });
      
    });
  });
};