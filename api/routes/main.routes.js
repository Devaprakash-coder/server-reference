"use strict";
const express = require("express");
const router = express.Router();
const sharp = require('sharp');
const branchController = require("../controllers/branch.controller");
const financeController = require("../controllers/finance_lookup.controller");
const companyController = require("../controllers/company.controller");
const memberController = require("../controllers/member.controller");
const fs = require("fs");
const User = require("../models/auth.model");
const CompanyDetail = require('../models/company.model');

const path = require('path'),
	multer = require('multer'),
	crypto = require('crypto');


var storage = multer.diskStorage({
	destination: './uploads/images/',
	filename: function (req, file, cb) {
		crypto.pseudoRandomBytes(16, function (err, raw) {
			if (err) return cb(err)

			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
})

//define the type of upload multer would be doing and pass in its destination, in our case, its a single file with the name photo
var upload = multer({ storage: storage }).single('photo');

//TODO : Remove PIN Endpoint
router.post("/pin", (req, res) => {
	let enteredPin = req.body;
	User.findOne(
		{ _id: req.userId, login_pin: enteredPin.pin },
		"name",
		(err, user) => {
			if (err) {
				console.error("error validatin pin", err);
				res.status(500).json({
					status: 0,
					message: 'error validating pin',
					error: 'problem with the server'
				})
			} else {
				if (!user) {
					res.status(401).send("Invalid PIN");
				} else {
					res.status(200).send(user);
				}
			}
		}
	);
});

// TODO : Remove Member & Members endpoint
/**
 * MEMBERS
 */
// UNUSED
router
	.route("/members")
	.get(memberController.get_company_members)
	.post(memberController.add_new_member)
	.put(memberController.update_member)
	.delete(memberController.remove_member);

// UNUSED
router
	.route("/member")
	.get(memberController.get_branch_members)
	.post(memberController.login_member);
// .put(memberController.update_member)
// .delete(memberController.remove_member);

/**
 * For Handling Users
 */
router
    .route('/branch_admin/:branchId')
    .get(branchController.get_branch_admin);


/**
 * COMPANY
 */
router
	.route("/company")
	.get(companyController.get_company_details)
	.post(companyController.add_new_details)
	.put(companyController.update_company_details)
	.delete(companyController.delete_company_details);

router
	.route('/company/banner')
	.post(companyController.updateBanner)
	.patch(companyController.removeBanner)

//------------------ COMPANY SUB ROUTES ---------------------//
router
	.route("/discount")
	.put(companyController.update_discount_reason)
	.patch(companyController.remove_discount_reason);

router
	.route("/stock")
	.put(companyController.update_stock_movement)
	.patch(companyController.remove_stock_movement);

//------------------------- LOCATION ------------------------//
router
	.route("/branches")
	.get(branchController.list_all_branches)
	.post(branchController.create_new_branch)
	.put(branchController.update_a_branch) //NOTE: Not used anywhere
	.patch(branchController.delete_a_branch);

/**
 * Admin Branches
 */
router
	.route("/adminbranches")
	.get(branchController.getAdminBranchList)

router
	.route("/branches/:branchId")
	.get(branchController.read_a_branch)
	.put(branchController.update_a_branch)
// .delete(branchController.delete_a_branch);

router
	.route("/branch/tableplans")
	.put(branchController.update_table_plan)
	.patch(branchController.remove_table_plan)

router
	.route("/branch/menusections")
	.put(branchController.update_menu_section)
	.patch(branchController.remove_menu_section)

router
	.route("/branch/newmenusections")
	.put(branchController.update_new_menu_section)
	.patch(branchController.remove_new_menu_section)

router
	.route("/branch/departments")
	.put(branchController.updateDepartments)
	.patch(branchController.removeDepartments)

router
	.route("/branch/department")
	.patch(branchController.switchDepartmentLayer)

router
	.route('/branch/departmentbanner')
	.post(branchController.updateDepartmentBanner)
	.patch(branchController.removeDepartmentBanner)
	.put(branchController.switchDepartmentBanner)

router
	.route("/branch/printers")
	.put(branchController.update_printers)
	.patch(branchController.remove_printers)

router
	.route("/branch/printer-server")
	// .get(branchController.get_printer_server) // Not Used GET Method For now
	.put(branchController.update_printer_server)
	.post(branchController.make_default_printer_server)
	.patch(branchController.remove_printer_server)

//------------------------- FINANCIALS ------------------------//
router
	.route("/finance")
	.get(financeController.list_finance_types_company)

router
	.route("/finance/:branchId")
	.get(financeController.list_finance_types)
	.post(financeController.add_finance_type);

router
	.route("/tender")
	.put(financeController.update_tender_type)
	.patch(financeController.remove_tender_type);

router
	.route("/taxrate")
	.put(financeController.update_tax_rate)
	.patch(financeController.remove_tax_rate);

router
	.route("/pettycash")
	.put(financeController.update_petty_cash)
	.patch(financeController.remove_petty_cash);
router
	.route("/synccatelogue/:branchId/")
	.get(branchController.synccatelogue);
router
	.route('/upload')
	.post((req, res) => {
		let imgdata = req.body.image;
		var filename = Math.floor(Math.random() * Math.floor(999999));
		var filetype = "";
		if (imgdata.indexOf('png;base64') > -1) {
			var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
			filetype = ".png";
			var newpath = 'uploads/images/' + filename + filetype;
		} else {
			filetype = ".jpeg";
			var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
			var newpath = 'uploads/images/' + filename + filetype;
		}

		fs.writeFile(newpath, base64Data, 'base64', function (err) {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'error uploading image'
				})
			}else {

				/**
				 * Note: This multi image resizing is used to improve performance on the app
				 */
				let small_image_dir = 'uploads/images/small/';
				let medium_image_dir = 'uploads/images/medium/';

				if (!fs.existsSync(small_image_dir)) {
					fs.mkdirSync(small_image_dir, { recursive: true })
				}
				if (!fs.existsSync(medium_image_dir)) {
					fs.mkdirSync(medium_image_dir, { recursive: true })
				}
				
				sharp(newpath).resize(100,100).jpeg({quality : 50}).toFile(`${small_image_dir}${filename}${filetype}`); 
				sharp(newpath).resize(200,200).jpeg({quality : 80}).toFile(`${medium_image_dir}${filename}${filetype}`); 

				CompanyDetail.findById(req.companyId, (err, company_detail) => {
					if (err) {
						return handleError(err);
					}
					company_detail.set({ 'logo_url': newpath });
					//TODO need to restrict the returning data
					company_detail.save((err, updatedDetails) => {
						if (err) return err;
						res.send(updatedDetails);
					});
				})
			}



		});
	})

module.exports = router;
