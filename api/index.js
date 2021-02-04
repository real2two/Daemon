module.exports.load = async function(app, docker) {
  app.get("/", async (req, res) => {
    res.send(
      {
        error: "none",
        version: process.env.version
      }
    );
  });
};