// Modules
const express = require("express");
const bodyParser = require("body-parser")
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname +"/date.js");     // Used to extract today's date


// Initialize app
const app = express();



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/toDoList", { useNewUrlParser: true });


// Settingup all Schemas
const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});



// Initializing mongoose models
const Item = new mongoose.model("Item", itemsSchema);
const Lists = new mongoose.model("List", listSchema);



// Creating default list items
const item1 = new Item({
    name: "Welcome toDoList"
});

const item2 = new Item({
    name: "Hit + to add Item"
});

const item3 = new Item({
    name: "Hit this to delete Item"
});

const defaultItems = [item1, item2, item3];



// Index
app.get("/", function(req, res){

    // Get all the items from item model
    Item.find({}, function(err, items){
        if( items.length == 0) {

            // if no item was found insert defaultItems into Item model
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }
                else {
                    console.log("Successfully added defaultItems");
                }
            });
            res.redirect("/");
        }
        else{

            // var day = date.getDate();
            context = {
                listTitle: "Today",
                items: items
            }
            res.render("lists", context);
        }
    });

});



// About
app.get("/about", function(req, res){
    res.render("about");
});



// Custom lists
app.get("/:customListName", function(req, res){

    // Extract name from url using express routing parameters
    const customListName = _.capitalize(req.params.customListName);

    // Find if list was already created
    Lists.findOne({name:customListName}, function(err, foundList){
        if(!err){

            if(!foundList){

                // if not found create new list
                const newList = new Lists({
                    name: customListName,
                    items: defaultItems     // use default list items
                });

                newList.save()
                res.redirect("/"+customListName);

            }
            else {

                // if list was found render the list page
                context = {
                    listTitle: foundList.name,
                    items: foundList.items
                }

                res.render("lists", context);
            }

        }
    });
});




app.post("/", function(req, res){

    // Get the entered item and the list title
    const newItem = req.body.newItem;
    const listTitle = req.body.listTitle;

    // Create new Item
    const item = Item({
        name: newItem
    });

    // Add item to the coressponding list
    if(listTitle==="Today"){
        item.save();
        res.redirect("/");
    }
    else {
        Lists.findOne({name:listTitle}, function(err, foundList){
            if(!err){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+foundList.name);
            }
        });
    }
});




// Delete
app.post("/delete", function(req, res) {

    // Get the checked item id and the list title
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        // remove item from Item model if found
        Item.findByIdAndRemove(itemId, function(err){
            if(err){
                console.log(err);
            }
            else {
                console.log("Successfully Deleted itemName");
            }
            res.redirect("/")
        });

    }
    else {

        // pull the item from respective list in Lists model
        Lists.findOneAndUpdate({name:listName}, {$pull:{items:{_id:itemId}}}, function(err){
            if(!err) {
                res.redirect("/"+listName);
            }
        });
    }

});




// Server
app.listen(3000, function(){
    console.log("server is running on 3000");
});
