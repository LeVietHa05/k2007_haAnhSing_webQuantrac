var express = require('express');
var router = express.Router();
var {envirData} = require("../socketio");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/chartdata", (req, res) => {
  res.json(envirData);
});

module.exports = router;
