const express = require("express")
const app = express()
const path = require("path")
const Book = require("./models/bookModel")
const Review = require("./models/reviewModel")
const methodOverride = require("method-override")
const router = express.Router()
const mongoose = require('mongoose');

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(methodOverride("_method"))
app.use(express.static(path.join(__dirname, "public")));


mongoose.connect('mongodb://localhost:27017/rabbit-hole');

app.get("/books/new", (req, res) => {
    res.render("books/new")
})

app.route("/books/:id")
    .get(async (req, res) => {
        const { id } = req.params
        const book = await Book.findById(id).populate("reviews")
        const reviews = book.reviews
        let sum = 0;
        for (let review of reviews) {
            console.log(review)
            sum += review.rating
        }
        const ave_rating = (reviews.length === 0) ? "" : (sum / reviews.length).toFixed(1)
        res.render("books/show", { book, ave_rating })
    })
    .post(async (req, res) => {
        const { id } = req.params
        const book = await Book.findById(id)
        const newReview = new Review(req.body.review)
        await newReview.save()
        book.reviews.push(newReview._id)
        await book.save()
        res.redirect(`/books/${id}`)
    })

app.get("/books/:id/review", async (req, res) => {
    const { id } = req.params;
    const book = await Book.findById(id)
    res.render("reviews/new", { book })
})

app.route("/books/:id/review/:reviewId")
    .get(async (req, res) => {
        const { id, reviewId } = req.params
        const review = await Review.findById(reviewId)
        const book = await Book.findById(id)
        res.render("reviews/edit", { review, book })
    })
    .put(async (req, res) => {
        const { id, reviewId } = req.params
        await Review.findByIdAndUpdate(reviewId, req.body.review)
        res.redirect(`/books/${id}`)
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