// code largely based off of https://github.com/jeremytammik/NodeWebGL/blob/master
var express = require('express');
var app = express();

app.set('port',(process.env.PORT||5000));
app.use(express.static(__dirname));

app.set('view engine', 'ejs');
app.set('views','.');

app.get('/',function(req,res) { res.render('plant'); });

var body_parser = require('body-parser');
app.use(body_parser.json({ limit: '1mb' }));
app.use(body_parser.urlencoded({ extended:true, limit:'1mb' }));

app.listen(app.get('port'), function() {
  console.log("port"); });
