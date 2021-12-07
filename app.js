//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
mongoose.connect(env.remoteURL, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);
const item1 = {
  name: "Welcome to your Todo List"
};
const item2 = {
  name: "Use + Button to add items"
};
const item3 = {
  name: "<-- Hit Checkbox to delete items"
};
const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);
app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    }
    else {
      if (foundItems.length == 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          }
          else {
            console.log("Sucessfully Saved Default Items")
          }
          res.redirect('/');
        });
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }

    }
  });

});

app.post("/", function (req, res) {


  const newItem = req.body.newItem;
  const item = new Item({
    name: newItem
  });
  const customRoute = req.body.list;
  if (customRoute === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: customRoute }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + customRoute);
    });
  }


});
app.post("/delete", (req, res) => {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(itemId, (err) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Success");
      }
    })
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } }, (err, foundList) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }

});
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });

});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started Sucessfully");
});
