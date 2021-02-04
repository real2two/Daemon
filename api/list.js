module.exports.load = async function(app, docker) {
  app.get("/list", async (req, res) => {
    docker.listContainers({ all: true }, function (err, containers) {
      if (err) return res.send({
        error: "An error has occured when attempting list all containers.",
        dockererror: err
      });
      res.send({
        error: "none",
        containers: containers
      });
    });
  });
};