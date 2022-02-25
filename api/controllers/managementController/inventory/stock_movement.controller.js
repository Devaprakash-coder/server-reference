const StockMovements = require('../../../models/managementModels/inventory/stock_movements.model');
const MaterialStocks = require('../../../models/managementModels/inventory/material_stocks.model');

exports.getStockMovements = (req, res) => {
    let material_category_id = req.params.categoryId;
    StockMovements.find({ material_category_id: material_category_id }, (err, stock_movements) => {
        if(err){
            console.error({ 
                status: 0,
                message: 'error getting stock movements',
                error: err
            });
            res.status(500).json({ 
                status: 0,
                message: 'error getting stock movements',
                error: 'problem with the server'
            });
        }else{
            res.status(200).json({ 
                status: 1,
                message: 'stock movements obtained successfully',
                data: stock_movements
            });
        }
    })
}

exports.getMovementsOfBranch = (req, res) => {
    let branch_id = req.params.branchId;
    let limited_to = req.params.limitedTo ? Number(req.params.limitedTo) : 10;
    StockMovements.find({ branch_id: branch_id }).limit(limited_to).exec((err, stock_movements) => {
        if(err){
            console.error({ 
                status: 0,
                message: 'error getting stock movements',
                error: err
            });
            res.status(500).json({ 
                status: 0,
                message: 'error getting stock movements',
                error: 'problem with the server'
            });
        }else{
            res.status(200).json({ 
                status: 1,
                message: 'stock movements obtained successfully',
                data: stock_movements
            });
        }
    })
}

/**
 * @notes used for both add and update an stock movements
 */
exports.updateStockMovements = (req, res) => {
    let stock_details = req.body.stock_details;
    stock_details['company_id'] = req.companyId;
    let new_stock_movement = new StockMovements(stock_details);
    if(stock_details.stocks) {
        MaterialStocks.findOneAndUpdate({ material_id: stock_details.material_id }, { $set: { current_stocks: stock_details.stocks } }, (err, result) => {
            if(err) {
                console.error({ 
                    status: 0,
                    message: 'error updating stock movement',
                    error: err
                });
                res.status(500).json({ 
                    status: 0,
                    message: 'error updating stock movement',
                    error: 'problem with the server'
                })
            }else{
                new_stock_movement.save().then((result) => {
                    res.status(201).json({ 
                        status: 1,
                        message: 'stock movement saved successfully',
                        data: result
                    })
                }).catch((err) => {
                    console.error({ 
                        status: 0,
                        message: 'error updating stock movement',
                        error: err
                    });
                    res.status(500).json({ 
                        status: 0,
                        message: 'error updating stock movement',
                        error: 'problem with the server'
                    })
                })
            }
        })
    }else{
        new_stock_movement.save().then((result) => {
            res.status(201).json({ 
                status: 1,
                message: 'stock movement saved successfully',
                data: result
            })
        }).catch((err) => {
            console.error({ 
                status: 0,
                message: 'error updating stock movement',
                error: err
            });
            res.status(500).json({ 
                status: 0,
                message: 'error updating stock movement',
                error: 'problem with the server'
            })
        })
    }
}

exports.removeStockMovements = (req, res) => {
    res.send({ message: 'hey buddy from removeStockMovements'})
}