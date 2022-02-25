'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const eorderSchema = new Schema({
  "customer": {
    "address": {
      "city": {
        "type": "String"
      },
      "is_guest_mode": {
        "type": "Boolean"
      },
      "line_1": {
        "type": "String"
      },
      "line_2": {
        "type": "Mixed"
      },
      "landmark": {
        "type": "String"
      },
      "latitude": {
        "type": "Number"
      },
      "longitude": {
        "type": "Number"
      },
      "sub_locality": {
        "type": "String"
      },
      "pin": {
        "type": "Number"
      },
      "tag": {
        "type": "String"
      }
    },
    "email": {
      "type": "String"
    },
    "name": {
      "type": "String"
    },
    "phone": {
      "type": "String"
    }
  },
  "order": {
    "details": {
      "biz_id": {
        "type": "Number"
      },
      "biz_name": {
        "type": "String"
      },
      "channel": {
        "type": "String"
      },
      "charges": {
        "type": [
          "Mixed"
        ]
      },
      "coupon": {
        "type": "String"
      },
      "created": {
        "type": "Number"
      },
      "dash_config": {
        "auto_assign": {
          "type": "Boolean"
        },
        "enabled": {
          "type": "Boolean"
        }
      },
      "delivery_datetime": {
        "type": "Number"
      },
      "discount": {
        "type": "Number"
      },
      "total_external_discount": {
        "type": "Number"
      },
      "ext_platforms": {
        "type": [
          "Mixed"
        ]
      },
      "id": {
        "type": "Number"
      },
      "instructions": {
        "type": "String"
      },
      "item_level_total_charges": {
        "type": "Number"
      },
      "item_level_total_taxes": {
        "type": "Number"
      },
      "item_taxes": {
        "type": "Number"
      },
      "merchant_ref_id": {
        "type": "String"
      },
      "modified_from": {
        "type": "Mixed"
      },
      "modified_to": {
        "type": "Mixed"
      },
      "order_level_total_charges": {
        "type": "Number"
      },
      "order_level_total_taxes": {
        "type": "Number"
      },
      "order_state": {
        "type": "String"
      },
      "order_subtotal": {
        "type": "Number"
      },
      "order_total": {
        "type": "Number"
      },
      "payable_amount": {
        "type": "Number"
      },
      "time_slot_end": {
        "type": "String"
      },
      "time_slot_start": {
        "type": "String"
      },
      "order_type": {
        "type": "String"
      },
      "state": {
        "type": "String"
      },
      "taxes": {
        "type": [
          "Mixed"
        ]
      },
      "total_charges": {
        "type": "Number"
      },
      "total_taxes": {
        "type": "Number"
      }
    },
    "items": {
      "type": [
        "Mixed"
      ]
    },
    "next_state": {
      "type": "String"
    },
    "next_states": {
      "type": [
        "String"
      ]
    },
    "payment": {
      "type": [
        "Mixed"
      ]
    },
    "store": {
      "address": {
        "type": "String"
      },
      "id": {
        "type": "Number"
      },
      "latitude": {
        "type": "Number"
      },
      "longitude": {
        "type": "Number"
      },
      "merchant_ref_id": {
        "type": "String"
      },
      "name": {
        "type": "String"
      }
    }
  },
  "order_status": {
    "type": [
      "Mixed"
    ],
    default: null
  },
  "rider_status": {
    "type": [
      "Mixed"
    ],
    default: null
  },
  eorder_time: {
    type: Date,
    default: Date.now
}
});

module.exports = mongoose.model('external_orders', eorderSchema);