"use strict";

require("dotenv").config();

var mongoose = require("mongoose");

var docker = require("./../docker/docker");

exports.create = (req, res) => {
  docker.Install(req.body.name, res);
};

exports.delete = (req, res) => {
    docker.Remove(req.body.name, res);
};

exports.update = (req, res) => {

}