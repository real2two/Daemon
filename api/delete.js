const Console = require("./console.js");

module.exports.load = async function(app, docker) {
  app.delete("/delete/:id", async (req, res) => {

    // Set the id variable.

    let id = req.params.id;

    // Gets and deletes the container.

    let container = docker.getContainer(id);
    container.remove((err) => {
      
      // Checks for any errors when attempting to remove the server.

      if (err) {
        return res.send({
          error: "An error has occured when attempting to delete the server.",
          dockererror: err
        });
      }

      Console.deattachContainer(id);
      
      res.send({
        error: "none"
      });
    });
  });
};