"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
    name: {
        type: String,
        required: "Please enter a Project Name!"
    }
});