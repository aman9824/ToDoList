const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemSchema = new mongoose.Schema ({
  name: String
});

const workSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("item", itemSchema);

const bf = new Item ({ name: "Welcome to Todolist!"});
const cf = new Item ({ name: "Hit + to add a new Task"});
const ef = new Item ({ name: "<-- Hit to delete Task"});
let defaultItem = [bf,cf,ef];
const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItem, function(err) {
        if(err){
          console.log("Error loading Default items");
        } else {
          console.log("Successfully loaded Default, items");
        }
      });
      res.redirect("/");
    } else {
      res.render('list', {listTitle: "Today", newItems: foundItems});
    }
  });
});

app.post("/", function (req, res) {
  const listName = req.body.list;
  let item = new Item ({
    name: req.body.newItem
  });
  if(listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList)  {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.get("/:paramName", function (req, res) {
  const paramName = _.capitalize(req.params.paramName);
  List.findOne({name: paramName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        const list = new List ({
          name: paramName,
          items: defaultItem
        });
        list.save();
        res.redirect("/"+paramName);
      } else {
        res.render("list", {listTitle: foundList.name, newItems: foundList.items});
      }
    }
  });
});

app.post("/delete", function(req, res) {
  const listName = req.body.listName;
  const y = req.body.checkbox;
  if(listName == "Today") {
    Item.deleteOne({_id: y}, function(err){
      if(err) {
        console.log("Error While Deleting Element");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: y}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/"+listName);
      }
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server is running on Port 3000");
});
