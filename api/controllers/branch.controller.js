"use strict";
const fs = require("fs");
const sharp = require("sharp");
const Branches = require("../models/branch.model");
const Tables = require("../models/omsModels/table.model");
const User = require("../models/auth.model");
const FinanceLookupModel = require("../models/finance_lookup.model");
const Categories = require("../models/managementModels/menu_category.model");
const Member = require("../models/managementModels/member_directory.model");
const CustomerMeta = require("../models/managementModels/customer_meta.model");
const CompanyModel = require("../models/company.model");
const MenuItem = require("../models/managementModels/menu_item.model");
const Urbanpiperresponse = require("../models/omsModels/urbanpiper.model");
const DeliveryBrand = require("../models/managementModels/delivery_brand.model");
const mongoose = require("mongoose");
const { resolvePtr } = require("dns");
const { timeout } = require("async");
const request = require("request");
/**
 * Check usablity and remove if not used
 * @param {*} req
 * @param {*} res
 */
exports.list_all_branches = (req, res) => {
  Branches.find({ company_id: req.companyId }, (err, branches) => {
    if (err) res.json(err);
    res.json(branches);
    // console.log('branches==========================================',branches);
    // console.log(res);
    // console.log(err);
  });
};

/**
 * Check usablity and remove if not used
 * @param {*} req
 * @param {*} res
 */
exports.branch_list = (req, res) => {
  Branches.find(
    { company_id: req.params.companyId },
    { location: 1, name: 1, _id: 1 },
    (err, branches) => {
      if (err) res.json(err);
      res.status(200).json({
        status: 0,
        message: "Data obtained successfully",
        branch_list: branches,
      });
    }
  );
};

exports.getAdminBranchList = (req, res) => {
  // User.findone({ _id: req }, (err, branches) => {
  // 	// if (err) res.json(err);
  // 	// res.json(branches);
  // });
};

exports.create_new_branch = (req, res) => {
  let branchData = [];
  branchData.company_id = req.companyId;
  branchData.name = req.body.name;
  branchData.location = req.body.location;
  branchData.opening_hours = req.body.opening_hours || [];
  branchData.quick_options = req.body.quick_options || [
    {
      name: "water",
      has_addon: 1,
      free_service: 0,
      service_cost: [
        {
          name: "bottled",
          price: 30,
        },
      ],
      status: "active",
      editable: false,
    },
    {
      name: "call waiter",
      has_addon: 0,
      free_service: 1,
      status: "active",
      editable: false,
    },
    {
      name: "tissue",
      has_addon: 0,
      free_service: 1,
      status: "active",
      editable: true,
    },
  ];
  // TODO: Get this from client instead setting it as static
  // Set this directly at mongomodel
  branchData.counters = {
    kot_count: "000000",
    order_count: "000000",
    take_away_count: "000000",
    table_order_count: "000000",
    online_order_count: "000000",
    home_delivery_count: "000000",
  };
  branchData.setting = [
    {
      kot_print: true,
      apply_gst: false,
      duplicate_print_count: 0,
    },
  ];

  let branch = new Branches(branchData);
  Branches.findOne({ company_id: req.companyId }, (err, exisitingBranch) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error Finding Branch",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error Creating Branch",
        error: "Problem with the server",
      });
      return;
    }

    branch.save((err, savedBranch) => {
      if (err) {
        console.error({
          status: 0,
          message: "Error Creating Branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "Error saving branch! Please try later",
          error: "Problem with the server",
        });
      } else {
        let userData = [];
        userData.email = req.body.email;
        userData.name = req.body.name;
        userData.password = req.body.password;
        userData.company_id = req.companyId;
        userData.branch_id = savedBranch._id;
        userData.user_type = req.body.user_type;

        let user = new User(userData);

        user.save((err, registeredBranch) => {
          if (err) {
            console.error({
              status: 0,
              message: "Error Finding Branch",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error saving branch! Please try later",
              error: "Problem with the server",
            });
          }
          let financeLookupData = {};
          financeLookupData.branch_id = savedBranch._id;
          financeLookupData.tender_types = [
            { tender_type: "Card" },
            { tender_type: "Cash" },
            { tender_type: "GPay" },
            { tender_type: "PayTM" },
            { tender_type: "PhonePe" },
            { tender_type: "Amazon Pay" },
            { tender_type: "Mobikwik" },
          ];
          let finance_lookup_model = new FinanceLookupModel(financeLookupData);
          finance_lookup_model.save((err, addedDefaultTender) => {
            if (err) {
              console.error({
                status: 0,
                message: "Error Finding Finance model",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "Error saving branch! Please try later",
                error: "Proble with the server",
              });
              return;
            } else {
              let categoryData = {};
              categoryData.branch_id = savedBranch._id;
              categoryData.categories = [
                {
                  name: "Starters",
                  rank: 1,
                },
                {
                  name: "Main Course",
                  rank: 2,
                },
              ];

              let categories = new Categories(categoryData);
              categories.save((err, savedCategory) => {
                if (err) {
                  console.error({
                    status: 0,
                    message: "Error Creating Default Categories",
                    error: err,
                  });
                  res.status(500).json({
                    status: 0,
                    message: "Error adding default category! Please try later",
                    error: "Problem with the server",
                  });
                  return;
                } else {
                  let firstPosition = new CustomerMeta({
                    company_id: req.companyId,
                    branch_id: savedBranch._id,
                    customer_types: [],
                    member_positions: [
                      {
                        position: "manager",
                        member_count: 1,
                        access: [
                          {
                            module: "oms",
                            access_details: [
                              {
                                name: "floor",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "table functions",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "order functions",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "payment functions",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "takeaway",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                            ],
                          },
                          {
                            module: "my_account",
                            access_details: [
                              {
                                name: "setup",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "management",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "analytics",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                              {
                                name: "valet",
                                access: [
                                  {
                                    name: "all",
                                    selected: true,
                                  },
                                ],
                                selected: true,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  });

                  firstPosition.save().then((result) => {
                    //TODO: Make change in user tour
                    if (!exisitingBranch) {
                      Member.update(
                        { _id: req.userId },
                        { $set: { tour_status: "branch_details" } },
                        (err, updatedMember) => {
                          if (err) {
                            console.error({
                              status: 0,
                              message:
                                "Error adding default category! Please try later",
                              error: err,
                            });
                            res.status(500).json({
                              status: 0,
                              message:
                                "Error adding default category! Please try later",
                              error: "Problem with the server",
                            });
                          } else {
                            res.status(201).json(savedBranch);
                          }
                        }
                      );
                    } else {
                      res.status(201).json(savedBranch);
                    }
                  });
                }
              });
            }
          });
        });
      }
    });
  });
};

exports.read_a_branch = (req, res) => {
  //TODO: Replace with findOne
  Branches.findOne({ _id: req.params.branchId }, async (err, branches) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error reading branch",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error reading branch",
        error: "Problem with the server",
      });
    } else {
      await CompanyModel.findOne(
        { _id: branches.company_id },
        (err, results) => {
          if (err) {
            console.error("error finding company ---------", err);
          } else {
            branches["logo_url"] = results.logo_url ? results.logo_url : "";
            branches["name_1"] = "pravin";
          }
        }
      );

      res.json(branches);
    }
  });
};

exports.update_a_branch = (req, res) => {
  let branchDetail = req.body.branch_detail;

  /**
   * Check if any branch Exists under that company id
   */
  Branches.find({ company_id: req.companyId }, (err, branches) => {
    if (err) {
      console.error({
        status: 0,
        message: "Error finding Company",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error finding Company",
        error: "Problem with the server",
      });
    } else {
      /**
       * If exists, get that branch with branch id
       */
      Branches.findById(branchDetail._id, (err, branch_detail) => {
        if (err) {
          console.error({
            status: 0,
            message: "Error Getting Branch Details",
            error: err,
          });
          res.status(500).json({
            status: 0,
            message: "Error Getting Branch Details",
            error: "Problme with the server",
          });
          return;
        }

        if (branchDetail.quick_options) {
          let temp_quickoption;
          temp_quickoption = branch_detail.quick_options.map((option) => {
            if (option._id == branchDetail.quick_options._id) {
              option = branchDetail.quick_options;
            }
            return option;
          });
          branchDetail.quick_options = temp_quickoption;
        }

        branch_detail.set(branchDetail);

        /**
         * Save this branch
         */
        branch_detail.save((err, updatedDetails) => {
          if (err) {
            console.error({
              status: 0,
              message: "Error Adding Branch Details",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "Error Updating Branch Details",
              error: "Problme with the server",
            });
          } else {
            /**
             * If User data exists
             * Update user
             */

            if (branchDetail.opening_hours) {
              // if (branches && branches.length == 1 && branches[0].opening_hours.length === 0) {
              if (
                branches &&
                branches.length == 1 &&
                branches[0].opening_hours.length === 0
              ) {
                /**
                 * If it is a new branch
                 * Update the tour status as branch_timings
                 */
                Member.update(
                  { _id: req.userId },
                  { $set: { tour_status: "branch_timings" } },
                  (err, updatedMember) => {
                    if (err) {
                      console.error({
                        status: 0,
                        message: "Error Getting member",
                        error: err,
                      });
                      res.status(500).json({
                        status: 0,
                        message: "Error Getting member",
                        error: "Problem with the server",
                      });
                    } else {
                      res.status(201).json(updatedDetails);
                    }
                  }
                );
              } else {
                res.status(201).json(updatedDetails);
              }
            } else if (branchDetail.email && branchDetail.name) {
              let userData = {};
              userData.email = branchDetail.email;
              userData.name = branchDetail.name;

              if (
                branchDetail.password &&
                branchDetail.password.toString().length
              ) {
                userData.password = branchDetail.password;
              }

              User.update(
                { branch_id: branchDetail._id },
                { $set: userData },
                (err, registeredBranch) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "Error Finding Branch",
                      error: err,
                    });
                    res.status(500).json({
                      status: 0,
                      message: "Error saving branch! Please try later",
                      error: "Problem with the server",
                    });
                  } else {
                    res.status(200).json({
                      status: 1,
                      message: "Branch updated Successfully",
                    });
                  }
                }
              );
            } else {
              res.status(200).json({
                status: 1,
                message: "Branch updated Successfully",
              });
            }
          }
        });
      });
    }
  });
};

/**
 * Branch Table Plans
 */
exports.update_table_plan = (req, res) => {
  let updateData = req.body.branch_detail;
  let branchId = "";
  branchId = updateData.branch_id;

  let tableIdList;
  let tableToRemove;
  let tableToAdd;
  let tableToUpdate;

  if (!updateData._id) {
    Branches.find({ company_id: req.companyId }, (err, branches) => {
      if (err) {
        console.error({
          status: 0,
          message: "Error Updating Table Plan",
          error: err,
        });
        res.status(500).send({
          status: 0,
          message: "Error updating Table Plan",
          error: "Problem With the server",
        });
      } else {
        Branches.findOneAndUpdate(
          { _id: branchId },
          {
            $push: { table_plans: updateData },
          },
          { new: true, upsert: true },
          async (err, result) => {
            if (err) {
              console.error({
                status: 0,
                message: "error adding new table plan",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error adding new table plan",
                error: "Problem with the server",
              });
            } else {
              let temp_var = [];
              temp_var = result.table_plans;
              let table_plan = temp_var[temp_var.length - 1];
              let tableDetail = [];
              tableDetail["company_id"] = req.companyId;
              tableDetail["branch_id"] = branchId;
              tableDetail["floor_id"] = table_plan._id;
              tableDetail["table_prefix"] = updateData.table_prefix;
              tableDetail["starting_table_count"] =
                updateData.starting_table_count;
              tableDetail["floor_name"] = updateData.name;

              let startingTableNumber = tableDetail["starting_table_count"];

              for (
                let i = startingTableNumber;
                i <
                Number(updateData.table_count) + Number(startingTableNumber);
                i++
              ) {
                tableDetail["name"] = updateData.table_prefix + i;
                let table = new Tables(tableDetail);
                await table.save((err, addedTable) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "error adding table",
                      error: err,
                    });
                    res.status(500).send({
                      status: 0,
                      message: "error adding table",
                      error: "Problem with the server",
                    });
                  }
                });
              }

              if (branches.length == 1 && branches[0].table_plans.length == 0) {
                //NOTE: This is the only initilizing branch
                // Update the member tour status as floor_details
                Member.update(
                  { _id: req.userId },
                  { $set: { tour_status: "floor_details" } },
                  (err, updatedFloorPlans) => {
                    if (err) {
                      console.error({
                        status: 0,
                        message: "error adding table",
                        error: err,
                      });
                      res.status(500).send({
                        status: 0,
                        message: "error adding table",
                        error: "Problem with the server",
                      });
                    } else {
                      res.status(201).json({
                        status: 1,
                        message: "Floor Created Successfully",
                      });
                    }
                  }
                );
              } else {
                res.status(201).json({
                  status: 1,
                  message: "Floor Created Successfully",
                });
              }
            }
          }
        );
      }
    });
  } else if (updateData._id) {
    Branches.findOne({ _id: branchId }, async function (err, branchDetails) {
      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        let floorToUpdate = branchDetails.table_plans.filter(
          (table) => table._id == updateData._id
        )[0];

        let isFloorNameChanged = false;
        if (updateData.name && floorToUpdate.name !== updateData.name) {
          isFloorNameChanged = true;
        }

        let isSameStartingTableNumber = false;
        let startingTablDifference = 0;
        if (
          floorToUpdate.starting_table_count !== updateData.starting_table_count
        ) {
          isSameStartingTableNumber = true;
          startingTablDifference =
            updateData.starting_table_count -
            floorToUpdate.starting_table_count;
        }

        if (isSameStartingTableNumber) {
          try {
            let tableList = await Tables.find({
              floor_id: updateData._id,
              table_status: "active",
            });
            await asyncForEach(tableList, async (table, i) => {
              let existingTableNumber = table.name.split(table.table_prefix);
              let newTableNumber =
                Number(existingTableNumber[1]) + startingTablDifference;
              let setOption = {
                name: `Table ${updateData.table_prefix}${newTableNumber}`,
              };

              await Tables.findOneAndUpdate(
                { _id: table._id },
                { $set: setOption }
              );
            });
          } catch {}
        }

        if (
          floorToUpdate.table_prefix != updateData.table_prefix &&
          floorToUpdate.table_count != updateData.table_count
        ) {
          let option;
          if (floorToUpdate.table_count > updateData.table_count) {
            option = "remove";
          } else {
            option = "add";
          }
          await updateTableCount(
            option,
            false,
            updateData.table_count,
            isFloorNameChanged,
            updateData.starting_table_count
          )
            .then((result) => {
              res.status(201).json({
                status: 1,
                message: "floor updated successfully",
              });
            })
            .catch((err) => {
              console.error({
                status: 0,
                message: "error updating floor",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error updating floor",
                error: "problem with the server",
              });
            });
        } else if (
          floorToUpdate.table_prefix == updateData.table_prefix &&
          floorToUpdate.table_count != updateData.table_count
        ) {
          let option;
          if (floorToUpdate.table_count > updateData.table_count) {
            option = "remove";
          } else {
            option = "add";
          }
          await updateTableCount(
            option,
            true,
            updateData.table_count,
            isFloorNameChanged,
            updateData.starting_table_count
          )
            .then((result) => {
              res.status(201).json({
                status: 1,
                message: "floor updated successfully",
              });
            })
            .catch((err) => {
              console.error({
                status: 0,
                message: "error updating floor",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error updating floor",
                error: "problem with the server",
              });
            });
        } else if (
          floorToUpdate.table_prefix != updateData.table_prefix &&
          floorToUpdate.table_count == updateData.table_count
        ) {
          await updateTableCount(
            "prefix",
            false,
            updateData.table_count,
            isFloorNameChanged,
            updateData.starting_table_count
          )
            .then((result) => {
              res.status(201).json({
                status: 1,
                message: "floors updated successfully",
              });
            })
            .catch((err) => {
              console.error({
                status: 0,
                message: "error updating floor",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error updating floor",
                error: "problem with the server",
              });
            });
        } else if (
          floorToUpdate.table_prefix == updateData.table_prefix &&
          floorToUpdate.table_count == updateData.table_count &&
          isFloorNameChanged
        ) {
          await updateTableCount(
            "prefix",
            false,
            updateData.table_count,
            isFloorNameChanged,
            updateData.starting_table_count
          )
            .then((result) => {
              res.status(201).json({
                status: 1,
                message: "floors updated successfully",
              });
            })
            .catch((err) => {
              console.error({
                status: 0,
                message: "error updating floor",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error updating floor",
                error: "problem with the server",
              });
            });
        } else if (
          floorToUpdate.table_prefix === updateData.table_prefix &&
          floorToUpdate.table_count === updateData.table_count &&
          !isFloorNameChanged
        ) {
          await updateBranch()
            .then((result) => {
              res.status(201).json({
                status: 1,
                message: "floor updated successfully",
              });
            })
            .catch((err) => {
              console.error({
                status: 0,
                message: "error updating floor",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error updating floor",
                error: "problem with the server",
              });
            });
        }
      }
    });

    async function updateTableCount(
      option,
      isSamePrefix,
      count,
      isFloorNameChanged,
      startingTableNumber = 1
    ) {
      await Tables.find(
        { floor_id: updateData._id, table_status: "active" },
        { _id: 1, name: 1, table_prefix: 1 }
      )
        .then(async (result) => {
          let tableList = JSON.parse(JSON.stringify(result));
          let sortedResult = tableList
            .sort((a, b) => {
              let secondParam = b["name"]
                .split(" ")[1]
                .replace(b["table_prefix"], "");
              let firstParam = a["name"]
                .split(" ")[1]
                .replace(a["table_prefix"], "");
              return firstParam - secondParam;
            })
            .map((table) => {
              return table._id;
            });
          tableIdList = JSON.parse(JSON.stringify(sortedResult));
          tableToRemove = sortedResult.splice(count);
          tableToUpdate = sortedResult.splice(0, count);
          // tableIdList = JSON.parse(JSON.stringify(result));
          // tableToRemove = result.splice(count);
          // tableToUpdate = result.splice(0, count);
          if (option === "remove") {
            await removeTables(tableToRemove);
            if (!isSamePrefix || isFloorNameChanged) {
              await updateTablePrefix(
                tableIdList,
                updateData.table_prefix,
                isFloorNameChanged
              );
            }
          } else if (option === "add") {
            await addNewTables(tableIdList, startingTableNumber);
            if (!isSamePrefix || isFloorNameChanged) {
              await updateTablePrefix(
                tableIdList,
                updateData.table_prefix,
                isFloorNameChanged
              );
            }
          } else if (option === "prefix") {
            await updateTablePrefix(
              tableIdList,
              updateData.table_prefix,
              isFloorNameChanged
            );
          }
        })
        .catch((err) => {
          return err;
        });

      return await updateBranch()
        .then((result) => {
          return result;
        })
        .catch((err) => {
          return err;
        });
    }

    async function removeTables(tableList) {
      await Tables.remove({ _id: { $in: tableList } }, (err, removedTable) => {
        if (err) {
          return err;
        } else {
          return removedTable;
        }
      });
    }

    async function addNewTables(tableList, startingTableNumber) {
      let tableCountToAdd = updateData.table_count - tableList.length;
      // let nextCount = tableList.length + 1;
      let nextCount = tableList.length + Number(startingTableNumber);
      for (let i = 0; i < tableCountToAdd; i++) {
        let table = new Tables();
        table["branch_id"] = branchId;
        table["company_id"] = req.companyId;
        table["floor_id"] = updateData._id;
        table["floor_name"] = updateData.name;
        table["name"] = `${updateData.table_prefix}${nextCount}`;
        table["table_prefix"] = updateData.table_prefix;
        table.save();
        nextCount++;
      }
    }

    async function updateTablePrefix(
      tableToUpdate,
      prefix,
      isFloorNameChanged
    ) {
      await asyncForEach(tableToUpdate, async (table, i) => {
        let setOption;
        if (!isFloorNameChanged) {
          setOption = { table_prefix: prefix, name: `${prefix}${i + 1}` };
        } else {
          setOption = {
            table_prefix: prefix,
            floor_name: updateData.name,
            name: `${prefix}${i + 1}`,
          };
        }

        return await Tables.update(
          { _id: table },
          { $set: setOption },
          (err, updatedResult) => {
            if (err) {
              console.error({
                status: 0,
                message: "error updating prefix",
                error: err,
              });
              return err;
            } else {
              return updatedResult;
            }
          }
        );
      });
      return { message: "success" };
    }

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    async function updateBranch() {
      return await Branches.update(
        { "table_plans._id": updateData._id },
        {
          $set: { "table_plans.$": updateData },
        },
        (err, result) => {
          if (err) {
            return err;
          } else {
            return result;
          }
        }
      );
    }
  }
};

exports.remove_table_plan = (req, res) => {
  let updateData = req.body.branch_detail;
  Branches.update(
    { "table_plans._id": updateData._id },
    {
      $pull: { table_plans: { _id: updateData._id } },
    },
    function (err, result) {
      if (err) {
        console.error({
          status: 0,
          message: "error removing floor",
          error: err,
        });
        res.status(404).json({
          status: 0,
          message: "error removing floor",
          error: "problem with the server",
        });
      } else {
        Tables.deleteMany(
          { floor_id: updateData._id },
          (err, updatedRresult) => {
            if (err) {
              console.error({
                status: 0,
                message: "error removing floor",
                error: err,
              });
              res.status(404).json({
                status: 0,
                message: "error removing floor",
                error: "problem with the server",
              });
            } else {
              res.status(201).json({
                status: 1,
                message: "floor removed successfully",
              });
            }
          }
        );
      }
    }
  );
};

/**
 * Branch Departments
 */

exports.updateDepartments = (req, res) => {
  let updateData = req.body.department_detail;
  console.log('updateData>>>>>>>>>>>>>>>>>>>>>>',updateData);
  let branchId = "";
  branchId = updateData.branch_id;
  console.log('branchId>>>>>>>>>>>>>>>>>>>>>>>>',branchId);
  
  if (!updateData._id) {
    console.log('<<<<<<<<<<<<<<<<<<No updateData ID>>>>>>>>>>>>>>>>>>');
    
    Branches.find({ company_id: req.companyId }, (err, branches) => {
      if (err) {
        console.log('<<<<<<<<<<<<<<<<ERR>>>>>>>>>>>>>>>>>>>>');
        
        console.error({
          status: 0,
          message: "error adding section name",
          error: err,
        });
        res.status(500).send({
          status: 0,
          message: "error adding section name",
          error: "Problem With the server",
        });
      } else {
        console.log('<<<<<<<<<<<<<<<<branches>>>>>>>>>>>>>>>>>>>>',branches);
        
        let uploadImage = new Promise((resolve, reject) => {
          if (updateData.imageData && updateData.imageData.image) {
            let imgdata = updateData.imageData.image;

            var filename = Math.floor(Math.random() * Math.floor(999999));
            var filetype = "";
            if (imgdata.indexOf("png;base64") > -1) {
              var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
              filetype = ".png";
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            } else {
              filetype = ".jpeg";
              var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            }
            if (!fs.existsSync("uploads/menu_sections/images/")) {
              fs.mkdirSync("uploads/menu_sections/images/", {
                recursive: true,
              });
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
                updateData.imageUrl = newpath;
                /**
                 * Note: This multi image resizing is used to improve performance on the app
                 */
                let small_image_dir = "uploads/menu_sections/images/small/";
                let medium_image_dir = "uploads/menu_sections/images/medium/";
                let large_image_dir = "uploads/menu_sections/images/large/";

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

                resolve(updateData);
              }
            });
          } else {
            resolve(updateData);
          }
        });
        uploadImage.then((result) => {
          updateData._id = new mongoose.mongo.ObjectId();
          Branches.findOneAndUpdate(
            { _id: branchId },
            {
              $push: { departments: updateData },
            },
            { new: true, upsert: true },
            (err, result) => {
              if (err) {
                console.error({
                  status: 0,
                  message: "error adding new department",
                  error: err,
                });
                res.status(500).json({
                  status: 0,
                  message: "error adding new department",
                  error: "Problem with the server",
                });
              } else {
                res.status(201).json({
                  status: 1,
                  message: "department created successfully",
                });
              }
            }
          );
        });
      }
    });
  } else if (updateData._id) {

    Branches.findOne({ _id: branchId }, async function (err, branchDetails) {

      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        console.log('branchDetails>>>>>>>>>>>>>>>>>>>',branchDetails);

        let existing_categories = branchDetails.departments;
        let chosenDepartmentIndex;
        let chosenDepartment = existing_categories.filter((department, i) => {
          if (department._id == updateData._id) {
            chosenDepartmentIndex = i;
            return department
          }
        })[0];
        // edit starts
        console.log('<<<<<<<<<<<<<<<<<<updateData>>>>>>>>>>>>>>>>>>>>',updateData);
        console.log('<<<<<<<<<<<<<<<<<<branchDetails.length>>>>>>>>>>>>>>>>>>>>',branchDetails.departments.length);
        console.log('<<<<<<<<<<<<<<<<<<updateData.department_order>>>>>>>>>>>>>>>>>>>>',updateData.department_order);
        console.log('<<<<<<<<<<<<<<<<<<chosenDepartment.department_order>>>>>>>>>>>>>>>>>>>>',chosenDepartment.department_order);
        
        if (updateData.department_order < branchDetails.departments.length && updateData.department_order > chosenDepartment.department_order) {
          console.log('ConditionWorks');
          
          existing_categories.forEach((department) => {
            if ((department.department_order <= updateData.department_order) && (department.department_order > chosenDepartment.department_order)) {
              department.department_order--;
            }
          });
          existing_categories[chosenDepartmentIndex].department_order = updateData.department_order;
          console.log('existing_categories[chosenDepartmentIndex].department_order',existing_categories[chosenDepartmentIndex].department_order);
          
        } else if (updateData.department_order < branchDetails.departments.length && updateData.department_order < chosenDepartment.department_order) {
          console.log('ConditionWorks1');
          
          existing_categories.forEach((department) => {
            if ((department.department_order >= updateData.department_order) && (department.department_order < chosenDepartment.department_order)) {
              department.department_order++;
            }
          });
          existing_categories[chosenDepartmentIndex].department_order = updateData.department_order;
          console.log('existing_categories[chosenDepartmentIndex].department_order>>>>>>>>>1',existing_categories[chosenDepartmentIndex].department_order);
          
        }else if (updateData.department_order < branchDetails.departments.length && chosenDepartment.department_order === updateData.department_order) {
          console.log('ConditionWorks2');
          
          existing_categories[chosenDepartmentIndex] = updateData;
        } else if (updateData.department_order >= branchDetails.departments.length) {
          console.log('ConditionWorks3');
          
          existing_categories.forEach((department) => {
            if ((department.department_order > chosenDepartment.department_order)) {
              department.department_order--;
            }
          });
          existing_categories[chosenDepartmentIndex].department_order = branchDetails.departments.length;
          console.log('existing_categories[chosenDepartmentIndex].department_order',existing_categories[chosenDepartmentIndex].department_order);
          
        }
        

        console.log('Afteredit>>>>>>>>>>>existing_categories',existing_categories);
        Branches.update({ "departments._id": updateData._id },
        { "$set": { 'departments': existing_categories } },
        { "new": true, "upsert": true },
        (err, removedResult) => {
          if (err) {
            console.log('UpdateErr>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
            
            console.error({
              status: 0,
              message: 'error removing Departments',
              error: err
            });
            res.status(500).json({
              status: 0,
              message: 'error removing Departments',
              error: 'problem with the server'
            });
          } else {
            console.log('Updated Sucessfully>>>>>>>>>>>>>>>>>>>>>>>>');
            
            res.status(201).json({
              status: 1,
              message: 'Departments removed successfully',
            });
          }
        })
			
      // edit ends
        console.log('chosenDepartmentIndex>>>>>>>>>>>>>>>>>>>',chosenDepartmentIndex);
        
        let uploadImage = new Promise((resolve, reject) => {
          if (updateData.imageData && updateData.imageData.image) {
            let imgdata = updateData.imageData.image;

            var filename = Math.floor(Math.random() * Math.floor(999999));
            var filetype = "";
            if (imgdata.indexOf("png;base64") > -1) {
              var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
              filetype = ".png";
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            } else {
              filetype = ".jpeg";
              var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
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
                updateData.imageUrl = newpath;
                /**
                 * Note: This multi image resizing is used to improve performance on the app
                 */
                let small_image_dir = "uploads/menu_sections/images/small/";
                let medium_image_dir = "uploads/menu_sections/images/medium/";
                let large_image_dir = "uploads/menu_sections/images/large/";

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

                resolve(updateData);
              }
            });
          } else {
            resolve(updateData);
          }
        });

        // edit
        uploadImage.then((result) => {
          Branches.updateOne(
            { "departments._id": updateData._id },
            {
              $set: { "departments.$": updateData },
            },
            (err, result) => {
              if (err) {
                console.error({
                  status: 0,
                  message: "error updating section name",
                  error: err,
                });
                res.status(500).send({
                  status: 0,
                  message: "error updating section name",
                  error: "Problem With the server",
                });
              } else {
                console.log('EditWorks');
                // res.status(201).send({
                //   status: 1,
                //   message: "departments added successfully",
                // });
              }
            }
          );
        });

        
      }
    });
  }
};


exports.removeDepartments = (req, res) => {
	let updateData = req.body.department_detail;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (updateData._id) {
			Branches.findOne({ "departments._id": updateData._id }, (err, result) => {
				if (err) {
          console.log('Err Works>>>>>>>>>>>>>>>>>>>>>>>>>>');
          
					console.error({
						status: 0,
						message: 'error removing department',
						error: err
					});
					res.status(500).json({
						status: 0,
						message: 'error removing department',
						error: 'problem with the server'
					});
				} else {
          console.log('result Works>>>>>>>>>>>>>>>>>>>>>>>>>>',result);          
          let existing_departments = result.departments;
          console.log('existing_departments>>>>>>>>>>>>>>>>',existing_departments);
          
          let chosenDepartmentIndex;
          console.log('chosenDepartmentIndex>>>>>>>>>>>>>>>>',chosenDepartmentIndex);
          
					let chosenDepartment = existing_departments.filter((department, i) => {
            
						if (department._id == updateData._id) {
              console.log('Condition works>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
              
							chosenDepartmentIndex = i;
							return department
						}
					})[0]
          console.log('chosenDepartment>>>>>>>>>>>>>>>>',chosenDepartment);

					existing_departments.forEach((department) => {
						if ((department.department_order > chosenDepartment.department_order) && (department._id != chosenDepartment._id)) {
							department.department_order--;
						}
					});
					// existing_departments[chosenDepartmentIndex].status = updateData.status; // old method now changed to hard remove
					existing_departments.splice(chosenDepartmentIndex, 1)
          console.log('AfterDelete>>>>>>>>>>>>>existing_departments',existing_departments);
          
					Branches.update({ "departments._id": updateData._id },
						{ "$set": { 'departments': existing_departments } },
						{ "new": true, "upsert": true },
						(err, removedResult) => {
							if (err) {
                console.log('UpdateErr>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
                
								console.error({
									status: 0,
									message: 'error removing Departments',
									error: err
								});
								res.status(500).json({
									status: 0,
									message: 'error removing Departments',
									error: 'problem with the server'
								});
							} else {
                console.log('Updated Sucessfully>>>>>>>>>>>>>>>>>>>>>>>>');
                
								res.status(201).json({
									status: 1,
									message: 'Departments removed successfully',
								});
							}
						})
				}
			});
		} else if (!updateData._id) {
			res.status(400).send('Departments is not found');
		}
	} else {
		res.status(401).send({ 'message': 'UnAuthorized Access' })
	}
};


// exports.removeDepartments = async (req, res) => {
//   let updateData = req.body.department_detail;
//   try {
//     await Branches.update(
//       { "departments._id": updateData._id },
//       {
//         $pull: { departments: { _id: updateData._id } },
//       }
//     );
//     let branchCategory = await Categories.findOne({
//       branch_id: updateData.branch_id,
//     });
//     await asyncForEach(branchCategory.categories, async (category, i) => {
//       category.associated_dept_sections =
//         category.associated_dept_sections.filter(
//           (x) => x._id != updateData._id
//         );
//     });

//     await branchCategory.save();

//     res.status(201).json({
//       status: 1,
//       message: "department removed successfully",
//     });

//     async function asyncForEach(array, callback) {
//       for (let index = 0; index < array.length; index++) {
//         await callback(array[index], index, array);
//       }
//     }
//   } catch (err) {
//     res.status(500).json({
//       status: 0,
//       message: "error removing department",
//       error: "problem with the server",
//     });
//   }
// };

exports.switchDepartmentLayer = (req, res) => {
  let departmentDetail = req.body.department_detail;
  if (
    !departmentDetail.branch_id ||
    typeof departmentDetail.status !== "boolean"
  ) {
    res.status(400).json({
      status: 0,
      message: "please check the parameters",
      error: "invalid parameters ",
    });
  } else {
    if (
      req.accessType === "superadmin" ||
      req.accessType === "admin" ||
      req.accessType === "staffs"
    ) {
      Branches.findOne({ _id: departmentDetail.branch_id }, (err, branch) => {
        if (err) {
          res.status(500).json({
            status: 0,
            message: "internal server error",
            error: "problem with the server",
          });
        } else if (!branch) {
          res.status(404).json({
            status: 0,
            message: "details not found",
            error: "invalid data",
          });
        } else {
          branch.has_department_module = departmentDetail.status;
          branch
            .save()
            .then((result) => {
              res.status(200).json({
                status: 1,
                message: "department detail updated successfully",
              });
            })
            .catch((err) => {
              res.status(500).json({
                status: 0,
                message: "error updating department",
                error: "problem with the server",
              });
            });
        }
      });
    } else {
      req.status(401).json({
        status: 0,
        message: "Permission denied",
        error: "Unauthorised Access ",
      });
    }
  }
};

/**
 * Department Banners
 */

exports.updateDepartmentBanner = (req, res) => {
  let bannerdetails = req.body.banner_detail;
  let newpath;
  let uploadImage = new Promise((resolve, reject) => {
    if (bannerdetails.imageData && bannerdetails.imageData.image) {
      let imgdata = bannerdetails.imageData.image;
      var filename = Math.floor(Math.random() * Math.floor(999999));
      var filetype = "";
      if (!fs.existsSync("uploads/dept_banners/")) {
        fs.mkdirSync("uploads/dept_banners/");
      }
      if (imgdata.indexOf("png;base64") > -1) {
        var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
        filetype = ".png";
        newpath = "uploads/dept_banners/" + filename + filetype;
      } else {
        filetype = ".jpeg";
        var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
        newpath = "uploads/dept_banners/" + filename + filetype;
      }

      fs.writeFile(newpath, base64Data, "base64", function (err) {
        if (err) {
          res.status(500).json({
            status: 0,
            message: "error uploading image",
          });
        } else {
          /**
           * Note: This multi image resizing is used to improve performance on the app
           */
          let small_image_dir = "uploads/dept_banners/small/";
          let medium_image_dir = "uploads/dept_banners/medium/";

          if (!fs.existsSync(small_image_dir)) {
            fs.mkdirSync(small_image_dir, { recursive: true });
          }
          if (!fs.existsSync(medium_image_dir)) {
            fs.mkdirSync(medium_image_dir, { recursive: true });
          }

          sharp(newpath)
            .resize(150, 100)
            .jpeg({ quality: 50 })
            .toFile(`${small_image_dir}${filename}${filetype}`);
          sharp(newpath)
            .resize(300, 200)
            .jpeg({ quality: 80 })
            .toFile(`${medium_image_dir}${filename}${filetype}`);
        }
      });
      resolve(bannerdetails);
    } else {
      resolve(bannerdetails);
    }
  });
  uploadImage.then((result) => {
    if (bannerdetails._id) {
      Branches.findOne({ _id: bannerdetails.branch_id }, (err, branch) => {
        if (err) {
          res.status(500).send({
            status: 0,
            message: "problem with the server",
            error: "internal server error",
          });
        } else if (!branch) {
          res.status(404).send({
            status: 0,
            message: "no branch found",
            error: "invalid paramters",
          });
        } else {
          let selectedDepartment = branch.departments.find(
            (x) => x._id == bannerdetails.department_id
          );

          if (selectedDepartment.pop_up_banners.length) {
            selectedDepartment.pop_up_banners.forEach((banner) => {
              if (banner._id == bannerdetails._id) {
                banner.set(bannerdetails);
                banner.img_url = newpath ? newpath : banner.img_url;
              }
            });

            branch.save((err, updatedBanners) => {
              if (err) return err;
              res.send(updatedBanners);
            });
          } else {
            selectedDepartment.pop_up_banners[0] = { img_url: newpath };
            res.send({
              status: 1,
              message: "no banners found",
              error: "invalid data",
            });
          }
        }
      });
    } else {
      // TODO: New Image on board
      Branches.findOne({ _id: bannerdetails.branch_id }, (err, branch) => {
        if (err) {
          res.status(500).send({
            status: 0,
            message: "problem with the server",
            error: "internal server error",
          });
        } else if (!branch) {
          res.status(404).send({
            status: 0,
            message: "no branch found",
            error: "invalid paramters",
          });
        } else {
          let selectedDepartment = branch.departments.find(
            (x) => x._id == bannerdetails.department_id
          );
          if (selectedDepartment.pop_up_banners.length) {
            bannerdetails.img_url = newpath;
            selectedDepartment.pop_up_banners.push(bannerdetails);

            branch.save((err, updatedBanners) => {
              if (err) return err;
              res.send(updatedBanners);
            });
          } else {
            selectedDepartment.pop_up_banners[0] = { img_url: newpath };
            selectedDepartment.pop_up_banners[0].cta_text =
              bannerdetails.cta_text;
            selectedDepartment.pop_up_banners[0].linked_category =
              bannerdetails.linked_category;
            selectedDepartment.pop_up_banners[0].title = bannerdetails.title;

            branch.save((err, updatedBanners) => {
              if (err) return err;
              res.send(updatedBanners);
            });
          }
          // if(branch.banner_images.length){
          // 	branch.banner_images.push({ img_url: newpath });

          // 	branch.save((err, updatedBanners) => {
          // 		if (err) return err;
          // 		res.send(updatedBanners);
          // 	});
          // }else {
          // 	branch.banner_images[0] = { img_url: newpath };
          // 	branch.save((err, updatedBanners) => {
          // 		if (err) return err;
          // 		res.send(updatedBanners);
          // 	});
          // }
        }
      });
      // res.send({
      // 	message: 'success'
      // })
    }
  });
};

exports.removeDepartmentBanner = async (req, res) => {
  let updateData = req.body.banner_detail;
  try {
    let branch = await Branches.findOne({ _id: updateData.branch_id });
    let selectedDepartment = await branch.departments.find(
      (x) => x._id == updateData.department_id
    );
    selectedDepartment["pop_up_banners"] =
      selectedDepartment.pop_up_banners.filter((x) => x._id != updateData._id);
    await branch.save();
    res.status(201).send({
      status: 1,
      message: "banners updated successfully",
      data: branch,
    });
  } catch {
    res.status(500).send({
      message: "error updating banners",
      error: "error updating banners",
    });
  }
};

exports.switchDepartmentBanner = (req, res) => {
  let departmentDetail = req.body.banner_detail;
};

/**
 * Branch MenuSections
 */
exports.update_new_menu_section = (req, res) => {
  let updateData = req.body.section_detail;
  let branchId = "";
  branchId = updateData.branch_id;

  if (!updateData._id) {
    Branches.find({ company_id: req.companyId }, (err, branches) => {
      if (err) {
        console.error({
          status: 0,
          message: "error adding section name",
          error: err,
        });
        res.status(500).send({
          status: 0,
          message: "error adding section name",
          error: "Problem With the server",
        });
      } else {
        let uploadImage = new Promise((resolve, reject) => {
          if (updateData.imageData && updateData.imageData.image) {
            let imgdata = updateData.imageData.image;

            var filename = Math.floor(Math.random() * Math.floor(999999));
            var filetype = "";
            if (imgdata.indexOf("png;base64") > -1) {
              var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
              filetype = ".png";
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            } else {
              filetype = ".jpeg";
              var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            }
            if (!fs.existsSync("uploads/menu_sections/images/")) {
              fs.mkdirSync("uploads/menu_sections/images/", {
                recursive: true,
              });
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
                updateData.imageUrl = newpath;
                /**
                 * Note: This multi image resizing is used to improve performance on the app
                 */
                let small_image_dir = "uploads/menu_sections/images/small/";
                let medium_image_dir = "uploads/menu_sections/images/medium/";
                let large_image_dir = "uploads/menu_sections/images/large/";

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

                resolve(updateData);
              }
            });
          } else {
            resolve(updateData);
          }
        });
        uploadImage.then((result) => {
          updateData._id = new mongoose.mongo.ObjectId();

          let selectedBranch = branches.find(
            (branch) => branch._id == branchId
          );

          if (!selectedBranch.departments) {
            selectedBranch.departments = [];
          }

          let selectedDepartment = selectedBranch.departments.find(
            (x) => x._id == updateData.department_id
          );

          if (selectedDepartment) {
            selectedDepartment.menu_sections.push(updateData);
          }

          selectedBranch
            .save()
            .then((result) => {
              Categories.findOneAndUpdate(
                { branch_id: branchId },
                {
                  $push: {
                    "categories.$[].associated_dept_sections": {
                      $each: [updateData],
                    },
                  },
                },
                (err, updatedCategories) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "error adding section name",
                      error: err,
                    });
                    res.status(500).send({
                      status: 0,
                      message: "error adding section name",
                      error: "Problem With the server",
                    });
                  } else {
                    if (
                      branches.length == 1 &&
                      branches[0].departments.length == 0
                    ) {
                      //NOTE: This is the only initilizing branch
                      // Update the member tour status as floor_details
                      Member.update(
                        { _id: req.userId },
                        { $set: { tour_status: "menu_sections" } },
                        (err, updatedFloorPlans) => {
                          if (err) {
                            console.error({
                              status: 0,
                              message: "error adding section names",
                              error: err,
                            });
                            res.status(500).send({
                              status: 0,
                              message: "error adding section names",
                              error: "Problem with the server",
                            });
                          } else {
                            res.status(201).json({
                              status: 1,
                              message: "section anme created successfully",
                            });
                          }
                        }
                      );
                    } else {
                      res.status(201).json({
                        status: 1,
                        message: "section name created successfully",
                      });
                    }
                  }
                }
              );
            })
            .catch((err) => {
              console.log("error  ------------------", err);
            });
        });
      }
    });
  } else if (updateData._id) {
    Branches.findOne({ _id: branchId }, async function (err, branchDetails) {
      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        // Ranking Logic starts
        console.log('branchDetails>>>>>>>>>>>>>>>>>>>',branchDetails);

        let existing_categories = branchDetails.departments.filter((dept) => {
          if(dept._id == updateData.department_id) {
            return dept;
          }
        })[0].menu_sections
        let chosenDepartmentIndex;
        let chosenDepartment = existing_categories.filter((department, i) => {
          if (department._id == updateData._id) {
            chosenDepartmentIndex = i;
            return department
          }
        })[0];
        // edit starts
        console.log('<<<<<<<<<<<<<<<<<<updateData>>>>>>>>>>>>>>>>>>>>',updateData);
        console.log('<<<<<<<<<<<<<<<<<<existing_categories.length>>>>>>>>>>>>>>>>>>>>',existing_categories.length);
        console.log('<<<<<<<<<<<<<<<<<<updateData.department_order>>>>>>>>>>>>>>>>>>>>',updateData.section_order);
        console.log('<<<<<<<<<<<<<<<<<<chosenDepartment>>>>>>>>>>>>>>>>>>>>',chosenDepartment);
        
        if (updateData.section_order < existing_categories.length && updateData.section_order > chosenDepartment.section_order) {
          console.log('ConditionWorks');
          
          existing_categories.forEach((department) => {
            if ((department.section_order <= updateData.section_order) && (department.section_order > chosenDepartment.section_order)) {
              department.section_order--;
            }
          });
          existing_categories[chosenDepartmentIndex].section_order = updateData.section_order;
          console.log('existing_categories[chosenDepartmentIndex].section_order',existing_categories[chosenDepartmentIndex].section_order);
          
        } else if (updateData.section_order < existing_categories.length && updateData.section_order < chosenDepartment.section_order) {
          console.log('ConditionWorks1');
          
          existing_categories.forEach((department) => {
            if ((department.section_order >= updateData.section_order) && (department.section_order < chosenDepartment.section_order)) {
              department.section_order++;
            }
          });
          existing_categories[chosenDepartmentIndex].section_order = updateData.section_order;
          console.log('existing_categories[chosenDepartmentIndex].section_order>>>>>>>>>1',existing_categories[chosenDepartmentIndex].section_order);
          
        }else if (updateData.section_order < existing_categories.length && chosenDepartment.section_order === updateData.section_order) {
          console.log('ConditionWorks2');
          
          existing_categories[chosenDepartmentIndex] = updateData;
        } else if (updateData.section_order >= existing_categories.length) {
          console.log('ConditionWorks3');
          
          existing_categories.forEach((department) => {
            if ((department.section_order > chosenDepartment.section_order)) {
              department.section_order--;
            }
          });
          existing_categories[chosenDepartmentIndex].section_order = existing_categories.length;
          console.log('existing_categories[chosenDepartmentIndex].section_order',existing_categories[chosenDepartmentIndex].section_order);
          
        }
        

        console.log('Afteredit>>>>>>>>>>>existing_categories',existing_categories);

        let totalDepartments = branchDetails.departments;
        totalDepartments.forEach((Tdep) =>{
          if (Tdep._id == updateData.department_id) {
            Tdep.menu_sections = existing_categories;
          }
        })

        Branches.update({ "departments._id": updateData._id },
        { "$set": { 'departments': totalDepartments } },
        { "new": true, "upsert": true },
        (err, removedResult) => {
          if (err) {
            console.log('UpdateErr>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
            
            console.error({
              status: 0,
              message: 'error removing Departments',
              error: err
            });
            res.status(500).json({
              status: 0,
              message: 'error removing Departments',
              error: 'problem with the server'
            });
          } else {
            console.log('Updated Sucessfully>>>>>>>>>>>>>>>>>>>>>>>>');
            
            res.status(201).json({
              status: 1,
              message: 'Departments removed successfully',
            });
          }
        })
			
        console.log('chosenDepartmentIndex>>>>>>>>>>>>>>>>>>>',chosenDepartmentIndex);

        // Ranking Logic Ends
        let uploadImage = new Promise((resolve, reject) => {
          if (updateData.imageData && updateData.imageData.image) {
            let imgdata = updateData.imageData.image;

            var filename = Math.floor(Math.random() * Math.floor(999999));
            var filetype = "";
            if (imgdata.indexOf("png;base64") > -1) {
              var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
              filetype = ".png";
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            } else {
              filetype = ".jpeg";
              var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
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
                updateData.imageUrl = newpath;
                /**
                 * Note: This multi image resizing is used to improve performance on the app
                 */
                let small_image_dir = "uploads/menu_sections/images/small/";
                let medium_image_dir = "uploads/menu_sections/images/medium/";
                let large_image_dir = "uploads/menu_sections/images/large/";

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

                resolve(updateData);
              }
            });
          } else {
            resolve(updateData);
          }
        });

        uploadImage.then((result) => {
          if (!branchDetails.departments) {
            branchDetails.departments = [];
          }

          let selectedDepartment = branchDetails.departments.find(
            (x) => x._id == updateData.department_id
          );
          let selectedMenuSection = selectedDepartment.menu_sections.find(
            (x) => x._id == updateData._id
          );
          selectedMenuSection.set(updateData);

          branchDetails
            .save()
            .then((result) => {
              let temp = new mongoose.mongo.ObjectId(updateData._id);
              Categories.updateOne(
                { "categories.associated_dept_sections._id": temp },
                {
                  $set: {
                    "categories.$[].associated_dept_sections.$[menu]":
                      updateData,
                  },
                },
                { arrayFilters: [{ "menu._id": temp }] },
                (err, result) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "error updating sections",
                      error: err,
                    });
                    res.status(500).send({
                      status: 0,
                      message: "error updating sections",
                      error: "problem with the server",
                    });
                  } else {
                    // res.status(201).send({
                    //   status: 1,
                    //   message: "section name added successfully",
                    // });
                  }
                }
              );
            })
            .catch((err) => {
              console.log("error =============", err);
            });
        });
      }
    });
  }
};

exports.remove_new_menu_section = async (req, res) => {
  let updateData = req.body.section_detail;
  console.log('<<<<<<<<<<updateData>>>>>>>>>',updateData);

  try {
    // await Branches.updateOne(
    //   { _id: updateData.branch_id },
    //   {
    //     $pull: { "departments.$[].menu_sections": { _id: updateData._id } },
    //   }
    // );
    let branchDetails = await Branches.findOne({ 
      _id: updateData.branch_id,
    });
    let SelectedSection;
    let SelectedSectionIndex;
    let totalDepartments = branchDetails.departments;
    let selectedSectionList = totalDepartments.filter((dept) => {
      if(dept._id == updateData.department_id) {
        return dept;
      }
    })[0].menu_sections
    selectedSectionList.forEach((section, i) => {
      if(section._id == updateData._id) {
        SelectedSectionIndex = i;
        SelectedSection = section;
      }
    });

    selectedSectionList.forEach((section) => {
      if ((section.section_order > SelectedSection.section_order) && (section._id != SelectedSection._id)) {
        section.section_order--;
      }
    });
    selectedSectionList.splice(SelectedSectionIndex, 1)

    totalDepartments.forEach((Tdep) =>{
      if (Tdep._id == updateData.department_id) {
        Tdep.menu_sections = selectedSectionList;
      }
    })

    Branches.update({ "departments._id": updateData.department_id },
    { "$set": { 'departments': totalDepartments } },
    { "new": true, "upsert": true },
    (err, removedResult) => {
      if (err) {        
        console.error({
          status: 0,
          message: 'error removing Departments',
          error: err
        });
        res.status(500).json({
          status: 0,
          message: 'error removing Departments',
          error: 'problem with the server'
        });
      } else {        
        res.status(201).json({
          status: 1,
          message: 'Departments removed successfully',
        });
      }
    })


    let branchCategory = await Categories.findOne({ 
      branch_id: updateData.branch_id,
    });
    await asyncForEach(branchCategory.categories, async (category, i) => {
      await asyncForEach(
        category.associated_dept_sections,
        async (depts, i) => {
          depts.menu_sections = depts.menu_sections.filter(
            (x) => x._id != updateData._id
          );
        }
      );
    });
    // console.log('branchCategory>>>>>>>>>',branchCategory);
    await branchCategory.save();

    // res.status(201).json({
    //   status: 1,
    //   message: "department removed successfully",
    // });

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
  } catch (err) {
    console.log("err -------------", err);
    // res.status(500).json({
    //   status: 0,
    //   message: "error removing department",
    //   error: "problem with the server",
    // });
  }

};

/**
 * Branch MenuSections
 */
exports.update_menu_section = (req, res) => {
  let updateData = req.body.section_detail;
  let branchId = "";
  branchId = updateData.branch_id;

  if (!updateData._id) {
    Branches.find({ company_id: req.companyId }, (err, branches) => {
      if (err) {
        console.error({
          status: 0,
          message: "error adding section name",
          error: err,
        });
        res.status(500).send({
          status: 0,
          message: "error adding section name",
          error: "Problem With the server",
        });
      } else {
        let uploadImage = new Promise((resolve, reject) => {
          if (updateData.imageData && updateData.imageData.image) {
            let imgdata = updateData.imageData.image;

            var filename = Math.floor(Math.random() * Math.floor(999999));
            var filetype = "";
            if (imgdata.indexOf("png;base64") > -1) {
              var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
              filetype = ".png";
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            } else {
              filetype = ".jpeg";
              var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            }
            if (!fs.existsSync("uploads/menu_sections/images/")) {
              fs.mkdirSync("uploads/menu_sections/images/", {
                recursive: true,
              });
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
                updateData.imageUrl = newpath;
                /**
                 * Note: This multi image resizing is used to improve performance on the app
                 */
                let small_image_dir = "uploads/menu_sections/images/small/";
                let medium_image_dir = "uploads/menu_sections/images/medium/";
                let large_image_dir = "uploads/menu_sections/images/large/";

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

                resolve(updateData);
              }
            });
          } else {
            resolve(updateData);
          }
        });
        uploadImage.then((result) => {
          updateData._id = new mongoose.mongo.ObjectId();
          Branches.findOneAndUpdate(
            { _id: branchId },
            {
              $push: { menu_sections: updateData },
            },
            { new: true, upsert: true },
            (err, result) => {
              if (err) {
                console.error({
                  status: 0,
                  message: "error adding new section name",
                  error: err,
                });
                res.status(500).json({
                  status: 0,
                  message: "error adding new section name",
                  error: "Problem with the server",
                });
              } else {
                // updateData['checked'] = false; //removed since undefined means the same
                Categories.findOneAndUpdate(
                  { branch_id: branchId },
                  {
                    $push: {
                      "categories.$[].associated_menu_sections": {
                        $each: [updateData],
                      },
                    },
                  },
                  (err, updatedCategories) => {
                    if (err) {
                      console.error({
                        status: 0,
                        message: "error adding section name",
                        error: err,
                      });
                      res.status(500).send({
                        status: 0,
                        message: "error adding section name",
                        error: "Problem With the server",
                      });
                    } else {
                      if (
                        branches.length == 1 &&
                        branches[0].menu_sections.length == 0
                      ) {
                        //NOTE: This is the only initilizing branch
                        // Update the member tour status as floor_details
                        Member.update(
                          { _id: req.userId },
                          { $set: { tour_status: "menu_sections" } },
                          (err, updatedFloorPlans) => {
                            if (err) {
                              console.error({
                                status: 0,
                                message: "error adding section names",
                                error: err,
                              });
                              res.status(500).send({
                                status: 0,
                                message: "error adding section names",
                                error: "Problem with the server",
                              });
                            } else {
                              res.status(201).json({
                                status: 1,
                                message: "section anme created successfully",
                              });
                            }
                          }
                        );
                      } else {
                        res.status(201).json({
                          status: 1,
                          message: "section name created successfully",
                        });
                      }
                    }
                  }
                );
              }
            }
          );
        });
      }
    });
  } else if (updateData._id) {
    Branches.findOne({ _id: branchId }, async function (err, branchDetails) {
      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        let uploadImage = new Promise((resolve, reject) => {
          if (updateData.imageData && updateData.imageData.image) {
            let imgdata = updateData.imageData.image;

            var filename = Math.floor(Math.random() * Math.floor(999999));
            var filetype = "";
            if (imgdata.indexOf("png;base64") > -1) {
              var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
              filetype = ".png";
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
            } else {
              filetype = ".jpeg";
              var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
              var newpath =
                "uploads/menu_sections/images/" + filename + filetype;
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
                updateData.imageUrl = newpath;
                /**
                 * Note: This multi image resizing is used to improve performance on the app
                 */
                let small_image_dir = "uploads/menu_sections/images/small/";
                let medium_image_dir = "uploads/menu_sections/images/medium/";
                let large_image_dir = "uploads/menu_sections/images/large/";

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

                resolve(updateData);
              }
            });
          } else {
            resolve(updateData);
          }
        });
        uploadImage.then((result) => {
          Branches.updateOne(
            { "menu_sections._id": updateData._id },
            {
              $set: { "menu_sections.$": updateData },
            },
            (err, result) => {
              if (err) {
                console.error({
                  status: 0,
                  message: "error updating section name",
                  error: err,
                });
                res.status(500).send({
                  status: 0,
                  message: "error updating section name",
                  error: "Problem With the server",
                });
              } else {
                let temp = new mongoose.mongo.ObjectId(updateData._id);
                Categories.updateOne(
                  { "categories.associated_menu_sections._id": temp },
                  {
                    $set: {
                      "categories.$[].associated_menu_sections.$[menu]":
                        updateData,
                    },
                  },
                  { arrayFilters: [{ "menu._id": temp }] },
                  (err, result) => {
                    if (err) {
                      console.error({
                        status: 0,
                        message: "error updating sections",
                        error: err,
                      });
                      res.status(500).send({
                        status: 0,
                        message: "error updating sections",
                        error: "problem with the server",
                      });
                    } else {
                      res.status(201).send({
                        status: 1,
                        message: "section name added successfully",
                      });
                    }
                  }
                );
              }
            }
          );
        });
      }
    });
  }
};

exports.remove_menu_section = (req, res) => {
  let updateData = req.body.section_detail;
  Branches.update(
    { "menu_sections._id": updateData._id },
    {
      $pull: { menu_sections: { _id: updateData._id } },
    },
    function (err, result) {
      if (err) {
        console.error({
          status: 0,
          message: "error removing section name",
          error: err,
        });
        res.status(404).json({
          status: 0,
          message: "error removing section name",
          error: "problem with the server",
        });
      } else {
        Categories.findOneAndUpdate(
          { branch_id: updateData.branch_id },
          {
            $pull: {
              "categories.$[].associated_menu_sections": {
                name: updateData.name,
              },
            },
          },
          (err, updatedCategories) => {
            if (err) {
              console.error({
                status: 0,
                message: "error removing section name",
                error: err,
              });
              res.status(404).json({
                status: 0,
                message: "error removing section name",
                error: "problem with the server",
              });
            } else {
              res.status(201).json({
                status: 1,
                message: "section name removed successfully",
              });
            }
          }
        );
      }
    }
  );
};

/**
 * Branch Printers
 */

exports.update_printers = (req, res) => {
	console.log("body-----",req.body);
  let updateData = req.body.branch_detail;
  let branchId = "";

  console.log(updateData);
  branchId = updateData.branch_id;

  if (!updateData._id) {
    Branches.find({ company_id: req.companyId }, (err, branches) => {
      if (err) {
        console.error({
          status: 0,
          message: "Error Updating Table Plan",
          error: err,
        });
        res.status(500).send({
          status: 0,
          message: "Error updating Table Plan",
          error: "Problem With the server",
        });
      } else {
        Branches.findOneAndUpdate(
          { _id: branchId },
          {
            $push: { assigned_printers: updateData },
          },
          { new: true, upsert: true },
          (err, result) => {
            if (err) {
              console.error({
                status: 0,
                message: "error adding new table plan",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error adding new table plan",
                error: "Problem with the server",
              });
            } else {
              res.status(201).json({
                status: 1,
                message: "printer assigned successfully",
              });
            }
          }
        );
      }
    });
  } else if (updateData._id) {
    Branches.findOne({ _id: branchId }, async (err, branchDetails) => {
      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        Branches.update(
          {
            _id: updateData.branch_id,
            "assigned_printers._id": updateData._id,
          },
          { $set: { "assigned_printers.$": updateData } },
          (err, results) => {
            if (err) {
              console.error({
                status: 0,
                message: "error finding branch",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error adding printer",
                error: "problem with the server",
              });
            } else {
              MenuItem.updateMany(
                { printer_id: updateData._id },
                { $set: { assigned_printer: updateData.name } },
                (err, result) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "error finding branch",
                      error: err,
                    });
                    res.status(500).json({
                      status: 0,
                      message: "error adding printer",
                      error: "problem with the server",
                    });
                  } else {
                    res.status(201).json({
                      status: 1,
                      message: "printer updated successfully",
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  }
};

exports.remove_printers = (req, res) => {
  let updateData = req.body.branch_detail;
  Branches.update(
    { "assigned_printers._id": updateData._id },
    {
      $pull: { assigned_printers: { _id: updateData._id } },
    },
    (err, result) => {
      if (err) {
        console.error({
          status: 0,
          message: "error removing printer",
          error: err,
        });
        res.status(404).json({
          status: 0,
          message: "error removing printer",
          error: "problem with the server",
        });
      } else {
        res.status(201).json({
          status: 1,
          message: "printer removed successfully",
        });
      }
    }
  );
};

exports.delete_a_branch = (req, res) => {
  let branchDetail = req.body.branch_detail;
  Branches.findById(branchDetail._id, (err, branch_detail) => {
    if (err) {
      return handleError(err);
    }
    branch_detail.set({ status: branchDetail.status });
    //TODO need to restrict the returning data
    branch_detail.save((err, updatedDetails) => {
      if (err) return handleError(err);
      res.json(updatedDetails);
    });
  });
};

/**
 * Branch Printer Servers
 */
/** @DummyPrinterList */
exports.get_printer_server = (req, res) => {
  // TODO: Use it to get Printer servers
};

exports.update_printer_server = (req, res) => {
  let updateData = req.body.branch_detail;
  let branchId = "";
  branchId = updateData.branch_id;
  if (!updateData._id) {
    Branches.findOneAndUpdate(
      { _id: branchId },
      {
        $push: { printer_servers: updateData },
      },
      { new: true, upsert: true },
      (err, result) => {
        if (err) {
          console.error({
            status: 0,
            message: "error adding new print server",
            error: err,
          });
          res.status(500).json({
            status: 0,
            message: "error adding new print server",
            error: "Problem with the server",
          });
        } else {
          res.status(201).json({
            status: 1,
            message: "printer server added successfully",
          });
        }
      }
    );
  } else if (updateData._id) {
    Branches.findOne({ _id: branchId }, async (err, branchDetails) => {
      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        Branches.update(
          { _id: updateData.branch_id, "printer_servers._id": updateData._id },
          { $set: { "printer_servers.$": updateData } },
          (err, results) => {
            if (err) {
              console.error({
                status: 0,
                message: "error finding branch",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error adding printer",
                error: "problem with the server",
              });
            } else {
              // TODO: update the linked members IP also
              Member.updateMany(
                { assigned_server_printer_id: updateData._id },
                {
                  $set: {
                    assigned_server_printer_name: updateData.name,
                    assigned_server_printer_ip: updateData.assigned_ip,
                  },
                },
                (err, result) => {
                  if (err) {
                    console.error({
                      status: 0,
                      message: "error finding branch",
                      error: err,
                    });
                    res.status(500).json({
                      status: 0,
                      message: "error adding printer",
                      error: "problem with the server",
                    });
                  } else {
                    res.status(201).json({
                      status: 1,
                      message: "printer updated successfully",
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  }
};

exports.remove_printer_server = (req, res) => {
  let updateData = req.body.branch_detail;
  Branches.update(
    { "printer_servers._id": updateData._id },
    {
      $pull: { printer_servers: { _id: updateData._id } },
    },
    (err, result) => {
      if (err) {
        console.error({
          status: 0,
          message: "error removing printer server",
          error: err,
        });
        res.status(404).json({
          status: 0,
          message: "error removing printer server",
          error: "problem with the server",
        });
      } else {
        Member.updateMany(
          { assigned_server_printer_id: updateData._id },
          {
            $unset: {
              assigned_server_printer_id: 1,
              assigned_server_printer_name: 1,
              assigned_server_printer_ip: 1,
            },
          },
          (err, result) => {
            if (err) {
              console.error({
                status: 0,
                message: "error finding branch",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "error adding printer",
                error: "problem with the server",
              });
            } else {
              res.status(201).json({
                status: 1,
                message: "printer server removed successfully",
              });
            }
          }
        );
      }
    }
  );
};

exports.make_default_printer_server = (req, res) => {
  let updateData = req.body.branch_detail;
  let branchId = "";
  branchId = updateData.branch_id;
  if (!updateData._id) {
    console.error({
      status: 0,
      message: "error adding new print server",
      error: err,
    });
    res.status(400).json({
      status: 0,
      message: "error udpating print server",
      error: "invalid parameters",
    });
  } else if (updateData._id) {
    Branches.findOne({ _id: branchId }, async (err, branchDetails) => {
      if (err) {
        console.error({
          status: 0,
          message: "error finding branch",
          error: err,
        });
        res.status(500).json({
          status: 0,
          message: "error finding branch",
          error: "problem with the server",
        });
      } else {
        await asyncForEach(branchDetails.printer_servers, async (x) => {
          if (x._id == updateData._id) {
            x.default_server = true;
          } else {
            x.default_server = false;
          }
        });

        branchDetails.save((err, results) => {
          if (err) {
            console.error({
              status: 0,
              message: "error finding branch",
              error: err,
            });
            res.status(500).json({
              status: 0,
              message: "error adding printer",
              error: "problem with the server",
            });
          } else {
            // TODO: update the linked members IP also
            res.status(201).json({
              status: 1,
              message: "printer updated successfully",
            });
          }
        });
      }
    });
  }
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Writing this API since it is Required As of the design:
 * get branch credentials
 */
exports.get_branch_admin = (req, res) => {
  User.findOne({ branch_id: req.params.branchId }, (err, user) => {
    if (err) {
      //Handle Error
      console.error({
        status: 0,
        message: "Error getting branch manager",
        error: err,
      });
      res.status(500).json({
        status: 0,
        message: "Error getting branch manager",
        error: "Problem with the server",
      });
    } else {
      //Handle No User Scenario
      if (!user) {
        console.error({
          status: 0,
          message: "No user found",
          error: "Invalid Paramerters",
        });
        res.status(404).json({
          status: 0,
          message: "No user found",
          error: "Invalid Paramerters",
        });
      } else {
        let branch_admin = {
          email: user.email,
          name: user.name,
        };
        res.status(200).json({
          status: 1,
          message: "branch manager found successfully",
          branch_admin: branch_admin,
        });
      }
    }
  });
};

exports.synccatelogue = async (req, res) => {
  let totalcatalogue = [];
  let urbanpiperrequest = new Urbanpiperresponse();
  let brandid = req.query.brandid;
  let query = {
    branch_id: req.params.branchId,
    urban_id: { $exists: true },
    active: true,
  };
  if (brandid) {
    query = {
      branch_id: req.params.branchId,
      urban_id: { $exists: true },
      active: true,
      _id: brandid,
    };
  }
  const delivery = await DeliveryBrand.find(query, async (err, brands) => {
    if (err) {
      console.error({ status: 0, message: "Error finding Brand", error: err });
      res
        .status(500)
        .json({
          status: 0,
          message: "Error finding particular brand",
          error: "Problem with server",
        });
    } else if (!brands) {
      res
        .status(200)
        .json({
          status: 0,
          message: "No brand found for a particular id",
          error: "No brand asscoiated with the passed brand id",
        });
    } else {
      brands.map((brand) => {
        if (brand.urban_id) return brand;
      });
      return brands;
    }
  });

  if (delivery) {
    for (let i = 0; i < delivery.length; i++) {
      const brand = delivery[i];
      let categories = [];
      for (let j = 0; j < brand.categories.length; j++) {
        const cat_id = brand.categories[j];
        if (cat_id) {
          categories.push(mongoose.Types.ObjectId(cat_id));
        }
      }

      if (categories.length) {
        await Categories.aggregate(
          [
            {
              $match: {
                branch_id: req.params.branchId,
              },
            },
            {
              $unwind: "$categories",
            },
            {
              $match: {
                "categories._id": {
                  $in: categories,
                },
              },
            },
          ],
          async (err, categoriescol) => {
            if (err) {
              //Handle Error
              console.error({
                status: 0,
                message: "Error getting branch manager",
                error: err,
              });
              res.status(500).json({
                status: 0,
                message: "Error getting branch Details",
                error: err,
              });
            } else {
              if (!categoriescol) {
                console.error({
                  status: 0,
                  message: "No categories found",
                  error: categoriescol,
                });
              } else {
                // console.log("cats");
                // console.log(categoriescol.length);
                let menuitem;
                await getmenuitem(categoriescol).then(async (response) => {
                  menuitem = response;
                  if (menuitem) {
                    let brands = {};
                    brands.brandid = brand._id;
                    brands.urban_id = brand.urban_id;
                    brands.brandname = brand.name;
                    brands.menuitem = menuitem;
                    if (menuitem.items.length) {
                      await sendtourbanpiper(
                        menuitem,
                        req.params.branchId,
                        brand.name
                      ).then((resp) => {
                        // console.log("resp");
                        if (!resp.error && resp.response.statusCode == 200) {
                          urbanpiperrequest.request = resp.body;
                          urbanpiperrequest.response = null;
                          urbanpiperrequest.branch_id = req.params.branchId;
                          urbanpiperrequest.brand_id = brand._id;
                          urbanpiperrequest.request_type = "Managing Catalogue";
                          urbanpiperrequest.save();
                          console.log("success");
                        } else {
                          console.log("error");
                        }
                        brands.status = resp.body;
                        brands.response = resp.response.statusCode;
                        totalcatalogue.push(brands);

                        if (i === delivery.length - 1) {
                          res.status(200).json({
                            status: 1,
                            message: "Branch Catalogues pushed successfully",
                            urbancatelogue: totalcatalogue,
                          });
                        }
                      });
                      // setTimeout(async() => {}, 5000);
                    }
                  }
                });
              }
            }
          }
        );
      }
    }
  }
  async function sendtourbanpiper(menuitem, branchId, brandname) {
    return new Promise((resolve) => {
      setInterval(async () => {}, 5000);
      request(
        {
          url:
            "https://pos-int.urbanpiper.com/external/api/v1/inventory/locations/" +
            branchId +
            "+" +
            brandname.replace(/\s/g, "-") +
            "/",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba",
          },
          method: "POST",
          json: menuitem,
        },
        callback
      );

      function callback(error, response, body) {
        // console.log("callback");
        let resp = {};
        resp.error = error;
        resp.response = response;
        resp.body = body;

        resolve(resp);
      }
    });
  }

  async function getmenuitem(categoriescol) {
    return new Promise(async (resolve) => {
      let urbancatelogue = {};
      let urbancategorylist = [];
      let urbancategoryitemlist = [];
      let urbanoptiongroup = [];
      let urbanoption = [];
      for (let k = 0; k < categoriescol.length; k++) {
        const mastercat = categoriescol[k];

        let cate = mastercat.categories;
        if (cate) {
          let urbancategory = {
            ref_id: cate._id,
            name: cate.name,
            sort_order: cate.rank,
            active: true,
            img_url: "https://dinamic.io/api/" + cate.imageUrl,
          };
          if (cate.status == "active") {
            urbancategory.active = true;
          } else {
            urbancategory.active = false;
          }
          urbancategorylist.push(urbancategory);

          await MenuItem.find(
            { branch_id: req.params.branchId, category_id: cate._id },
            async (err, items) => {
              if (err) {
                console.error({
                  status: 0,
                  message: "Error getting branch manager",
                  error: err,
                });
              } else {
                if (!items) {
                  console.error({
                    status: 0,
                    message: "No user found",
                    error: "Invalid Paramerters",
                  });
                } else {
                  for (let l = 0; l < items.length; l++) {
                    const item = items[l];

                    //console.log(item);
                    let urbancategoryitem = {
                      ref_id: item._id,
                      title: item.name,
                      available: true,
                      description: item.item_description,
                      sold_at_store: true,
                      sort_order: item.item_rank,
                      serves: 1,
                      external_price: 0,
                      price: item.selling_price,
                      markup_price: 0,
                      current_stock: -1,
                      recommended: true,
                      food_type: "1",
                      category_ref_ids: [item.category_id],
                      fulfillment_modes: ["delivery"],
                      img_url: "https://dinamic.io/api/" + item.imageUrl,
                      included_platforms: [
                        "zomato",
                        "swiggy",
                        "dunzo",
                        "amazon",
                      ],
                    };
                    if (item.food_type == "Non Veg") {
                      urbancategoryitem.food_type = 2;
                    } else if (item.food_type == "Veg") {
                      urbancategoryitem.food_type = 1;
                    } else if (item.food_type == "Egg") {
                      urbancategoryitem.food_type = 3;
                    } else {
                      urbancategoryitem.food_type = 4;
                    }
                    if (item.item_status == "active") {
                      urbancategoryitem.available = true;
                    } else {
                      urbancategoryitem.available = false;
                    }
                    if (item.tags == "recommended") {
                      urbancategoryitem.recommended = true;
                    } else {
                      urbancategoryitem.recommended = false;
                    }

                    if (item.addons.length > 0) {
                      //  for (const addon of item.addons) {

                      for (let m = 0; m < item.addons.length; m++) {
                        const addon = item.addons[m];
                        let optiongroup = {
                          ref_id: addon._id,
                          title: addon.heading,
                          ref_title: addon.heading,
                          min_selectable: 0,
                          max_selectable: -1,
                          clear_item_ref_ids: false,
                          display_inline: false,
                          active: true,
                          item_ref_ids: [item._id],
                          sort_order: 0,
                        };
                        if (addon.type == "exclusive") {
                          optiongroup.min_selectable = 1;
                          optiongroup.max_selectable = 1;
                        }
                        urbanoptiongroup.push(optiongroup);
                        if (addon.options.length > 0) {
                          for (let n = 0; n < addon.options.length; n++) {
                            const option = addon.options[n];
                            let optionfield = {
                              ref_id: option._id,
                              title: option.name,
                              ref_title: option.name,

                              available: true,
                              recommended: true,
                              price: option.price,
                              sold_at_store: true,
                              sort_order: 0,
                              clear_opt_grp_ref_ids: false,
                              opt_grp_ref_ids: [addon._id],
                              nested_opt_grps: [],
                              food_type: urbancategoryitem.food_type,
                            };
                            urbanoption.push(optionfield);
                          }
                        }
                      }
                    }
                    urbancategoryitemlist.push(urbancategoryitem);
                  }
                  return urbancategoryitemlist;
                }
              }
            }
          );

          urbancatelogue.flush_categories = true;
          urbancatelogue.categories = urbancategorylist;
          urbancatelogue.flush_items = true;
          urbancatelogue.items = urbancategoryitemlist;
          urbancatelogue.flush_option_groups = true;
          urbancatelogue.option_groups = urbanoptiongroup;

          urbancatelogue.flush_options = true;
          urbancatelogue.options = urbanoption;
        }
      }
      resolve(urbancatelogue);
    });
  }
};
