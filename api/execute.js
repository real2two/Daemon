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

    Console.addContainerMessage(id, "> " + command);

    container.exec({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ["-it", "echo", command]
    }).then(exec => {
        exec.start({hijack: true, stdin: true}, function(err, stream) {
        // shasum can't finish until after its stdin has been closed, telling it that it has
        // read all the bytes it needs to sum. Without a socket upgrade, there is no way to
        // close the write-side of the stream without also closing the read-side!
        fs.createReadStream('node-v5.1.0.tgz', 'binary').pipe(stream);

        // Fortunately, we have a regular TCP socket now, so when the readstream finishes and closes our
        // stream, it is still open for reading and we will still get our results :-)
        docker.modem.demuxStream(stream, process.stdout, process.stderr);
      });
    });

    res.send({
      error: "none"
    });
  });
};