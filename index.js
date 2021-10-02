const express = require("express")
const app = express()
const path = require("path")
const Book = require("./models/bookModel")
const Review = require("./models/reviewModel")
const router = express.Router()
const mongoose = require('mongoose');

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.json())


mongoose.connect('mongodb://localhost:27017/rabbit-hole');

app.get("/books/new", (req, res) => {
    res.render("books/new")
})

app.get("/books/:id", async (req, res) => {
    const { id } = req.params
    const foundBook = await Book.findById(id)
    res.render("books/show", { foundBook })
})

app.route("/books")
    .get(async (req, res) => {
        const books = await Book.find()
        res.render("books/index", { books })
    })
    .post(async (req, res) => {
        const newBook = new Book(req.body.book)
        await newBook.save()
        console.log(newBook)
        res.redirect("/books")
    })

app.get("/", (req, res) => {
    res.send("this is home page")
})

app.listen(3000, () => {
    console.log("Listening on port 3000")
})