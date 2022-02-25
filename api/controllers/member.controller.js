/**
 * Depricated
 */
'use strict';

/*
* Dependency Modules
*/
const Member = require("../models/member.model");
const User = require('../models/auth.model');

/**
 * Depricated Members APIs
 */


/**
 * Members Of a Company
 * @requires companyId
 */
exports.get_company_members = (req, res) => {
	/*
	 * ACTION: get all the members of particular company
	 */ 
}

/**
 * Members Of a Branch
 * @param branchId
 * @requires branchId
 */
exports.get_branch_members = (req, res) => {
	Member.find({ branch_id : req.branchId }, (err, members) => {
		if(err) {
			console.error({ 
				status: 0, 
				message : 'Error getting members number', 
				error: err
			});
			res.status(500).json({ 
				status : 0, 
				message: "Error getting members number",
				error: "Problem with server"
			});
		}
		res.status(200).json({ 
			status: 1, 
			message: "Data Obtained Successfully", 
			members: members
		})
	})
}

/**
 * Add New Member (Branch)
 * @requires MemberDetails
 */
exports.add_new_member = (req, res) => {
	let member = new Member(req.body);
	member.save((err, member) => {
		if (err) { 
			console.error({ 
				status : 0 , 
				message: "Error saving member", 
				error: err
			});
			res.status(500).json({ 
				status : 0, 
				message: "Error saving member",
				error: "Problem with server"
			}); 
		}
		res.status(200).json({ 
			status: 1, 
			message: "Data saved Successfully",  
			member: member
		});
	});
}

/**
 * Update Exisitng Member (Branch)
 */
exports.update_member = (req, res) => { 
	/**
	 * ACTION: Update Exisitng Member Detail
	 */
}

/**
 * Remove Existing Member(Branch)
 */
exports.remove_member = (req, res) => {
	/**
	 * ACTION: Remove Existing Member
	 */
}

/**
 * Member Login
 * @requires PIN
 */
exports.login_member = (req, res) => {
	if (req.accessType === 'superadmin') {
		let enteredPin = req.body;
		User.findOne(
			{ _id: req.userId, login_pin: enteredPin.pin },
			(err, user) => {
				if (err){ 
					console.error({ 
						status: 0, 
						message: "Error validating pin", 
						error: err
					});
					res.status(500).json({ 
						status : 0, 
						message: "Error validating pin",
						error: "Problem with server"
					}); 
				}
				else {
					if (!user) {
						res.status(401).json({ 
							status: 0, 
							message: "No member found",
							error: "Invalid PIN"
						});
					} else {
						res.status(200).json({ 
							status:1, 
							message: "Data Obtained Successfully", 
							user: user
						});
					}
				}
			}
		);
	} else if (req.accessType === 'admin' || req.accessType === "staffs") {
		let enteredPin = req.body;
		Member.findOne(
			{ branch_id: req.branchId, pin: enteredPin.pin },
			(err, user) => {
				if (err) {
					console.error({ 
						status : 0, 
						message : "Error validating pin", 
						error: err 
					});
					res.status(500).json({ 
						status : 0, 
						message: "Error validating pin",
						error: "Problem with server"
					}); 
				}
				else {
					if (!user) {
						res.status(401).json({ 
							status: 0, 
							mesage: "No Member found" ,
							error: 'Invalid PIN'
						});
					} else {
						res.status(200).json({ 
							status: 1, 
							message: 'Data Obtained Successfully', 
							user: user
						});
					}
				}
			}
		);
	}
}