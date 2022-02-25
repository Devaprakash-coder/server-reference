const MaterialStock = require('../../../models/managementModels/inventory/material_stocks.model');

exports.getMaterialStocks = (req, res) => {
    res.send({ message: 'hey buddy from '})
}

exports.getMaterialStocksOfCategory = (req, res) => {
    if (req.params.categoryId && (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs")) {
        MaterialStock.aggregate([
            { $match: { material_category_id: req.params.categoryId } },
            { $addFields: { "new_material_id": { $toObjectId: "$material_id" }}},
            { 
                $lookup: { 
                    from: 'material_items',
                    localField: 'new_material_id',
                    foreignField: '_id',
                    as: 'material_details'
                }
            },
            { $unwind: '$material_details' },
            { $project:{ 'new_material_id': 0 } }
            ], (err, result) => {
                if(err) {
                    res.status(401).json({
                        status: 0,
                        messsage: 'unauthorized access'
                    });
                }else{
                    res.status(200).json({
                        status: 1
                        , message: 'current stocks obtained successfully',
                        data: result
                    })
                }
            })
    }else if(!req.params.categoryId){
        res.status(400).json({
            status: 0
            , message: 'invalid parameters',
            error: 'category id is required'
        })
    }else{
        res.status(401).json({
            status: 0
            , message: 'unauthorized',
            error: 'invalid permission'
        })
    }
}

/**
 * @notes used for both add and update an material stocks
 */
exports.updateMaterialStocks = async(req, res) => { 
    let data = await new Promise(async(resolve, reject) => {
        await MaterialStock.findOne({ material_id: req.material_id }, async (err, materialStock) => {
            if(err) {
                reject(new Error({ mesage: 'problem with the server' }))
            } else if(!materialStock) {
                let material_stock = new MaterialStock(req);

                material_stock.current_stocks = [];
                material_stock.current_stocks.push(req.stock)
                material_stock.save().then((result) => {
                    resolve(result)
                }).catch((err) => {
                    reject(err)
                })
            } else{
                let selectedIndex;
                let existingMaterialStock = await materialStock.current_stocks.filter((stock, i) => {
                    if(stock.purchase_order_number == req.stock.purchase_order_number) {
                        selectedIndex = i;
                        return stock
                    }});
                if(existingMaterialStock.length) {
                    materialStock.current_stocks[selectedIndex] = req.stock;
                    materialStock.save().then((result) => {
                        resolve(result)
                    }).catch((err) => {
                        reject(err)
                    })
                }else{
                    materialStock.current_stocks.push(req.stock);
                    materialStock.save().then((result) => {
                        resolve(result)
                    }).catch((err) => {
                        reject(err)
                    })
                }
               
            }
        })
    })
    return data;
}

exports.removeMaterialStocks = (req, res) => {
    res.send({ message: 'hey buddy from '})
}