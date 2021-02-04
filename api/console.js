let docker;

let logs = {};
let consolecodes = {};

async function attachContainer(id) {
  let container = docker.getContainer(id);
  logs[id] = [];
  container.attach(
    { stream: true, stdout: true, stderr: true },
    (err, stream) => {
      stream.on('data', chunk => {
        if (logs[id].length >= 100) logs[id].slice(1);
        logs[id].push(chunk.toString("utf8"));
      });
    }
  );
}

async function deattachContainer(id) {
  delete logs[id];
}

async function resetContainer(id) {
  logs[id] = [];
}

exports.attachContainer = attachContainer;
exports.deattachContainer = deattachContainer;
exports.resetContainer = resetContainer;

module.exports.load = async function(app, docker2) {
  docker = docker2;

  docker.listContainers({ all: true }, function (err, containers) {
    if (!containers) return;
    containers.forEach(function (containerget) {
      attachContainer(containerget.Names[0].slice(1));
    });
  });

  app.post('/generateconsole/:id', function(req, res) {
    let code = Math.random().toString(36).substr(2);
    if (consolecodes[code]) code = Math.random().toString(36).substr(2);
    consolecodes[code] = req.params.id;
    res.send({
      error: "none",
      code: code
    });
    setTimeout(
      () => {
        delete consolecodes[code];
      }, 10000
    )
  });

  app.get('/console', function(req, res) {
    let code = req.query.code;
    if (!code) return res.send({ error: "Missing code." });
    if (!consolecodes[code]) return res.send({ error: "Invalid code." });

    res.render("console", {
      req: req,
      process: process
    });
  });

  app.ws('/console', async (ws, req) => {
    let code = req.query.code;
    if (!code) return ws.close();
    if (!consolecodes[code]) return ws.close();

    let id = consolecodes[code];
    delete consolecodes[code];
  
    let wsinterval = setInterval(sendconsole, 1000);
  
    sendconsole();
  
    async function sendconsole() {
      console.log(logs)
      if (ws.readyState == 1) {
        if (logs[id]) {
          ws.send(JSON.stringify(logs[id] ? logs[id] : []));
        } else {
          clearInterval(wsinterval);
          ws.close();
        }
      } else {
        clearInterval(wsinterval);
      }
    }
  });
};