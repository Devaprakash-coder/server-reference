'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const platform_data = new Schema({
    name: String,
    url: String,
    platform_store_id: Number
})
const delivery_brand = new Schema({
name: {
    "type": "Mixed"
  },
city:{
    "type": "Mixed"
  },
address:{
    "type": "Mixed"
  },
zip_codes:{
    "type": "Mixed"
  },
geo_longitude : {
    "type": "Mixed"
  },
geo_latitude : {
    "type": "Mixed"
  },
min_pickup_time:{
    "type": "Mixed"
  },
min_order_value:{
    "type": "Mixed"
  },
min_delivery_time:{
    "type": "Mixed"
  },
contact_phone:{
    "type": "Mixed"
  },
notification_phones:{
    "type": "Mixed"
  },
notification_emails:{
    "type": "Mixed"
  },
ordering_enabled:Boolean,
included_platforms:{
    "type": "Mixed"
  },
platform_data:[{type:platform_data}],
branch_id:{
    type: String
},
company_id:{
  type: String
},
urban_id :{
    type: String
},
brand_status:{
  type: String,default:"active"
}
})
module.exports = mongoose.model('delivery_brand', delivery_brand);