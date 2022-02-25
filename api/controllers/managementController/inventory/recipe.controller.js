const Recipe = require('../../../models/managementModels/inventory/recipes.model');
// const MenuItems = require('../../../models/managementModels/menu_item.model');

exports.getAllRecipes = (req, res) => {    
    let branch_id = req.params.branchId;
    let limited_to = req.params.limitedTo ? Number(req.params.limitedTo) : 10;
    if(branch_id && (req.accessType === 'admin' ||  req.accessType === 'superadmin' || req.accessType === "staffs")) {
        Recipe.find({ branch_id: branch_id }).limit(limited_to).exec((err, recipes) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error getting recipes',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error getting recipes',
                    error: 'problem with the server'
                });
            }else{
                res.status(200).json({
                    status: 1,
                    message: 'recipes obtained successfully',
                    data: recipes
                })
            }
        })
    }else{
        console.error({
            status: 0,
            message: 'invalid paramters',
            error: err
        });
        res.status(404).json({
            status: 0,
            message: 'invalid paramters',
            error: 'branch id is required'
        });
    }
    // res.send({ message: 'hey buddy from getItemRecipe'})
}

exports.getFullRecipes = (req, res) => {    
    let branch_id = req.params.branchId;
    console.log('**********branch_id',req.params);
    
    if(branch_id && (req.accessType === 'admin' ||  req.accessType === 'superadmin' || req.accessType === "staffs")) {
        Recipe.find({ branch_id: branch_id },(err, recipes) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error getting recipes',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error getting recipes',
                    error: 'problem with the server'
                });
            }else{
                console.log('**********recipes',recipes);
                res.status(200).json({
                    status: 1,
                    message: 'recipes obtained successfully',
                    data: recipes
                })
            }
        })
    }else{
        console.error({
            status: 0,
            message: 'invalid paramters',
            error: err
        });
        res.status(404).json({
            status: 0,
            message: 'invalid paramters',
            error: 'branch id is required'
        });
    }
    // res.send({ message: 'hey buddy from getItemRecipe'})
}

exports.getCategoryRecipes = (req, res) => {
    let category_id = req.params.categoryId;
    if(category_id && (req.accessType === 'admin' ||  req.accessType === 'superadmin' || req.accessType === 'staffs')) {
        Recipe.find({ category_id: category_id }, (err, recipes) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error getting recipes',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error getting recipes',
                    error: 'problem with the server'
                });
            }else{
                res.status(200).json({
                    status: 1,
                    message: 'recipes obtained successfully',
                    data: recipes
                })
            }
        })
    }else if(!category_id){
        console.error({
            status: 0,
            message: 'invalid paramters',
            error: err
        });
        res.status(404).json({
            status: 0,
            message: 'invalid paramters',
            error: 'category id is required'
        });
    }else{
        console.error({
            status: 0,
            message: 'unauthorised access',
            error: 'invalid access type'
        });
        res.status(401).json({
            status: 0,
            message: 'access denied',
            error: 'unauthorized access'
        });
    }
}

exports.getItemRecipe = (req, res) => {
    res.send({ message: 'hey buddy from getItemRecipe'})
}

/**
 * @notes used for both add and update an item Recipe
 */
exports.updateItemRecipe = (req, res) => {
    let recipe_detail = req.body.recipe_detail;
    if(!recipe_detail._id) {
        Recipe.findOne({ item_id: recipe_detail.item_id }, (err, existingRecipe) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error adding Recipe',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error adding Recipe',
                    error: 'problem with the server'
                })
            }else if(!existingRecipe) {
                recipe_detail['company_id'] =  req.companyId;
                let new_recipe = new Recipe(recipe_detail);
                new_recipe.save().then((result) => {
                    res.status(201).json({
                        status: 1,
                        message: 'recipe updated successfully',
                    })
                }).catch((err) => {
                    console.error({
                        status: 0,
                        message: 'error finding recipe',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'error updating recipe',
                        error: 'problem with the server'
                    })
                })
            }else {
                console.error({
                    status: 0,
                    message: 'existing item recipe',
                    error: err
                });
                res.status(400).json({
                    status: 0,
                    message: 'existing item recipe',
                    error: 'item already been associated with a recipe'
                })
            }
        })
       
    }else{
        Recipe.findOne({ _id: recipe_detail._id, item_id: recipe_detail.item_id}, (err, existingRecipe) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding recipe',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error updating recipe',
                    error: 'problem with the server'
                })
            }else if(!existingRecipe) {
                console.error({
                    status: 0,
                    message: 'no recipe found',
                    error: 'no recipe found for the particular id'
                });
                res.status(400).json({
                    status: 0,
                    message: 'no recipe found',
                    error: 'invalid parameters'
                })
            }else{
                existingRecipe.set(recipe_detail);
                existingRecipe.save().then((result) => {
                    res.status(201).json({
                        status: 1,
                        message: 'recipe added successfully',
                    })
                }).catch((err) => {
                    console.error({
                        status: 0,
                        message: 'error updating recipe',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'error updating recipe',
                        error: 'problem with the server'
                    })
                })
            }
        })
    }
}

exports.removeItemRecipe = (req, res) => {
    res.send({ message: 'hey buddy from removeItemRecipe'})
}

/**
 * Dummy Update
 */
// exports.testFunction = async (req, res) => {
//     let itemsList = await MenuItems.find({}, {'_id': 1, branch_id: 1, category_id: 1, name: 1, selling_price: 1, company_id: 1}, (err, result) => {
//         if(err) {
//             console.error({
//                 status: 0,
//                 message: 'error occured',
//                 error: 'problem on adding new recipes'
//             })
//         }else{
//             return result
//         }
//     });

//     await itemsList.forEach((item) => {
//         let new_receipe = new Recipe({
//             "branch_id": item.branch_id,
//             "item_id": item._id,
//             "category_id": item.category_id,
//             "item_name": item.name,
//             "selling_price": item.selling_price,
//             "ingredients": [],
//             "company_id": item.company_id,
//         })
//         new_receipe.save();
//     })

//     res.send(itemsList)
// }