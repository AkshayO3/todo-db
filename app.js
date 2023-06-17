const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")
const app = express();


app.set('view engine', 'ejs');


mongoose.connect("mongodb+srv://akshay:xlzYPRC6BBSXCSPs@cluster0.xatr8oa.mongodb.net/todoDB", {useNewUrlParser: true, useUnifiedTopology: true})


const taskSchema = mongoose.Schema({ //Creating schema for the default list
    name: String
})


const listSchema = mongoose.Schema({ //Creating schema for dynamic list
    name: String,
    items: [taskSchema]
})


const Task = mongoose.model('Task', taskSchema)
const List = mongoose.model('List', listSchema)


//Creating default items for lists
const t1 = new Task({
    name: "Welcome to your to-do list."
})
const t2 = new Task({
    name: "Add the + button to add a a task."
})
const t3 = new Task({
    name: "<--- Press here to delete a task."
})


const defit = [t1, t2, t3]


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function (req, res) {
    Task.find().then((results) => {
        if (results.length === 0) { //If 0 tasks,then add the default tasks
            Task.insertMany(defit).then(() => {
                console.log("Insertion successful")
            }).catch((err) => {
                console.log("Error => " + err)
            })
            res.redirect("/")
        } else {
            res.render("list", {listTitle: "Today", newListItems: results})
        }
    }).catch((err) => {
        console.log("Failed => " + err)
    })
});


app.post("/", function (req, res) {
    const item = req.body.newItem;
    const listName = req.body.list;
    const add = new List({name: item})
    if (listName === "Today") { //Adding tasks to the default list
        const newTask = new Task({name: item});
        newTask.save().then(() => {
            console.log("Addition successful to Today")
            res.redirect("/")
        })
    } else { //Adding tasks to the dynamic lists
        List.findOne({name: listName}).then((result) => {
            result.items.push(add)
            result.save()
            res.redirect("/" + listName)
        })
    }
});


// Creating a list if there is none present,if a list of that name is present,add tasks to it.
app.get("/:cat", (req, res) => {
    let c = _.capitalize(req.params.cat)
    List.findOne({name: c}).then((result) => {
        if (result) {
            res.render("list", {listTitle: result.name, newListItems: result.items})
        } else {
            const list = new List({
                name: c,
                items: defit
            })
            list.save();
            res.render("list", {listTitle: c, newListItems: defit})
        }
    })
})


//About page
app.get("/about", function (req, res) {
    res.render("about");
});


//Deleting items when they are complete
app.post("/delete", function (req, res) {
    const itemid = req.body.checkbox
    const lis = req.body.list
    if (lis === "Today") { //Deleting a task from default list
        Task.findByIdAndRemove(itemid).then(() => {
            console.log("Delete successful")
            res.redirect("/")
        }).catch((err) => {
            console.log("Error in deletion " + err)
        })
    } else {  //Deleting the task from dynamic list
        List.findOneAndUpdate({name: lis}, {$pull: {items: {_id: itemid}}}).then(() => {
            res.redirect("/" + lis)
        })
    }
});


app.listen(3000, function () {
    console.log("Server ON");
});
