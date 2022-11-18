const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    telegram_id: String,
    wallet_address: String,
    chat_id: String,
    orders: Number,
});

const User = mongoose.model("User", UserSchema);

module.exports = User;