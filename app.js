//app.js4567
var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.set("view engine", "jade");
app.set("views", "./views");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/template", function (req, res) {
  res.render("temp");
});

app.get("/form", function (req, res) {
  res.render("form");
});

app.post("/form_receiver", function (req, res) {
  var title = req.body.title;
  var disc = req.body.description;
  res.send(title + ", " + disc);
});

app.get("/topic", function (req, res) {
  var topics = ["js is..", "node is..", "exp is..."];

  res.send(req.query.id);
});

app.get("/", function (req, res) {
  res.send("<h1>Hello home page</h1>");
});

app.get("/login", function (req, res) {
  res.send("Login please");
});

app.get("/dynamic", function (req, res) {
  var output = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>node study</title>
        </head>
        <body>
            <h1>hello, Node.js</h1>
        </body>
    </html>
    `;
  res.send(output);
});

app.listen(3000, function () {
  console.log("Connected 3000 port!");
});
