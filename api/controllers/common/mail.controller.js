const nodemailer = require("nodemailer"),
    crypto = require('crypto'),
    async = require('async');

const Templates = require('../../templates/mail.templates');
const config = require('../../../config/config');   //NOTE: Use it for development
// const base_url = config.development.base_url;   //NOTE: Use it for development
const base_url = config.production.base_url;  //NOTE: Use it for production
const User = require('../../models/auth.model');

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport({
    host: config.mailOptions.host,
    port: config.mailOptions.port,
    secure: config.mailOptions.secure,
    auth: {
        user: config.mailOptions.auth.user,
        pass: config.mailOptions.auth.pass
    },
    tls: { rejectUnauthorized: false }
});

/**
 * Note: This is a common function for sending mail
 * which inturns returns a callback with success or failure
 */
function sendMail(query, callback) {
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: query.from, // sender address
        to: query.to, // list of receivers
        subject: query.subject, // Subject line
        text: query.text, // plaintext body
        html: query.html // html body
    }
    smtpTransport.sendMail(mailOptions, function (err) {
        return new Promise(res => callback(err, 'done'));
    });
}

/**
 * Function Used only for password reset
 */
exports.passwordReset = (req, res, next) => {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }, function (err, user) {
                if (!user) {
                    console.error({
                        status: 0,
                        message: 'Email not exists',
                        error: 'email not exists'
                    });
                    return res.status(401).json({
                        status: 0,
                        message: 'Invalid Email',
                        error: 'Email not Found'
                    })
                }

                user.reset_password_token = token;
                user.reset_password_expires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            let link = `${base_url}reset_password/${token}`;

            let template = Templates.getResetpasswordTemplate(link, user.name, function (template) {
                return template
            });

            let query = {
                from: "Team POS ✔ <noreply-team@dinamic.io>", // sender address
                to: `${req.body.email}`, // list of receivers //NOTE: this should changes to user.email
                subject: "Dinamic POS - password reset", // Subject line
                text: "Dinamic POS - password reset", // plaintext body
                html: template // html body
            }
            sendMail(query, (err) => {
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) {
            res.status(500).send({
                status: 0,
                message: 'Error sending email! please try again!',
                error: err
            })
        }else{
            console.info({
                status: 0,
                message: 'Success at last'
            })
    
            res.status(200).send({
                status: 1,
                message: 'Mail Send Successfully'
            })
        }
    });
};

/**
 * Function Used Only for update password
 */
exports.resetPassword = (req, res, next) => {
    //TODO: Update password
    async.waterfall([
        function (done) {
            User.findOne({ reset_password_token: req.params.tokenKey, reset_password_expires: { $gt: Date.now() } }, function (err, user) {
                if(err) {
                    console.error(err);
                    res.status(500).json({
                        status: 0,
                        message: 'problem with the server',
                        error: 'problem with the server'
                    })
                }else if (!user) {
                    console.error({
                        status: 0,
                        message: 'Error Finding User',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'Password reset token is invalid or has expired.',
                        error: 'Invalid token.'
                    })
                }else{
                    user.password = req.body.new_password;
                    user.reset_password_token = undefined;
                    user.reset_password_expires = undefined;
    
                    user.save(function (err) {
                        done(err, user);
                    });
                }
            });
        },
        function (user, done) {
            let link = `${base_url}login`;
            
            let template = Templates.getSuccessResestpassword(link, user.name, function (template) {
                return template
            });

            let query = {
                from: "Team POS ✔ <noreply-team@dinamic.io>", // sender address
                to: "vinopravin.m@gmail.com", // list of receivers //NOTE: this should changes to user.email
                subject: "Dinamic POS - Success Confirmation", // Subject line
                text: "Dinamic POS - Success Confirmation", // plaintext body
                html: template // html body
            }
            sendMail(query, (err) => {
                done(err, 'done');
            });
        }
    ], function (err) {
        if(err) {
            console.error({
                status: 0,
                message: 'error sending email',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'error sending email',
                error: 'Problem with the server'
            });
        }else{
            res.status(200).json({
                status: 1,
                message: 'Password reset successfully'
            })
        }
    });
};

/**
 * Function Used Only for update password
 */
exports.setPin = (req, res, next) => {
    User.findOne({ email: req.email }, function (err, user) {
        if (!user) {
            console.error({
                status: 0,
                message: 'Email not exists',
                error: 'email not exists'
            });
            return res.status(401).json({
                status: 0,
                message: 'Invalid Email',
                error: 'Email not Found'
            })
        }else{
            let link = `${base_url}login`;

            let template = Templates.setPinTemplate(link, user.name, req.pin, function (template) {
                return template
            });


            let query = {
                from: "Team POS ✔ <noreply-team@dinamic.io>", // sender address
                to: `${req.email}`, // list of receivers //NOTE: this should changes to user.email
                subject: "Dinamic POS - Welcome to POS", // Subject line
                text: "Dinamic POS - welcome to POS", // plaintext body
                html: template // html body
            }
            sendMail(query, (err) => {
                return
            });
        }
    });
};