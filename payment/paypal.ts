const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AYu3jgfZoqQc4LwUeAzar6DQ4n3Pxq2GST6Gh0WiU8kvLh9rGIUQuNGCqTpJ1VRYDEZ5QG9CJuBa3mhS',
    'client_secret': 'EBgCU3T9nIuYcvd1gbXmtSL4Lrtor0za_asv5h_PqkTl2cBZqtLZURX8bloySHLhyhri7o9nvSeCu1hb'
  });