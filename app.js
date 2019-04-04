var express = require("express");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var neo4j = require("neo4j-driver").v1;
var app = express();

//view engine setup

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//using bolt protocol driver to local host
const driver = neo4j.driver(
  "bolt://localhost",
  neo4j.auth.basic("neo4j", "pass")
);
const session = driver.session();

//Home Route
app.get("/", function(req, res) {
  session.run("MATCH (n:Character) RETURN n").then(function(result) {
    var charArr = [];
    result.records.forEach(function(record) {
      charArr.push({
        id: record._fields[0].identity.low,
        name: record._fields[0].properties.name
      });
    });

    session.run("MATCH (n:Item) RETURN n").then(function(resultItems) {
      var itemArr = [];
      resultItems.records.forEach(function(record) {
        itemArr.push(record._fields[0].properties);
      });
      res.render("index", {
        characters: charArr,
        items: itemArr
      });
    });
  });
});

//Add Character Route

app.post("/character/add", function(req, res) {
  var name = req.body.name;

  session
    .run("CREATE (n:Character {name:{nameParam}})  RETURN n.name", {
      nameParam: name
    })
    .then(function(result) {
      res.redirect("/");
      session.close();
    })
    .catch(function(error) {
      console.log(error);
    });
});

//Add Item route

app.post("/item/add", function(req, res) {
  var name = req.body.name;

  session
    .run("CREATE (n:Item {name:{nameParam}})  RETURN n.name", {
      nameParam: name
    })
    .then(function(result) {
      res.redirect("/");
      session.close();
    })
    .catch(function(error) {
      console.log(error);
    });
});

//Value connect route
app.get("/character/:id/values", function(req, res) {
  var name1 = req.body.name1;
  var name2 = req.body.name2;
  var amount = req.body.amount;

  session.run(
    "MATCH(a:Character {name:{nameParam1}}),(b:Item {name: {nameParam2}}) MATCH (a:Character),(b:Item) CREATE (a)-[r:VALUES { amount:{amountParam}}]->(b) RETURN type(r), r.amount",
    {
      nameParam1: name1,
      nameParam2: name2,
      amountParam: amount
    }
  );
  res.render("valuetable", {
    //Item, Character, Values as arrays
  });
});

//Value table route
app.get("/valuetable", function(req, res) {});

app.listen(3000);

console.log("Server on 3000");

module.exports = app;
