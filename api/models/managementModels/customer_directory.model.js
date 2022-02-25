'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const addressSchema = new Schema({
    person_name: String
    , person_contact: String
    , address : String
    , landmark: String
    , address_name: String
})

const customerSchema = new Schema({
    company_id: String
    , branch_id: String
    , name: String
    , email: String
    , password: String
    , addresses: [addressSchema]
    , gender: String
    , contact_number: String
    , visits: { type: Number, default: 0 }
    , reward_points: { type: Number, default: 0 }
    , status: { type : String, default: 'active' }
    , registered: { type: Boolean, default: false }
    , customer_type : { type: String, default: 'new' }
    //extra data
    , social_unique_id: String
    , registered_by: String
    , device_type: String //Should be fetched inside device token
    , device_token: {
        type: Array
        , default: []
    }
    , contact_number_verfied: { type: Boolean , default: false }
    , email_verified: { type: Boolean , default: false }
    , otp : Number
    , created_at: {
        type: Date,
        default: Date.now
    }
});

customerSchema.pre('save', function (next) {
    var user = this;
    if(!user.isModified('password')) return next();
    if(user.password) {
        bcrypt.genSalt(10, function(err, salt) {
            if(err) {
                return next(err)
            };
            bcrypt.hash(user.password, salt, null, function(err, hash) {
                if(err) return next();
                user.password = hash;
                next(err)
            })
        })
    }
});

// UserSchema.method.compare
customerSchema.methods.comparePassword = function(password)  {
    return bcrypt.compareSync(password, this.password);
};


customerSchema.methods.compareSocialId = function(social_unique_id)  {
    return social_unique_id === this.social_unique_id;
};


module.exports = mongoose.model('customer_directory', customerSchema);