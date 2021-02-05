const Console = require("./console.js");
const fs = require("fs");

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

    Console.addContainerMessage(id, "> " + command);

    container.exec({
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: false,
      Cmd: ["-it", "echo", command]
    }).then(exec => {
      exec.start( { hijack: true, stdin: true } );
    });

    res.send({
      error: "none"
    });
  });
};