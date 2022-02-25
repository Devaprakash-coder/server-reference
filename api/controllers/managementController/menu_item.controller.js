"use strict";
const fs = require("fs");
const sharp = require("sharp");
const Items = require("../../models/managementModels/menu_item.model");
const CategoryModel = require("../../models/managementModels/menu_category.model");
const Member = require("../../models/managementModels/member_directory.model");
const Recipe = require("../../models/managementModels/inventory/recipes.model");
const Branch = require("../../models/branch.model");
const Urbanpiperresponse = require("../../models/omsModels/urbanpiper.model");
const DeliveryBrand = require("../../models/managementModels/delivery_brand.model");
const request = require("request");
const itemModel = require("../../models/managementModels/menu_item.model");
const mongoose = require("mongoose");
/**
 * Deprecated (new : get CategoryItems)
 */
// exports.getAllItemsOfCategory = (req, res) => {
//     Items.find({ category_id: req.params.categoryId }, (err, Items) => {
//         if (err) {
//             throw err
//         } else {
//             res.json(Items);
//         }
//     })
// };

/**
 * Get Items of a particular Category Type
 * @param categoryId
 * @param dayName ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ]
 */
exports.getCategoryItems = (req, res) => {
  let category_id = req.params.categoryId; //this will differ,  name should be changed as common instead a particular categoryId
  let requestedDay;
  let requestedCurrentTime;
  if (req.params.dayName) {
    // TODO: remove this if condition in future
    requestedCurrentTime = new Date(); // This will be restricted later for admin
    requestedDay = req.params.dayName
      ? req.params.dayName.toLowerCase()
      : undefined; // This will be restricted later for admin
  } else if (req.params.currentDate) {
    requestedCurrentTime = req.params.currentDate
      ? Number(req.params.currentDate)
      : undefined; // This will be restricted later for admin
    if (requestedCurrentTime) {
      requestedDay = new Date(requestedCurrentTime)
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
    }
  }

  /**
   * Note : Check For dayName to filter out items
   * available on a  particular day
   */

  if (requestedDay) {
    let matchQuery;
    if (req.query.name === "" || req.query.name) {
      matchQuery = {
        $match: {
          // $text: { $search: req.query.name },
          branch_id: category_id, // this will be branch_id, but due to some emergency it is named as category_id, its actually branch id
          name: { $regex: req.query.name, $options: "i" },
          item_status: { $ne: "removed" },
          //'available_days.day': requestedDay,
          "available_days.status": true,
        },
      };
    } else {
      matchQuery = {
        $match: {
          category_id: category_id,
          item_status: { $ne: "removed" },
          //'available_days.day': requestedDay,
          "available_days.status": true,
        },
      };
    }

    // NOTE: Used the square bracket to use variable in a mongo query
    Items.aggregate(
      [
        matchQuery,
        {
          $project: {
            available_days: {
              $filter: {
                input: "$available_days",
                as: "days",
                cond: { $eq: ["$$days.status", true] },
              },
            },
            // available_days: 1,
            _id: 1,
            imageUrl: 1,
            tags: 1,
            item_status: 1,
            branch_id: 1,
            category_id: 1,
            name: 1,
            skucode: 1,
            selling_price: 1,
            tax_rates: 1,
            is_applied_tax: 1,
            food_type: 1,
            kot_order: 1,
            combo_menu: 1,
            item_external_status: 1,
            addons: 1,
            item_description: 1,
            assigned_printer: 1,
            assigned_printers: 1,
            printer_id: 1,
            item_rank: 1,
            item_sold_in_month: 1, //NOt necessary to send this to client side
          },
        },
        { $sort: { item_rank: 1 } },
      ],
      async (err, item_list) => {
        if (err) {
          console.error({
            status: 0,
            message: "Error finding Item on that particular day",
            error: err,
          });
          res.status(500).json({
            status: 0,
            message: "Error finding Item on that particular day",
            error: "Problem with server",
          });
        } else if (!item_list.length) {
          res.status(200).json({
            status: 0,
            message: "No items found on a particular day",
            error: "No items asscoiated with the passed day parameter",
          });
        } else {
          let d = new Date(requestedCurrentTime);
          let year = d.getFullYear();
          let month = d.getMonth();
          let day = d.getDate();
          // let hour = d.getHours();
          // let minute = d.getMinutes();
          // let second = d.getSeconds();
          let current_time = d.getTime();

          let branchDetail = await Branch.findOne({
            _id: item_list[0].branch_id,
          });
          let currentTaxSetting = false;
          if (!branchDetail) {
            //TODO: send error response
          } else {
            currentTaxSetting = branchDetail.setting[0].inclusive_tax;
          }
          item_list.forEach((item) => {
            if (item.tax_rates && item.tax_rates.length) {
              item.item_tax_rates_value = 0;
              item.item_tax_rates_percentage = 0;
              item.is_inclusive_tax = currentTaxSetting;
              item.tax_rates.forEach((tax) => {
                if (tax.checked) {
                  item.item_tax_rates_value +=
                    (tax.percentage / item.selling_price) * 100;
                  item.item_tax_rates_percentage += tax.percentage;
                }
              });
              item.cost_inclusive_tax = Math.round(
                item.selling_price + item.item_tax_rates_value
              );
            } else {
              item.item_tax_rates_value = 0;
            }
          });

          let modified_list = await item_list.map((item) => {
            let nextAvailability;

            let k = 0;
            item.available_days
              .filter((availableDays, i) => {
                if (availableDays.day == requestedDay) {
                  if (i === item.available_days.length - 1) {
                    nextAvailability = item.available_days[i];
                  } else {
                    let temp_var;
                    temp_var = item.available_days[i];
                    if (temp_var.sessions && temp_var.sessions.length > 0) {
                      nextAvailability = item.available_days[i];
                    } else {
                      for (i; i < item.available_days.length; i++) {
                        if (item.available_days[i].sessions.length > 0) {
                          nextAvailability = item.available_days[i];
                          break;
                        }
                      }
                      if (!nextAvailability) {
                        for (let j = 0; j < item.available_days.length; j++) {
                          if (item.available_days[j].sessions.length > 0) {
                            nextAvailability = item.available_days[j];
                            break;
                          }
                        }
                      }
                    }
                  }

                  k = 1;
                  return availableDays;
                } else {
                  var dayNames = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ];
                  if (
                    k == 0 &&
                    i == item.available_days.length - 1 &&
                    !nextAvailability
                  ) {
                    var nextDay = new Date(d);

                    for (let j = 0; j < item.available_days.length; j++) {
                      for (let k = 0; k < dayNames.length; k++) {
                        nextDay.setDate(nextDay.getDate() + 1);

                        if (
                          item.available_days[j].day ==
                          dayNames[nextDay.getDay() - 1]
                        ) {
                          if (item.available_days[j].sessions.length > 0) {
                            nextAvailability = item.available_days[j];

                            break;
                          }
                        }
                      }
                    }
                    if (!nextAvailability) {
                      for (let j = 0; j < item.available_days.length; j++) {
                        if (item.available_days[j].sessions.length > 0) {
                          nextAvailability = item.available_days[j];
                          break;
                        }
                      }
                    }
                    return availableDays;
                  }
                }

                //k = k+1;
              })
              .map((days) => {
                if (days.sessions.length) {
                  days.sessions.forEach(async (session, i) => {
                    if (nextAvailability.day == requestedDay) {
                      if (session.from_time) {
                        let from_time = session.from_time.split(/ |:/);
                        let to_time = session.to_time.split(/ |:/);

                        let moded_from_time;
                        let moded_to_time;
                        if (from_time[2] && to_time[2]) {
                          // this means the time contains either AM or PM in it
                          from_time[0] =
                            from_time[2] === "PM"
                              ? String(Number(from_time[0]) + 12)
                              : from_time[0];
                          to_time[0] =
                            to_time[2] === "PM"
                              ? String(Number(to_time[0]) + 12)
                              : to_time[0];
                          moded_from_time = new Date(
                            year,
                            month,
                            day,
                            from_time[0],
                            from_time[1],
                            0,
                            0
                          ).getTime();
                          moded_to_time = new Date(
                            year,
                            month,
                            day,
                            to_time[0],
                            to_time[1],
                            0,
                            0
                          ).getTime();
                        } else {
                          // This means no AM or PM in it
                          moded_from_time = new Date(
                            year,
                            month,
                            day,
                            from_time[0],
                            from_time[1],
                            0,
                            0
                          ).getTime();
                          moded_to_time = new Date(
                            year,
                            month,
                            day,
                            to_time[0],
                            to_time[1],
                            0,
                            0
                          ).getTime();
                        }
                        if (
                          current_time > moded_from_time &&
                          current_time < moded_to_time &&
                          i === days.sessions.length - 1
                        ) {
                          item.next_availability = `${requestedDay} ${session.from_time}`;
                        } else if (
                          current_time < moded_from_time &&
                          current_time < moded_to_time &&
                          i === days.sessions.length - 1
                        ) {
                          item.item_status =
                            item.item_status === "hidden"
                              ? item.item_status
                              : "unavailable";
                          item.next_availability = `${requestedDay} ${session.from_time}`;

                          //	item.next_availability = `${requestedDay} ${session.from_time}`;
                        } else if (
                          current_time > moded_from_time &&
                          current_time > moded_to_time &&
                          i === days.sessions.length - 1
                        ) {
                          item.item_status =
                            item.item_status === "hidden"
                              ? item.item_status
                              : "unavailable";
                          var dayNames = [
                            "sunday",
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                          ];

                          var nextDay = new Date(d);

                          for (let j = 0; j < item.available_days.length; j++) {
                            for (let k = 0; k < dayNames.length; k++) {
                              nextDay.setDate(nextDay.getDate() + 1);

                              if (
                                item.available_days[j].day ==
                                dayNames[nextDay.getDay() - 1]
                              ) {
                                if (
                                  item.available_days[j].sessions.length > 0
                                ) {
                                  nextAvailability = item.available_days[j];

                                  break;
                                }
                              }
                            }
                            if (nextAvailability) {
                              break;
                            }
                          }

                          item.next_availability = `${nextAvailability.day} ${nextAvailability.sessions[0].from_time}`;
                        }
                      }
                    } else {
                      item.item_status = "unavailable";
                      if (
                        nextAvailability &&
                        nextAvailability.sessions.length
                      ) {
                        item.next_availability = `${nextAvailability.day} ${nextAvailability.sessions[0].from_time}`;
                      } else {
                        item.next_availability = `no sessions available`;
                      }
                    }
                  });
                } else {
                  item.item_status = "unavailable";
                  if (nextAvailability && nextAvailability.sessions.length) {
                    item.next_availability = `${nextAvailability.day} ${nextAvailability.sessions[0].from_time}`;
                  } else {
                    item.next_availability = `no sessions available`;
                  }
                }
              });

            return item;
          });

          let sortedItemListByRank = modified_list.sort(function (a, b) {
            return a.item_rank - b.item_rank;
          });

          await sortedItemListByRank.forEach((item, i) => {
            if (item.tags === "featured") {
              sortedItemListByRank.unshift(item);
              sortedItemListByRank.splice(i + 1, 1);
            }
          });
          await sortedItemListByRank.forEach((item, i) => {
            if (item.tags === "recommended") {
              sortedItemListByRank.unshift(item);
              sortedItemListByRank.splice(i + 1, 1);
            }
          });

          res.status(200).json({
            status: 1,
            message: "Data Obtained Successfully",
            item_list: sortedItemListByRank,
          });
        }
      }
    );
  } else if (category_id && !requestedDay) {
    /**
     * This methd will be depricated or restricted to admin
     * Now the old requests need to call the url with day at the end
     */
    /**
     * Note : Check For category id and it does not contains dayName param
     */
    let matchQuery;
    if (req.query.name === "" || req.query.name) {
      matchQuery = {
        $match: {
          branch_id: category_id, // this will be branch_id, but due to some emergency it is named as category_id, its actually branch id
          item_status: { $ne: "removed" },
        },
      };
    } else {
      matchQuery = {
        $match: {
          category_id: category_id,
          item_status: { $ne: "removed" },
        },
      };
    }

    let query = { category_id: category_id, item_status: { $ne: "removed" } };
    let option = {
      sold_at: 0,
      "addons.status": 0,
      company_id: 0,
      category_name: 0,
      __v: 0,
      sort: { rank: 1 },
    };
    Items.aggregate(
      [
        matchQuery,
        {
          $project: {
            available_days: {
              $filter: {
                input: "$available_days",
                as: "days",
                cond: { $eq: ["$$days.status", true] },
              },
            },
            _id: 1,
            imageUrl: 1,
            tags: 1,
            item_status: 1,
            branch_id: 1,
            category_id: 1,
            name: 1,
            skucode: 1,
            selling_price: 1,
            tax_rates: 1,
            is_applied_tax: 1,
            food_type: 1,
            kot_order: 1,
            combo_menu: 1,
            item_external_status: 1,
            addons: 1,
            item_description: 1,
            assigned_printer: 1,
            assigned_printers: 1,
            printer_id: 1,
            item_rank: 1,
            item_sold_in_month: 1, //NOt necessary to send this to client side
          },
        },
        { $sort: { item_rank: 1 } },
      ],
      (err, item_list) => {
        if (err) {
          console.error({
            status: 0,
            message: "Error finding Items",
            error: err,
          });
          res.status(500).json({
            status: 0,
            message: "Error finding Items of the passed category Id",
            error: "Problem with server",
          });
        }
        if (!item_list.length) {
          res.status(200).json({
            status: 0,
            message: "No items found",
            error: "No items asscoiated with the passed category Id",
          });
        } else {
          res.status(200).json({
            status: 1,
            message: "Data Obtained Successfully",
            item_list: item_list,
          });
        }
      }
    );
  } else {
    res.status(400).json({
      status: 0,
      message: "Category ID Required",
      error: "Invalid parameter",
    });
  }
};

/**
 * Not In Use
 * Get Items of a particular day
 * @params companyId
 * Get all Items available on each branch of a company
 */
exports.getAllItemsOfCompany = (req, res) => {
  Items.aggregate(
    [
      { $match: { company_id: req.companyId } },
      {
        $addFields: {
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $eq: ["$$item.status", "active"] },
            },
          },
        },
      },
      { $project: {} },
    ],
    (err, customerTypes) => {
      if (err) throw err;
      res.json(customerTypes);
    }
  );
};

/**
 * Get all Items of a particular Branch
 * @param BranchId
 */
exports.getAllItemsOfBranch = (req, res) => {
  let query_value = "";
  if (
    req.accessType === "superadmin" ||
    req.accessType === "admin" ||
    req.accessType === "staffs"
  ) {
    query_value = req.params.branchId;
  } else {
    res.status(401).send({ message: "Unauthorized Access" });
  }

  Items.find({ branch_id: query_value }, (err, item_list) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error finding Item on that branch",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error finding Item on that particular branch",
        error: "Problem with server",
      });
    }
    if (!item_list.length) {
      res.status(200).json({
        status: 0,
        message: "No items found on a particular branch",
        error: "No items asscoiated with the passed branch parameter",
      });
    } else {
      res.status(200).json({
        status: 1,
        message: "Data Obtained Successfully",
        item_list: item_list,
      });
    }
  });
};

/**
 * Get Particular item
 * @param itemId
 */
exports.getItem = (req, res) => {
  Items.findOne({ _id: req.params.itemId }, (err, item_list) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error finding Item",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error finding particular item",
        error: "Problem with server",
      });
    } else if (!item_list) {
      res.status(200).json({
        status: 0,
        message: "No item found for a particular id",
        error: "No item asscoiated with the passed item id",
      });
    } else {
      res.status(200).json({
        status: 1,
        message: "Data Obtained Successfully",
        data: item_list,
      });
    }
  });
};

/**
 * Deprecated
 * Add Category
 * Since we handle it in Update API, We are not using it anyore
 */
exports.addCategory = (req, res) => {
  let categoryData = [];
  categoryData.company_id = req.companyId;
  if (
    req.accessType === "superadmin" ||
    req.accessType === "admin" ||
    req.accessType === "staffs"
  ) {
    categoryData.branch_id = req.body.branch_id;
  } else {
    req.status(401).send({ message: "Unauthorized Access" });
  }
  categoryData.categories = req.body.categories;

  let category = new Categories(categoryData);
  category.save((err, savedCategory) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error adding Category",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error adding new Category",
        error: "Problem with server",
      });
    }
    res.status(201).json({
      status: 1,
      message: "Data Obtained Successfully",
      category: savedCategory,
    });
    // 	res.json(savedCategory);  (Old Code)
  });
};

/**
 * @deprecated
 * Add Item
 * Now its actions are handle in updateItem API
 */
exports.addItem = (req, res) => {
  let addData = req.body.item_details;

  //Tips: Improve this with async/ await if have time
  let uploadImage = new Promise((resolve, reject) => {
    if (addData.imageData.image) {
      let imgdata = addData.imageData.image;

      var filename = Math.floor(Math.random() * Math.floor(999999));
      var filetype = "";
      if (imgdata.indexOf("png;base64") > -1) {
        var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
        filetype = ".png";
        var newpath = "uploads/items/images/" + filename + filetype;
      } else {
        filetype = ".jpeg";
        var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
        var newpath = "uploads/items/images/" + filename + filetype;
      }
      fs.writeFile(newpath, base64Data, "base64", function (err) {
        if (err) {
          console.error({
            status: 0,
            message: "Error uploading Image Category",
            error: err,
          });
          res.status(500).json({
            status: 0,
            message: "Error uploading Image",
            error: "Problem with server",
          });
        } else {
          addData.imageUrl = newpath;
          resolve(addData);
        }
      });
    } else {
      addData.imageUrl = undefined;
      resolve(addData);
    }
  });

  uploadImage.then((result) => {
    let itemData = [];
    if (
      req.accessType === "superadmin" ||
      req.accessType === "admin" ||
      req.accessType === "staffs"
    ) {
      itemData.branch_id = addData.branch_id;
    } else {
      res.status(401).send({ message: "UnAuthorized Access" });
    }

    itemData.company_id = req.companyId;
    itemData.category_id = addData.category_id;
    itemData.name = addData.name;
    itemData.selling_price = addData.selling_price || "";
    itemData.food_type = addData.food_type;
    itemData.kot_order = addData.kot_order;
    itemData.skucode = addData.skucode;
    itemData.item_external_status = addData.item_external_status;
    itemData.combo_menu = addData.combo_menu;
    itemData.tags = addData.tags || "";
    itemData.addons = addData.addons || [];
    itemData.category_name = addData.category_name;
    itemData.available_days = addData.available_days;
    itemData.imageUrl = addData.imageUrl;
    itemData.item_description = addData.item_description;

    let item = new Items(itemData);

    item.save((err, savedItem) => {
      if (err) {
        console.error({
          status: 0,
          message: "Error saving item!",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "Error saving item! Please try later",
          error: "Problem with server",
        });
        // res.send({ message: "Error saving item! Please try later" }); (Old code)
      } else {
        CategoryModel.findOneAndUpdate(
          { "categories._id": savedItem.category_id },
          { $inc: { "categories.$.item_count": 1 } },
          (err, updatedCategory) => {
            if (err) {
              console.error({
                status: 0,
                message: "Error updating category count!",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "Error saving item! Please try later",
                error: "Problem with server",
              });
            } else {
              res.status(201).json({
                status: 1,
                message: "Item Added successfully",
                item: savedItem,
              });
              // res.json(savedItem); (Old code)
            }
          }
        );
      }
    });
  });
};

/**
 * @depricated
 * Add & Update Item
 * @argument _id
 * @description if the item we are updating contains _id,
 * then it is considered as an existing item. Else it acts
 * as a new item and get saved
 */
exports.updateItem_old = (req, res) => {
  let item_details = req.body.item_details;

  if (
    req.accessType === "superadmin" ||
    req.accessType === "admin" ||
    req.accessType === "staffs"
  ) {
    //Tips: Improve this with async/ await if have time
    let uploadImage = new Promise((resolve, reject) => {
      if (item_details.imageData.image) {
        let imgdata = item_details.imageData.image;

        var filename = Math.floor(Math.random() * Math.floor(999999));
        var filetype = "";
        if (imgdata.indexOf("png;base64") > -1) {
          var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
          filetype = ".png";
          var newpath = "uploads/items/images/" + filename + filetype;
        } else {
          filetype = ".jpeg";
          var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
          var newpath = "uploads/items/images/" + filename + filetype;
        }
        fs.writeFile(newpath, base64Data, "base64", function (err) {
          if (err) {
            console.error({
              status: 0,
              message: "error uploading image",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "error uploading image",
              error: "Problem with the server",
            });
          } else {
            item_details.imageUrl = newpath;
            resolve(item_details);
          }
        });
      } else {
        resolve(item_details);
      }
    });

    uploadImage.then((result) => {
      if (!item_details._id) {
        let itemData = [];

        itemData.company_id = req.companyId;
        itemData.branch_id = item_details.branch_id;
        itemData.category_id = item_details.category_id;
        itemData.name = item_details.name;
        itemData.skucode = item_details.skucode;
        itemData.selling_price = item_details.selling_price || "";
        itemData.food_type = item_details.food_type;
        itemData.kot_order = item_details.kot_order;
        itemData.combo_menu = item_details.combo_menu;
        itemData.item_rank = item_details.item_rank; //Used for ranking items
        itemData.tags = item_details.tags || "";
        itemData.addons = item_details.addons || [];
        itemData.category_name = item_details.category_name;
        itemData.available_days = item_details.available_days;
        itemData.is_applied_tax = item_details.is_applied_tax;
        itemData.tax_rates = item_details.tax_rates;
        itemData.imageUrl = item_details.imageUrl;
        itemData.item_description = item_details.item_description;
        itemData.item_external_status = item_details.item_external_status;
        let item = new Items(itemData);

        Items.findOne({ branch_id: itemData.branch_id }, (err, itemList) => {
          if (err) {
            console.error({
              status: 0,
              message: "Error getting Item",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error getting Item",
              error: "Problem with the server",
            });
          } else {
            item.save((err, savedItem) => {
              if (err) {
                console.error({
                  status: 0,
                  message: "Error saving item!",
                  error: err,
                });
                res.status(500).json({
                  status: 0,
                  message: "Error saving item! Please try later",
                  error: "Problem with server",
                });
                // res.send({ message: "Error saving item! Please try later" }); (Old code)
              } else {
                CategoryModel.findOneAndUpdate(
                  { "categories._id": savedItem.category_id },
                  { $inc: { "categories.$.item_count": 1 } },
                  (err, updatedCategory) => {
                    if (err) {
                      console.error({
                        status: 0,
                        message: "Error updating category count!",
                        error: err,
                      });
                      res.status(500).json({
                        status: 0,
                        message: "Error saving item! Please try later",
                        error: "Problem with server",
                      });
                    } else {
                      if (!itemList) {
                        Member.update(
                          { _id: req.userId },
                          { $set: { tour_status: "completed" } },
                          (err, updatedMember) => {
                            if (err) {
                              console.error({
                                status: 0,
                                message: "Error updating Member",
                                error: err,
                              });
                              res.status(500).json({
                                status: 0,
                                message: "Error updating item",
                                error: "Problem with the server",
                              });
                            } else {
                              res.status(201).json({
                                status: 1,
                                message: "Item Added successfully",
                                item: savedItem,
                              });
                            }
                          }
                        );
                      } else {
                        res.status(201).json({
                          status: 1,
                          message: "Item Added successfully",
                          item: savedItem,
                        });
                      }
                    }
                  }
                );
              }
            });
          }
        });
      } else {
        Items.findById(item_details._id, (err, item_detail) => {
          if (err) {
            console.error({
              status: 0,
              message: "Error finding item",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error finding item for the passed parameter",
              error: "Problem with server",
            });
          }

          item_detail.set(item_details);
          /**
           *  TODO need to restrict the returning data
           * Try to handle it from the front end
           * */
          item_detail.save((err, updatedItem) => {
            if (err) {
              console.error({
                status: 0,
                message: "Error Updating item",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "Error updating item",
                error: "Problem with server",
              });
            }
            res.status(201).json({
              status: 1,
              message: "Item Added successfully",
              item: updatedItem,
            });
            // res.send(updatedDetails);  (Old code)
          });
        });
      }
    });
  } else {
    console.error({
      status: 0,
      message: "UnAuthorized Access",
      error: "user not have access to create or update items",
    });
    res.status(401).send({
      status: 0,
      message: "UnAuthorized Access",
      error: "you do not have access to create or update items",
    });
  }
};

exports.updateItem = (req, res) => {
  let item_details = req.body.item_details;
  if (
    req.accessType === "superadmin" ||
    req.accessType === "admin" ||
    req.accessType === "staffs"
  ) {
    //Tips: Improve this with async/ await if have time
    let uploadImage = new Promise((resolve, reject) => {
      if (item_details.imageData.image) {
        let imgdata = item_details.imageData.image;

        var filename = Math.floor(Math.random() * Math.floor(999999));
        var filetype = "";
        if (imgdata.indexOf("png;base64") > -1) {
          var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
          filetype = ".png";
          var newpath = "uploads/items/images/" + filename + filetype;
        } else {
          filetype = ".jpeg";
          var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
          var newpath = "uploads/items/images/" + filename + filetype;
        }
        fs.writeFile(newpath, base64Data, "base64", function (err) {
          if (err) {
            console.error({
              status: 0,
              message: "error uploading image",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "error uploading image",
              error: "Problem with the server",
            });
          } else {
            item_details.imageUrl = newpath;
            /**
             * Note: This multi image resizing is used to improve performance on the app
             */
            let small_image_dir = "uploads/items/images/small/";
            let medium_image_dir = "uploads/items/images/medium/";
            let large_image_dir = "uploads/items/images/large/";

            if (!fs.existsSync(small_image_dir)) {
              fs.mkdirSync(small_image_dir, { recursive: true });
            }
            if (!fs.existsSync(medium_image_dir)) {
              fs.mkdirSync(medium_image_dir, { recursive: true });
            }
            if (!fs.existsSync(large_image_dir)) {
              fs.mkdirSync(large_image_dir, { recursive: true });
            }

            sharp(newpath)
              .resize(100, 100)
              .jpeg({ quality: 50 })
              .toFile(`${small_image_dir}${filename}${filetype}`);
            sharp(newpath)
              .resize(200, 200)
              .jpeg({ quality: 70 })
              .toFile(`${medium_image_dir}${filename}${filetype}`);
            sharp(newpath)
              .resize(300, 300)
              .jpeg({ quality: 80 })
              .toFile(`${large_image_dir}${filename}${filetype}`);

            resolve(item_details);
          }
        });
      } else {
        resolve(item_details);
      }
    });

    uploadImage.then((result) => {
      Items.aggregate(
        [
          {
            $match: {
              branch_id: item_details.branch_id,
              category_id: item_details.category_id,
            },
          },
        ],
        async (err, categoryItems) => {
          if (err) {
            console.error({
              status: 0,
              message: "Error getting Item",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error getting Item",
              error: "Problem with the server",
            });
          } else {
            let existingItemsOfCategory = categoryItems;
            let active_items = existingItemsOfCategory.filter((item) => {
              if (item.item_status !== "removed") {
                return item;
              }
            });

            if (!item_details._id) {
              let itemData = [];
              if (item_details.rank < active_items.length) {
                await Items.updateMany(
                  {
                    category_id: item_details.category_id,
                    item_rank: { $gte: item_details.rank },
                  },
                  { item_rank: { $inc: 1 } }
                );
                itemData.item_rank = item_details.item_rank; //Used for ranking items
              } else {
                itemData.item_rank = active_items.length + 1; //Used for ranking items
              }

              itemData.company_id = req.companyId;
              itemData.branch_id = item_details.branch_id;
              itemData.category_id = item_details.category_id;
              itemData.name = item_details.name;
              itemData.skucode = item_details.skucode;
              itemData.selling_price = item_details.selling_price || "";
              itemData.food_type = item_details.food_type;
              itemData.kot_order = item_details.kot_order;
              itemData.combo_menu = item_details.combo_menu;
              itemData.tags = item_details.tags || "";
              itemData.addons = item_details.addons || [];
              itemData.category_name = item_details.category_name;
              itemData.available_days = item_details.available_days;
              itemData.imageUrl = item_details.imageUrl;
              itemData.item_description = item_details.item_description;
              itemData.is_applied_tax = item_details.is_applied_tax;
              itemData.tax_rates = item_details.tax_rates;
              itemData.assigned_printer = item_details.assigned_printer;
              itemData.assigned_printers = item_details.assigned_printers;
              itemData.printer_id = item_details.printer_id;
              itemData.item_external_status = item_details.item_external_status;

              let item = new Items(itemData);

              item.save(async (err, savedItem) => {
                if (err) {
                  console.error({
                    status: 0,
                    message: "Error saving item!",
                    error: err,
                  });
                  res.status(500).json({
                    status: 0,
                    message: "Error saving item! Please try later",
                    error: "Problem with server",
                  });
                  // res.send({ message: "Error saving item! Please try later" }); (Old code)
                } else {
                  let new_receipe = new Recipe({
                    branch_id: savedItem.branch_id,
                    item_id: savedItem._id,
                    category_id: savedItem.category_id,
                    item_name: savedItem.name,
                    selling_price: savedItem.selling_price,
                    ingredients: [],
                    company_id: savedItem.company_id,
                  });
                  await new_receipe.save();

                  await CategoryModel.findOneAndUpdate(
                    { "categories._id": savedItem.category_id },
                    {
                      $set: {
                        "categories.$.item_count": active_items.length + 1,
                      },
                    },
                    async (err, updatedCategory) => {
                      if (err) {
                        console.error({
                          status: 0,
                          message: "Error updating category count!",
                          error: err,
                        });
                        res.status(500).json({
                          status: 0,
                          message: "Error saving item! Please try later",
                          error: "Problem with server",
                        });
                      } else {
                        if (!categoryItems) {
                          await Member.update(
                            { _id: req.userId },
                            { $set: { tour_status: "completed" } },
                            (err, updatedMember) => {
                              if (err) {
                                console.error({
                                  status: 0,
                                  message: "Error updating Member",
                                  error: err,
                                });
                                res.status(500).json({
                                  status: 0,
                                  message: "Error updating item",
                                  error: "Problem with the server",
                                });
                              } else {
                                res.status(201).json({
                                  status: 1,
                                  message: "Item Added successfully",
                                  item: savedItem,
                                });
                              }
                            }
                          );
                        } else {
                          res.status(201).json({
                            status: 1,
                            message: "Item Added successfully",
                            item: savedItem,
                          });
                        }
                      }
                    }
                  );
                }
              });
            } else {
              Items.findById(item_details._id, async (err, old_item_detail) => {
                if (!old_item_detail.item_rank) {
                  old_item_detail.item_rank = 0;
                }
                if (err) {
                  console.error({
                    status: 0,
                    message: "Error finding item",
                    error: err,
                  });
                  res.status(500).json({
                    status: 0,
                    message: "Error finding item for the passed parameter",
                    error: "Problem with server",
                  });
                } else {
                  if (item_details.item_rank > active_items.length) {
                    await Items.updateMany(
                      {
                        category_id: old_item_detail.category_id,
                        item_rank: { $gt: old_item_detail.item_rank },
                      },
                      { $inc: { item_rank: -1 } }
                    );
                    item_details.item_rank = active_items.length;
                  } else if (
                    old_item_detail.item_rank < item_details.item_rank
                  ) {
                    await Items.updateMany(
                      {
                        category_id: old_item_detail.category_id,
                        item_rank: {
                          $gt: old_item_detail.item_rank,
                          $lte: item_details.item_rank,
                        },
                      },
                      { $inc: { item_rank: -1 } }
                    );
                    old_item_detail.item_rank = item_details.item_rank;
                  } else {
                    await Items.updateMany(
                      {
                        category_id: old_item_detail.category_id,
                        item_rank: {
                          $lt: old_item_detail.item_rank,
                          $gte: item_details.item_rank,
                        },
                      },
                      { $inc: { item_rank: 1 } }
                    );
                    old_item_detail.item_rank = item_details.item_rank;
                  }
                  old_item_detail.set(item_details);

                  /**
                   *  TODO need to restrict the returning data
                   * Try to handle it from the front end
                   * */
                  old_item_detail.save(async (err, updatedItem) => {
                    if (err) {
                      console.error({
                        status: 0,
                        message: "Error Updating item",
                        error: err,
                      });
                      res.status(500).json({
                        status: 0,
                        message: "Error updating item",
                        error: "Problem with server",
                      });
                    } else {
                      await Recipe.findOneAndUpdate(
                        { item_id: updatedItem._id },
                        {
                          item_name: updatedItem.name,
                          selling_price: updatedItem.selling_price,
                        }
                      );

                      res.status(201).json({
                        status: 1,
                        message: "Item Added successfully",
                        item: updatedItem,
                      });
                      // res.send(updatedDetails);  (Old code)
                    }
                  });
                }
              });
            }
          }
        }
      );
    });
  } else {
    console.error({
      status: 0,
      message: "UnAuthorized Access",
      error: "user not have access to create or update items",
    });
    res.status(401).send({
      status: 0,
      message: "UnAuthorized Access",
      error: "you do not have access to create or update items",
    });
  }
};
exports.hard_remove = async (req, res) => {
	console.log('Reqqqqqqqqqqqqqqqqqqqq',req.body);
	let item_details = req.body;
	itemModel.findOne(
	  { _id: mongoose.Types.ObjectId(req.body._id) },
	  async function (err, response) {
		if (!err && response) {
		await itemModel.findOneAndRemove({ _id: req.body._id })
		await Items.updateMany(
			{ 
				category_id: item_details.category_id,
				item_rank: { $gt:  item_details.item_rank }  
			}, 
			{ $inc: { item_rank: -1 } }
			
		)
		res.json({ status: true });		
		CategoryModel.findOneAndUpdate(
			{ "categories._id": item_details.category_id },
			{ $set: { "categories.$.item_count": (categoryItemCount - 1 )} },
			(error, updatedResult) => {
				if (error) {
					console.error({
						status: 0,
						message: "Error updating category Count!",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Problem removing item! Please try later",
						error: "Problem with the parameters"
					});
				}else{
					console.log('RUNNING 1');
					
					res.status(201).json({
						status: 1,
						message: "Item Removed Successfully",
					});
				}
			}
		);
		} else {
		  res.json({ status: false, error: err, message: "Invalid blog" });
		}
	  }
	);
  };
exports.itemRemove = async (req, res) => {
  let external_status = false;
  let item_details = req.body.item_details;
  let categoryItemCount = await Items.find({
    category_id: item_details.category_id,
    item_status: { $ne: "removed" },
  }).count(); // $ne: 'removed' is not required anymore
  console.log("categoryItemCount", categoryItemCount);
  Items.findById(item_details._id, (err, item_detail) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error removing item!",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error removing item! Please try later",
        error: "Problem with server",
      });
    } else {
      // item_detail.set({ item_status: item_details["item_status"] });
      //TODO need to restrict the returning data
      if (item_details.item_status && item_details.item_status !== "removed") {
        if (
          item_detail.item_external_status != item_details.item_external_status
        ) {
          console.log("item---");
          external_status = true;
        }
        item_detail.item_status = item_details.item_status;
        item_detail.item_external_status = item_details.item_external_status;
        item_detail
          .save()
          .then(async (result) => {
            console.log("result", result);
            if (external_status) {
              console.log("log-------if-------");
              DeliveryBrand.find(
                { category_id: { $in: [item_detail.category_id] } },
                async (err, brands) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "Error Updating Brand category",
                      error: err,
                    });
                  } else {
                    console.log("log-------else-------");
                    if (brands.length) {
                      let action;
                      if (item_detail.item_external_status == true) {
                        action = "enable";
                      } else {
                        action = "disable";
                      }
                      await brands.forEach(async (brand) => {
                        let brandname = brand.name;
                        if (action != "") {
                          let data = {
                            location_ref_id:
                              item_detail.branch_id +
                              "+" +
                              brandname.replace(/\s/g, "-"),
                            item_ref_ids: [item_detail._id],
                            action: action,
                          };
                          await sendtourbanpiper(
                            data,
                            item_detail.branch_id,
                            brand._id
                          ).then((response) => {});
                        }
                      });
                    }
                  }
                }
              );
              res.status(201).json({
                status: 1,
                message: "Item Updated Successfully",
              });
            } else {
              res.status(201).json({
                status: 1,
                message: "Item Updated Successfully",
              });
            }
          })
          .catch((err) => {
            console.error({
              status: 0,
              message: "Error removing item!",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error removing item! Please try later",
              error: "Please check the parameters",
            });
          });
      } else {
        item_detail.remove(async (err, updatedDetails) => {
          console.log("updatedDetails", updatedDetails);
          if (err) {
            console.error({
              status: 0,
              message: "Error removing item!",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error removing item! Please try later",
              error: "Please check the parameters",
            });
          } else {
            await Recipe.findOneAndRemove({ item_id: item_details._id });
            await Items.updateMany(
              {
                category_id: item_details.category_id,
                item_rank: { $gt: item_detail.item_rank },
              },
              { $inc: { item_rank: -1 } }
            );
            CategoryModel.findOneAndUpdate(
              { "categories._id": item_detail.category_id },
              { $set: { "categories.$.item_count": categoryItemCount - 1 } },
              (error, updatedResult) => {
                console.log("updatedResult", updatedResult);
                if (error) {
                  console.error({
                    status: 0,
                    message: "Error updating category Count!",
                    error: err,
                  });
                  res.status(500).json({
                    status: 0,
                    message: "Problem removing item! Please try later",
                    error: "Problem with the parameters",
                  });
                } else {
                  res.status(201).json({
                    status: 1,
                    message: "Item Removed Successfully",
                  });
                }
              }
            );
          }
        });
      }
    }
  });
  async function sendtourbanpiper(data, branch_id, brand_id) {
    return new Promise((resolve) => {
      // request({ url: 'https://pos-int.urbanpiper.com/hub/api/v1/items/',headers: {'Content-Type': 'application/json','Authorization': 'apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba'}, method: 'POST', json: {data: data}}, callback);
      // function callback(error, response, body) {
      // 	if (!error) {

      // 		let urbanpiperrequest = new Urbanpiperresponse();
      // 		urbanpiperrequest.request = body;
      // 		urbanpiperrequest.response = null;
      // 		urbanpiperrequest.branch_id = item_detail.branch_id;
      // 		urbanpiperrequest.request_type = "Item/Option – actions";
      // 		urbanpiperrequest.save();

      // 	}
      // }
      request(
        {
          url: "https://pos-int.urbanpiper.com/hub/api/v1/items/",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba",
          },
          method: "POST",
          json: data,
        },
        callback
      );

      function callback(error, response, body) {
        if (!error) {
          let urbanpiperrequest = new Urbanpiperresponse();
          urbanpiperrequest.request = body;
          urbanpiperrequest.response = null;
          urbanpiperrequest.branch_id = branch_id;
          urbanpiperrequest.brand_id = brand_id;
          urbanpiperrequest.request_type = "Item/Option – actions";
          urbanpiperrequest.save();
          resolve(body);
        }

        resolve(error);
      }
    });
  }
};

exports.removeCategory = (req, res) => {
  //TODO: Hard delete
};

exports.updateItemStatus = (req, res) => {
  let itemId = req.params.itemId;
  let item_details = req.body.item_details;
  Items.findByIdAndUpdate(
    itemId,
    { $set: { item_status: item_details.item_status } },
    { new: true },
    (err, updatedItem) => {
      if (err) {
        console.error({
          satus: 0,
          message: "error finding item",
          error: err,
        });
        res.status(500).json({
          satus: 0,
          message: "error finding item",
          error: "problem with the server",
        });
      } else if (updatedItem) {
        console.error({
          satus: 0,
          message: "error finding item",
          error: err,
        });
        res.status(500).json({
          satus: 0,
          message: "error finding item",
          error: "problem with the server",
        });
      } else {
        console.error({
          satus: 0,
          message: "error finding item",
          error: "error finding item",
        });
        res.status(500).json({
          satus: 0,
          message: "error finding item",
          error: "error finding item",
        });
      }
    }
  );
};

/**
 * NOTE: Used to update item tag (For now used for featured and remove featured)
 */
exports.updateItemTag = (req, res) => {
  let itemDetails = req.body.item_details;
  Items.findByIdAndUpdate(
    itemDetails._id,
    { $set: { tags: itemDetails.tag } },
    { new: true },
    (err, updatedItem) => {
      if (err) {
        console.error({
          satus: 0,
          message: "error finding item",
          error: err,
        });
        res.status(500).json({
          satus: 0,
          message: "error finding item",
          error: "problem with the server",
        });
      } else if (updatedItem) {
        res.status(201).json({
          satus: 1,
          message: "item marged as featured",
        });
      } else {
        console.error({
          satus: 0,
          message: "error finding item",
          error: "error finding item",
        });
        res.status(500).json({
          satus: 0,
          message: "error finding item",
          error: "error finding item",
        });
      }
    }
  );
};