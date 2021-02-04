const Console = require("./console.js");

module.exports.load = async function(app, docker) {
  app.post("/execute/:id", async (req, res) => {

    // Set the id variable.

    let id = req.params.id;
    let command = req.body.command;

    if (!command) return res.send({
      error: "Missing command."
    });

    if (typeof command !== "string") return res.send({
      error: "The command must be a string."
    });

    if (command.length == 0) return res.send({
      error: "The command must be greater than 0 characters."
    });

    // Gets the container and executes a command.

    let container = docker.getContainer(id);

    container.exec({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: [command],
      Tty: false,
    }).then(exec => {
      exec.start({ hijack: true });
    })

    Console.addContainerMessage(id, "> " + command);

    res.send({
      error: "none"
    });
  });
};