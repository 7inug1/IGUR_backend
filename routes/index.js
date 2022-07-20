/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AWS = require("aws-sdk");
const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const User = require("../models/User");
const UsersController = require("./controllers/Users.controller");

puppeteer.use(StealthPlugin());

router.get("/users/:username/reports", UsersController.getReports);

router.post("/users/:username/reports/:reportId", UsersController.createReport);

router.get("/users/:username/reports/:reportId", UsersController.getReport);

router.get("/users", UsersController.getUsers); // Leaderboard

router.post("/users/:username", UsersController.getUser);

router.get('/*', UsersController.redirectUnavailablePages);

module.exports = router;
