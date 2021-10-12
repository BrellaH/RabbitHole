if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express")
const app = express()
const path = require("path")
const Book = require("./models/bookModel")
const Review = require("./models/reviewModel")
const User = require("./models/userModel")
const methodOverride = require("method-override")
const passport = require("passport")
const router = express.Router()
const session = require("express-session")
const flash = require("connect-flash")
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(methodOverride("_method"))
app.use(express.static(path.join(__dirname, "public")));

const DBUrl = process.env.mongoURL || 'mongodb://localhost:27017/rabbit-hole'
const secret = process.env.secret || "this is my secret"

const store = MongoStore.create({
    secret,
    mongoUrl: DBUrl,
    touchAfter: 24 * 3600
})

const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true }
}
app.use(session(sessionConfig))
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash())
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    next()
})

const isLoggedin = function (req, res, next) {
    //console.log(req.path, req.originalUrl)
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash("error", "You must sign in first.")
        return res.redirect("/")
    }
    next()
}


//mongoose.connect('mongodb://localhost:27017/rabbit-hole');
mongoose.connect(DBUrl);
app.route("/user/login")
    .get((req, res) => {
        //console.log(req.flash("error"))
        res.render("users/login")
    })
    .post(passport.authenticate('local', { failureFlash: 'Invalid username or password.', failureRedirect: '/user/login' }), async (req, res) => {
        req.flash('success', 'welcome back!');
        const redirectUrl = req.session.returnTo || "/books";
        delete redirectUrl;
        res.redirect(redirectUrl);
        //res.send("hehe")
    })
app.route("/user/signup")
    .get((req, res) => {
        res.render("users/signup")
    })
    .post(async (req, res, next) => {
        const { username, password } = req.body;
        const user = new User({ username });
        const newUser = await User.register(user, password)
        req.login(newUser, function (err) {
            if (err) return next(err);
            const redirectUrl = req.session.returnTo || "/books";
            delete redirectUrl;
            res.redirect(redirectUrl);
        })
    })

app.get("/user/logout", (req, res) => {
    req.logout();
    res.redirect("/books")
})


app.get("/books/new", isLoggedin, (req, res) => {
    res.render("books/new")
})

app.route("/books/:id")
    .get(async (req, res) => {
        const { id } = req.params
        const book = await Book.findById(id).populate("reviews")
        const reviews = book.reviews
        let sum = 0;
        for (let review of reviews) {
            //console.log(review)
            sum += review.rating
        }
        const ave_rating = (reviews.length === 0) ? "" : (sum / reviews.length).toFixed(1)
        res.render("books/show", { book, ave_rating })
    })
    .post(isLoggedin, async (req, res) => {
        const { id } = req.params
        const book = await Book.findById(id)
        const newReview = new Review(req.body.review)
        //console.log(req.user.username)
        newReview.author = req.user.username
        //console.log(newReview)
        await newReview.save()
        book.reviews.push(newReview._id)
        await book.save()
        res.redirect(`/books/${id}`)
    })

app.get("/books/:id/review", isLoggedin, async (req, res) => {
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
    .delete(async (req, res) => {
        const { id, reviewId } = req.params
        await Review.findByIdAndDelete(reviewId)
        await Book.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
        res.redirect(`/books/${id}`)
    })

app.route("/books")
    .get(async (req, res) => {
        //if (req.user) { console.log(req.user._id) }
        const books = await Book.find()
        res.render("books/index", { books })
    })
    .post(isLoggedin, async (req, res) => {
        const newBook = new Book(req.body.book)
        await newBook.save()
        res.redirect("/books")
    })

app.get("/", (req, res) => {
    res.render("home")
})

app.listen(3000, () => {
    console.log("Listening on port 3000")
})