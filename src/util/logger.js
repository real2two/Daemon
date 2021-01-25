const chalk = require("chalk");

exports.Info = (data) => {
  console.log("[INFO] " + data);
};

exports.Warn = (data) => {
  console.log(chalk.yellow("[WARN] ") + data);
};

exports.Error = (data) => {
  console.log(chalk.red("[ERROR] ") + data);
};

exports.Docker = (data) => {
  console.log(chalk.blue("[DOCKER] ") + data);
};
