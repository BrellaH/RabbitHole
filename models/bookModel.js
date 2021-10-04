const mongoose = require("mongoose")

const Schema = mongoose.Schema;
const bookSchema = new Schema({
    title: String,
    author: String,
    reviews: [{
        type: mongoose.Schema.ObjectId,
        ref: "Review"
    }]
})
module.exports = mongoose.model('Book', bookSchema);
