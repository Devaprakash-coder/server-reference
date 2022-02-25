'use strict'
let Feedback = require('../../models/general/feedback.model');

exports.addFeedback = (req, res) => {

    if(!req.branchId || !req.userId) {
        console.error({
            status: 0,
            message: 'access denied',
            error: 'invalid access'
        });
        res.status(401).json({
            status: 0,
            message: 'access denied',
            error: 'invalid access'
        });
    }else{
        Feedback.findOne({ branch_id: req.branchId, user_id: req.userId }, (err, feedback) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'access denied',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'access denied',
                    error: 'problem with the server'
                });
            }else if(!feedback) {
                let feedbackData = req.body.feedback_details;

                feedbackData.user_id = req.userId;
                feedbackData.user_name = req.userName;
                feedbackData.branch_id = req.branchId;

                let feedback = new Feedback(feedbackData);
                feedback.save((err, savedFeedback) => {
                    if(err) {
                        console.error({
                            status: 0,
                            message: 'error saving feedback',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'error saving feedback',
                            error: 'problem with the server'
                        });
                    }else{
                        res.status(201).json({
                            status: 1,
                            message: 'feedback saved',
                            feedback: savedFeedback
                        });
                    }
                })
            }else{
                let feedbackData = req.body.feedback_details;
                let privacy = feedbackData.privacy ? feedbackData.privacy : feedback.privacy

                Feedback.findOneAndUpdate({ _id: feedback._id }, 
                    { $set: { updated_at: Date.now(), feedback_list: feedbackData.feedback_list, privacy: privacy }},
                    { new: true }, (err, savedFeedback) => {
                    if(err) {
                        console.error({
                            status: 0,
                            message: 'error saving feedback',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'error saving feedback',
                            error: 'problem with the server'
                        });
                    }else{
                        res.status(201).json({
                            status: 1,
                            message: 'feedback saved',
                            feedback: savedFeedback
                        });
                    }
                })
            }
        });
    }
}

exports.getBranchFeedback = (req, res) => {
    if(!req.branchId || !req.userId) {
        console.error({
            status: 0,
            message: 'access denied',
            error: 'invalid access'
        });
        res.status(401).json({
            status: 0,
            message: 'access denied',
            error: 'invalid access'
        });
    }else{
        Feedback.findOne({ branch_id: req.branchId, user_id: req.userId }, (err, feedback) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'no feedback found',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error getting feedback',
                    error: 'problem with the server'
                });
            }else if(!feedback) {
                res.status(200).json({
                    status: 0,
                    message: 'no feedback found'
                })
            }else{
                res.status(200).json({
                    status: 1, 
                    message: 'feedback obtained successfully',
                    feedback: feedback
                })
            }
        })

    }
}