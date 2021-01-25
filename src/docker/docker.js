const Docker = require("dockerode");
const stream = require("stream");
const Log = require("../util/logger");

const docker = new Docker();

let dockers = [];
let logs = {};

docker.listContainers(function (err, containers) {
  if (!containers) return;
  containers.forEach(function (containerget) {
    let containerName = containerget.Names[0].slice(1);
    let container = docker.getContainer(containerName);
    dockers.push(containerName);
    logs[containerName] = [];
    container.attach(
      { stream: true, stdout: true, stderr: true },
      (err, stream) => {
        stream.on('data', chunk => {
          if (logs[containerName].length >= 100) logs[containerName].slice(1);
          logs[containerName].push("[CONSOLE] " + chunk.toString("utf8"));
        });
      }
    );
  });
});

exports.ListServers = (req, res) => {
  try {
    docker.listContainers(function (err, containers) {
      if (!containers) return res.send({ containers: null });
      res.send({ containers: containers });
    });
  } catch(err) {
    console.log(err);
  }
}

exports.install = (req, res) => {
  try {
    let installName = req.body.id;
    if (!installName) return res.send("Missing server id.");
  
    if (!req.body.port) return res.send("Missing port.");
    if (isNaN(parseFloat(req.body.port))) return res.send("Port could not be parsed to a number.");
    let port = Math.round(parseFloat(req.body.port));
    if (port < 1) return res.send("Port must greater than 0.");
  
    let image = req.body.image;
    if (!image) return res.send("Missing image.")
  
    let env = req.body.env;
    if (!env) return res.send("Missing env.")

    if (typeof env == "string") {
      try {
        env = JSON.parse(env);
      } catch(err) {
        return res.send("ENV must be an array.");
      }
    }

    if (!Array.isArray(env)) return res.send("ENV must be an array.");
  
    // I'm going to comment this right here: I didn't want to use JSON.parse() but it doesn't work without it and I can't seem to use `these` on variable names.
    let exposedports = JSON.parse(`{
      "${port}/tcp": {}
    }`);
  
    let portbindings = JSON.parse(`{
      "${port}/tcp": [
        {
          "HostPort": "${port}"
        }
      ]
    }`);
  
    Log.Info("Pulling from docker");
    docker.pull(image, (err, stream) => { //"itzg/minecraft-server"
      if (err) {
        Log.Error(err); //This errors if docker isnt installed/running
        Log.Error("Make sure docker is installed and running.");
        return;
      }
      //stream.pipe(pullStream);
      const onFinished = () => {
        Log.Info("Succesfully pulled docker image.");
        Log.Info("Creating docker container.");
        docker.createContainer(
          {
            Image: "itzg/minecraft-server:latest",
            Env: env, //TODO: make these configurable
            name: installName,
            Tty: true,
            ExposedPorts: exposedports,
            Hostconfig: {
              Binds: [process.cwd() + "/servers/" + installName + ":/data"],
              PortBindings: portbindings,
            },
          },
          (err) => {
            if (err) {
              Log.Error(err);
              Log.Error("Error creating container.");
              res.sendStatus(500);
              return;
            }
            Log.Info("Successfully created container " + installName);
  
            let container = docker.getContainer(installName);
            logs[installName] = [];
            dockers.push(installName);
            container.attach(
              { stream: true, stdout: true, stderr: true },
              (err, stream) => {
                stream.on('data', chunk => {
                  if (logs[installName].length >= 100) logs[installName].slice(1);
                  logs[installName].push("[CONSOLE] " + chunk.toString("utf8"));
                });
              }
            );
  
            res.sendStatus(200);
          }
        );
      };
      docker.modem.followProgress(stream, onFinished);
    });
  } catch(err) {
    console.log(err);
  }
};

exports.Start = async (req, res, ws) => {
  try {
    let startName = req.query.id;
    if (!startName) return res.send("Missing server id.");
  
    Log.Info("Starting server container");
    var container = docker.getContainer(startName);
    container.start((err) => {
      if (err) {
        Log.Error(err);
        Log.Error("Error starting container");
        res.send("error")
        return;
      }
      Log.Info("The container has been started.");
  
      if (!logs[startName]) logs[startName] = [];
      if (logs[startName].length >= 100) logs[startName].slice(1);
      logs[startName].push("[STATUS] Starting server...")
  
      res.send("success")
      
      /*
      container.attach(
      { stream: true, stdout: true, stderr: true },
      (err, stream) => stream.pipe(process.stdout)
      );
      */
      
    });
  } catch(err) {
    console.log(err);
  }
};

exports.Stop = (req, res) => {
  try {
    let stopName = req.query.id;
    if (!stopName) return res.send("Missing server id.");
  
    Log.Info("Stopping server container");
    var container = docker.getContainer(stopName);
    container.stop((err) => {
      if (err) {
        Log.Error(err);
        Log.Error("Error stopping container");
        res.send("error");
        return;
      }
      Log.Info("The container has been stopped.");
      res.send("success")
      /*
      container.attach(
      { stream: true, stdout: true, stderr: true },
      (err, stream) => stream.pipe(process.stdout)
      );
      */
    });
  } catch(err) {
    console.log(err);
  }
};

exports.Restart = (req, res) => {
  try {
    let restartName = req.query.id;
    if (!restartName) return res.send("Missing server id.");
  
    Log.Info("Restarting server container");
    var container = docker.getContainer(restartName);
    container.kill((err) => {
      if (err) {
        Log.Error(err);
        Log.Error("Error restarting container");
        res.send("error 1");
        //process.exit(1);
        return;
      }
      if (!logs[restartName]) logs[restartName] = [];
      if (logs[restartName].length >= 100) logs[restartName].slice(1);
      logs[restartName].push("[STATUS] Killed the server.");
      container.start((err) => {
        if (err) {
          Log.Error(err);
          Log.Error("Error restarting container");
          res.send("error 2")
          return;
        }
        if (logs[restartName].length >= 100) logs[restartName].slice(1);
        logs[restartName].push("[STATUS] Starting server...");
        Log.Info("The container has been started.");
        res.send("success")
        /*
        container.attach(
        { stream: true, stdout: true, stderr: true },
        (err, stream) => stream.pipe(process.stdout) // maybe process.stdout idk
        );
        */
      });
      //container.attach(
      //{ stream: true, stdout: true, stderr: true },
      //(err, stream) => stream.pipe(startStream)
      //);
      //container.attach(
        //{ stream: true, stdout: true, stderr: true },
        //(err, stream) => stream.pipe(startStream)
      //);
    });
  } catch(err) {
    console.log(err);
  }
};

exports.Kill = (req, res) => {
  try {
    let killName = req.query.id;
    if (!killName) return res.send("Missing server id.");
  
    Log.Info("Killing server containter");
    var container = docker.getContainer(killName);
    container.kill((err) => {
      if (err) {
        Log.Error(err);
        Log.Error("Error killing container");
        res.send("error")
        return;
      }
      Log.Info("The container has been killed.");
  
      if (!logs[killName]) logs[killName] = [];
      if (logs[killName].length >= 100) logs[killName].slice(1);
      logs[killName].push("[STATUS] Killed the server.");
  
      res.send("success");
  
      //let startStream = new stream.Writable();
  
      /*
      container.attach(
      { stream: true, stdout: true, stderr: true },
      (err, stream) => stream.pipe(startStream)
      );
  
      startStream._write = (chunk, encoding, done) => {
        console.log(chunk.toString());
        //send this to the console
        done();
      };
      */
    });
  } catch(err) {
    console.log(err);
  }
};

exports.Remove = (req, res) => {
  try {
    let removeName = req.query.id;
    if (!removeName) return res.send("Missing server id.");
  
    Log.Info("Removing server containter");
    var container = docker.getContainer(removeName);
    container.remove((err) => {
      if (err) {
        Log.Error(err);
        Log.Error("Error removing container");
        res.send("error")
        return;
      }
      Log.Info("The container has been removed.");
      dockers = dockers.filter(d => d !== removeName);
      delete logs[removeName];
      res.send("success")
      //container.attach(
      //{ stream: true, stdout: true, stderr: true },
      //(err, stream) => stream.pipe(startStream)
      //);
    });
  } catch(err) {
    console.log(err);
  }
};

exports.Console = async (ws, req) => {
  try {
    let consoleName = req.query.id;
    if (!consoleName) {
      ws.close();
      return;
    }
  
    let wsinterval = setInterval(sendconsole, 1000);
  
    sendconsole();
  
    async function sendconsole() {
      if (ws.readyState == 1) {
        if (dockers.filter(d => d == consoleName).length == 1) {
          ws.send(JSON.stringify(logs[consoleName] ? logs[consoleName] : []));
        } else {
          clearInterval(wsinterval);
          ws.close();
        }
      } else {
        clearInterval(wsinterval);
      }
    }
  } catch(err) {
    console.log(err);
  }
}

//var startStream = new stream.Writable();
//startStream._write = (chunk, encoding, done) => {
//  console.log(chunk.toString());
//  //send this to the console
//  done();
//};

//var pullStream = new stream.Writable();
//pullStream._write = (chunk, encoding, done) => {
//  //Sometimes the chunk might include multiple objects. This code splits them.
//  chunk
//    .toString()
//    .split(/\r?\n/)
//    .forEach((str) => str && Log.Docker(JSON.parse(str).status));
//  done();
//};
//};