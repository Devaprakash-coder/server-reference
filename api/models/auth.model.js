'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const UserSchema = new Schema({
    company_id: String
    , branch_id: String
    , name: String
    , email: String
    , password: String
    , user_type: {
        type: String
        , enum: ["superadmin", "admin", "manager", "staff"]
    }
    , user_status: {
        type: String
        , enum: ["active", "inactive"]
        , default: "active"
    }
    // , login_pin: {
    //     type: String
    //     , default: '0000'
    // }
    , created_date: {
        type: Date
        , default: Date.now
    }
    , reset_password_token : String
    , reset_password_expires : Date
});

/**
 * Pre-validation
 * Notes: This validation Occurs before the save operation
 */
UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) return next();
    if (user.password) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err)
            };
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) return next();
                user.password = hash;
                next(err)
            })
        })
    }
});

/**
 * Pre-validation
 * Notes: This validation Occurs before the update operation
 */
UserSchema.pre('update', function (next) {
    var user = this;
    if (user._update.$set.password) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err)
            };
            bcrypt.hash(user._update.$set.password, salt, null, function (err, hash) {
                if (err) return next();
                user._update.$set.password = hash;
                next(err)
            })
        })
    }else{
        next();
    }
});

/**
 * Note: Method Used to Compare the Password
 * Gets called when the user login
 * Compares local password and hashed password
 */
UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);