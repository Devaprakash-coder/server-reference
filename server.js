/**
 * DEPENDENCIES
 */
require("dotenv").config();
const express = require("express"),
  app = express(),
  port = process.env.PORT || 5000;
(mongoose = require("mongoose")),
  (cors = require("cors")),
  (jwt = require("jsonwebtoken")),
  (config = require("./config/config.js")),
  (bodyParser = require("body-parser")),
  (path = require("path")),
  (logger = require("morgan")),
  (fs = require("fs")),
  (http = require("http")),
  (https = require("https")),
  (webpush = require("web-push")),
  (gcm = require("node-gcm")),
  (apn = require("apn")),
  //  redisAdapter = require('socket.io-redis'),
  (server_env = "dev");
const pushController = require("./api/controllers/common/push.controller");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({
  host: "192.168.1.16",
  port: 6379,
  auth_pass: "33e45f848cdab4fe8c5a872b9d49f714d89fbcd7508f053ec8fe0fcb56e9524e",
});
const subClient = pubClient.duplicate();

// var redis = require('redis');
// var pub = redis.createClient('6379', '127.0.0.1');
// var sub = redis.createClient('6379', '127.0.0.1');

let environment;
console.log(`Server is up \n Max HTTP header size is ${http.maxHeaderSize}`);

/**
 * NOTE : Set these in env
 */
const vapidKeys = {
  publicKey:
    "BITPhyyWOq0aWQ_v-dAVabgELdJbIY3s48M2d_X7LRj8YNNKdtWL8FJvU4K4s6NiGfa1ldkcTHJsdn14FWhUs28",
  privateKey: "NkXmO72ZRByB8d8DxljjrlNjB4oVpLvVFbKx7CYjrJQ",
};

webpush.setVapidDetails(
  "mailto:rianozal@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * MONGODB
 */
mongoose.Promise = global.Promise;
/**
 * Environment
 */
if (server_env === "dev") {
  environment = config.development.environment;
  mongoose.connect(config.development.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // mongoose.connect(config.development.url)
  //mongoose.connect(config.production.url, { "user": config.production.username, "pass": config.production.password, useNewUrlParser: true,useUnifiedTopology: true });

  // mongoose.connect(config.production.url, { "user": config.production.username, "pass": config.production.password });
} else if (server_env === "test") {
  environment = config.test.environment;
  // mongoose.connect(config.production.url, { "user": config.production.username, "pass": config.production.password });
  mongoose.connect(config.production.url, {
    user: config.production.username,
    pass: config.production.password,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} else if (server_env === "prod") {
  environment = config.production.environment;
  // mongoose.connect(config.production.url, { "user": config.production.username, "pass": config.production.password });
  mongoose.connect(config.production.url, {
    user: config.production.username,
    pass: config.production.password,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

/**
 * MIDDLEWARES
 */

// Token Verifier
function verifyToken(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized User");
  }
  let token = req.headers.authorization.split(" ")[1];
  if (token === "null") {
    return res.status(401).send("unauthorized request");
  }
  let payload = jwt.verify(token, "thisissparta");
  if (!payload) {
    return res.status(401).send("unautorized req");
  }
  if (payload.branchId) {
    req.branchId = payload.branchId;
  }
  if (payload.tableId) {
    req.tableId = payload.tableId;
  }
  if (payload.floorId) {
    req.floorId = payload.floorId;
  }
  if (payload.orderId) {
    req.orderId = payload.orderId;
  }
  req.userId = payload.userId;
  req.userName = payload.userName;
  req.companyId = payload.companyId;
  req.accessType = payload.accessType;
  req.position = payload.position;
  req.deviceToken = payload.deviceToken;
  req.social_unique_id = payload.social_unique_id;
  next();
}

/**
 * APP
 */
app.use(logger("dev"));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(cors());
//middlewares
app.use(bodyParser.json({ limit: "10mb" }));
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true,
    parameterLimit: 50000,
  })
);

/**
 * ROUTES
 */
const managementRoutes = require("./api/routes/management.routes");
const mainRoutes = require("./api/routes/main.routes");
const authRoutes = require("./api/routes/auth.routes");
const omsRoutes = require("./api/routes/oms.routes");
const historyRoutes = require("./api/routes/history.routes");
const detailRotute = require("./api/routes/gen_details.routes");
const customerRoutes = require("./api/routes/Customers/customer.routes");
const analyticsRoutes = require("./api/routes/analytics.routes");
const valetRoutes = require("./api/routes/valet.routes");
const hookRoutes = require("./api/routes/hooks.routes");

app.use("/management", verifyToken, managementRoutes);
app.use("/api", verifyToken, mainRoutes); //setup
app.use("/oms", verifyToken, omsRoutes);
app.use("/valet", verifyToken, valetRoutes);
app.use("/auth", authRoutes); //DONE
app.use("/history", verifyToken, historyRoutes);
app.use("/customer", verifyToken, customerRoutes);
app.use("/analytics", verifyToken, analyticsRoutes);
app.use("/wh", verifyToken, hookRoutes);
/**
 * Special Routes for Users
 */
app.use("/detail", detailRotute);

app.get("/", (req, res, next) => {
  const { networkInterfaces } = require("os");

  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  res.send(results);
  //	res.send("Welcome to POS API. Now try including /api after port number");
});

app.get("/test-notifications", async function (req, res) {
  //  res.send("Welcome to POS API. Now try including /api after port number");
  await pushController
    .notifyZoneMembers(
      "5befbfac2b814422a23360ab",
      "5c04cc15496e1351fe461904",
      "5cbffdec222b5b300c1a20b7",
      { data: "dummy" }
    )
    .then((result) => {
      res.send(result);
    });
});

/** Notification
 * TODO: make it secure
 * */
app.post("/notifications", (req, res) => {
  // const allSubscriptions = [req.body.sub]; // Note: Making it as an array since there will be an array of users in future for newsletter like services
  // let deviceType = req.body.device_type;
  let deviceType = req.body.application_type;

  // /**
  //  * New Code
  //  */
  // let userToken = req.body;
  // if(userToken.application_type === 'mobile') {
  // 	if(userToken.device_type === 'android') {
  // 		notifyAndroid(userToken)
  // 	}else if(userToken.device_type === 'ios') {
  // 		notifyIos(userToken)
  // 	}
  // }else if(userToken.application_type === 'web') {
  // 	notifyWeb(userToken);
  // }

  // function notifyAndroid(){
  // 	var serverKey = 'AAAAMrOp6NM:APA91bFBty-nACor-D9V7Fe19eMWlayuluM0TFFwPzFFHN6RuAa2MikjtU5os43SegRqOo0IcL_JmhL6Ah_rkIB_ZF0mbeEGIecn4t2xw4z-mCvlrRDkjBCY0u5-iY-VrQywxdql4PvY'; //put your server key here
  // 		// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
  // 		var sender = new gcm.Sender(serverKey);

  // 		// ... or some given values
  // 		var message = new gcm.Message({
  // 			collapseKey: 'demo',
  // 			priority: 'high',
  // 			contentAvailable: true,
  // 			delayWhileIdle: true,
  // 			timeToLive: 3,
  // 			restrictedPackageName: "somePackageName",
  // 			dryRun: true,
  // 			data: {
  // 				key1: 'message1',
  // 				key2: 'message2'
  // 			},
  // 			notification: {
  // 				title: "Hello, World",
  // 				icon: "ic_launcher",
  // 				body: "This is a notification that will be displayed if your app is in the background."
  // 			}
  // 		});

  // 		// var regTokens = ['c32vUTyymzo:APA91bHGyag9sRIx4WK3xfmC8az6dc6gK5GhdFCheLCngjbT8L-qmsB5EGFYFSZKT8PmqUkDpPLn6mSjQMHYaKg1O0E8YcVpyp5DVWB2Mq2hJ4AvB8NzIhEl4SnjUSj39S3cq15pJWeP'];
  // 		var regTokens = [userToken.endpoint];

  // 		// Actually send the message
  // 		return new Promise((resolve, reject) => {
  // 			sender.send(message, { registrationTokens: regTokens }, function (err, response) {
  // 				if (err) {
  // 					console.error('error ------------>', err);
  // 					reject(err);
  // 				}else {
  // 					resolve(response)
  // 				}
  // 			});
  // 		})
  // }

  // function notifyWeb(userToken) {
  // 	const notificationPayload = {
  // 		notification: {
  // 			title: "Dinamic POS",
  // 			body: {
  // 				data: "Hello"
  // 			},
  // 			icon: "assets/icons/icon-144x144.png",
  // 			vibrate: [100, 50, 100],
  // 			type: "update",
  // 			data: {
  // 				dateOfArrival: Date.now(),
  // 				primaryKey: 1,
  // 				content: "engage_table"
  // 			},
  // 			actions: [
  // 				{ action: "explore", title: "Go to the site" }
  // 			]
  // 		}
  // 	};

  // 	return new Promise((resolve, reject) => {
  // 		resolve(webpush.sendNotification(userToken, JSON.stringify(notificationPayload)))
  // 	})

  // 	// Promise.all(
  // 	//     webpush.sendNotification(
  // 	//         userToken,
  // 	//         JSON.stringify(notificationPayload)
  // 	//     )).then(() => {
  // 	//         return ({ message: 'success' })
  // 	//     })
  // 	//     .catch(err => {
  // 	//         return ({ message: 'not notified to everyone' })
  // 	//     });
  // }

  // function notifyIos(userToken) {
  // 	var options = {
  // 		token: {
  // 		  key: '../../../config/AuthKey_88BZRJ3TU5.p8',
  // 		  keyId: "88BZRJ3TU5",
  // 		  teamId: "N32T8478LC"
  // 		},
  // 		production: true
  // 	  };

  // 	  var apnProvider = new apn.Provider(options);

  // 	//   let base64Token = "fHbi4u6wHkw:APA91bE4sEbjzKuH7OxA0p5YmsoH7sLQXA9_DHgEU2SJ1scfrRXr4LPGw35Qa6lrVf8SHnrqWURuNqtRqSvPhXEgIm21FBvh8PXkp9dAiQWHO0Wcqt4L_IUTsm_u0zndJdYh9ugu90zr"

  // 	  let deviceToken = userToken.endpoint; // TODO: Convert it to hexa code

  // 	  var note = new apn.Notification();

  // 	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  // 	note.badge = 3;
  // 	// note.sound = "ping.aiff";
  // 	note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
  // 	note.payload = {'messageFrom': 'John Appleseed'};
  // 	note.topic = "com.whitemasterysystems.dinamic";

  // 	return new Promise((resolve, reject) => {
  // 		apnProvider.send(note, deviceToken).then( (result) => {
  // 			// see documentation for an explanation of result
  // 		});
  // 	})
  // }

  // const allSubscriptions = ['dFhgpBewdQM:APA91bHpnrQjEZqjukAEPpmlnraWbNp9Q8FnUYSla_waLefK9ttRaDSx2_U3CxhUn0CaUfX-m6rskZ6476-qjsssVzOcUrKxFR0VpU5ixAzGhsDlOFKpW_Cw-yZA45oomTkK6bItA_6h']; // Note: Making it as an array since there will be an array of users in future for newsletter like services
  if (deviceType === "ios") {
    var options = {
      token: {
        key: "./config/AuthKey_4D8W787ST5.p8",
        keyId: "4D8W787ST5",
        teamId: "NLX3LFN4KF",
      },
      production: true,
    };

    var apnProvider = new apn.Provider(options);

    let base64Token =
      "fHbi4u6wHkw:APA91bE4sEbjzKuH7OxA0p5YmsoH7sLQXA9_DHgEU2SJ1scfrRXr4LPGw35Qa6lrVf8SHnrqWURuNqtRqSvPhXEgIm21FBvh8PXkp9dAiQWHO0Wcqt4L_IUTsm_u0zndJdYh9ugu90zr";

    let deviceToken =
      "dLNNBU-X1qw:APA91bHXeVa91BI5nkQf3_YGnoYFXNTdTC8rITszdkirktJ2bnABlKJ5DXQ7QS1HdkXNKLknp_vbC6847k-RN-jsVFBGWRuMGhLHZOechl7qRC6pOoDVlp_2Ic2zdUDoGJ1LH0QzHx5g";

    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    // note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = { messageFrom: "John Appleseed" };
    note.topic = "com.whitemasterysystems.dinamic";

    apnProvider.send(note, deviceToken).then((result) => {
      // see documentation for an explanation of result
    });
  } else if (deviceType === "mobile") {
    var serverKey =
      "AAAAceW3nQ0:APA91bE6g6jPNqvhLBP9G9hRKrd9_WOhe6KWHuC-nxqZDZdhdFQeu3uZ4rmVoILW0WbWBjyws4iROxuLIRJDP_TBjYI_BD226YLYk4rlo_sA8EiL8vdcs-sAVrNrPLTq6zmuMRXQsGqu"; //put your server key here
    // Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
    var sender = new gcm.Sender(serverKey);

    // ... or some given values
    // var message = new gcm.Message({
    // 	collapseKey: 'demo',
    // 	priority: 'high',
    // 	contentAvailable: true,
    // 	delayWhileIdle: true,
    // 	timeToLive: 3,
    // 	restrictedPackageName: "somePackageName",
    // 	dryRun: true,
    // 	data: {
    // 		key1: 'message1',
    // 		key2: 'message2'
    // 	},
    // 	notification: {
    // 		title: "Hello, World",
    // 		icon: "ic_launcher",
    // 		body: "This is a notification that will be displayed if your app is in the background."
    // 	}
    // });

    var message = new gcm.Message({
      // collapseKey: 'demo',
      // priority: 'high',
      // contentAvailable: true,
      // delayWhileIdle: true,
      // timeToLive: 3,
      // dryRun: true,
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        sound: "default",
        key1: "message1",
        key2: "message2",
      },
      notification: {
        title: "Hello, World",
        icon: "ic_launcher",
        body: "This is a notification that will be displayed if your app is in the background.",
      },
      // DATA='{
      // 	"notification": {
      // 	  "body": "this is a body",
      // 	  "title": "this is a title"
      // 	},
      // 	"data": {
      // 	  "click_action": "FLUTTER_NOTIFICATION_CLICK",
      // 	  "sound": "default",
      // 	  "status": "done",
      // 	  "screen": "screenA",
      // 	},
      // 	"to": "<FCM TOKEN>"
      //   }'
    });

    // var regTokens = ['dLNNBU-X1qw:APA91bHXeVa91BI5nkQf3_YGnoYFXNTdTC8rITszdkirktJ2bnABlKJ5DXQ7QS1HdkXNKLknp_vbC6847k-RN-jsVFBGWRuMGhLHZOechl7qRC6pOoDVlp_2Ic2zdUDoGJ1LH0QzHx5g'];
    var regTokens = [
      "dsmqpndllAw:APA91bEDSSpYeq_j9zPLRMewMNjsqwHfTvEBRiMifDC-CpBKzyyPtsF4WvSaBCTykCbFPyzveuhQg1ivhgZSxnPLGPGZUWhTOqS379RVoObvqRtdqrHtOC_ho1wlA9EPU6yIQf9bnqVR",
    ];

    // Actually send the message
    sender.send(
      message,
      { registrationTokens: regTokens },
      function (err, response) {
        if (err) console.error("error ------------>", err);
        else console.log("response ---------->", response);
      }
    );
  } else if (deviceType === "web") {
    const moduleType = req.body.type;
    let message = "";
    if (moduleType === "my-account") {
      message = "POS Management";
    } else if (moduleType === "table") {
      message = "Table Management";
    }
    // else if (moduleType === 'oms') {
    // 	message = 'Order Management'
    // }

    const notificationPayload = {
      notification: {
        title: "Dinamic POS",
        body: `Welcome to ${message}`,
        icon: "assets/icons/icon-144x144.png",
        badge: "assets/icons/icon-144x144.png",
        vibrate: [100, 50, 100],
        type: req.body.action,
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          content: "table",
        },
        actions: [
          { action: "explore", title: "Go to the site" },
          // can add more options with icons, sample is given below
          // { "action": "yes", "title": "Yes", "icon": "images/yes.png" },
          // { "action": "no", "title": "No", "icon": "images/no.png" }
        ],
      },
    };

    Promise.all(
      allSubscriptions.map((sub) => {
        webpush.sendNotification(sub, JSON.stringify(notificationPayload));
      })
    )
      .then(() => {
        res.status(200).json({
          message: "Notification sent successfully.",
          status: 1,
        });
      })
      .catch((err) => {
        console.error("Error sending notification, reason: ", err);
        res.status(500).send({
          status: 0,
          message: "Error sending notification",
          error: err,
        });
      });
  }
});

/**
 * Error Handlers
 */
/**
 * Used to handle cannot get error on routes
 */
app.use((req, res, next) => {
  res.status(404).send({
    status: 404,
    error: "Oops! The requested API is not found...",
  });
});

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || "Internal Server Error",
    },
  });
});

/**
 * PORT
 */
if (environment === "production") {
  console.log("production env");
  /**
   * Https Server
   */
  // const privateKey = fs.readFileSync('/var/www/clients/client0/web3/ssl/dinamic.io-le.key');
  // const certificate = fs.readFileSync('/var/www/clients/client0/web3/ssl/dinamic.io-le.crt');
  // const credentials = { key: privateKey, cert: certificate };
  // const httpsServer = https.createServer(credentials, app);
  // const external_io = require('./api/controllers/common/socket.controller');
  // let io = external_io.io;
  // io.origins(':') // for latest version
  // io.attach(httpsServer, {
  // 	 serveClient: true,
  // 	 pingInterval: 40000,
  // 	 pingTimeout: 25000,
  // 	 upgradeTimeout: 21000, // default value is 10000ms, try changing it to 20k or more
  // 	 agent: false,
  // 	 cookie: false,
  // 	 rejectUnauthorized: false,
  // 	 reconnectionDelay: 1000,
  // 	 reconnectionDelayMax: 5000
  // });

  // httpsServer.listen(port, (err, success) => {
  // 	if (err) console.log('error creating server', err);
  // 	console.log('server running in production')
  // });

  const httpServer = http.createServer(app);
  const external_io = require("./api/controllers/common/socket.controller");
  let io = external_io.io;
  io.adapter(createAdapter(pubClient, subClient));

  //  io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
  // io.adapter(redisAdapter({
  // 	key: 'adapterKey',
  // 	pubClient: pub,
  // 	subClient: sub
  // }));
  //  io.origins(':') // for latest version

  io.attach(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["content-type"],
    },
    serveClient: true,
    transports: ["websocket", "polling"],
    pingInterval: 40000,
    pingTimeout: 25000,
    upgradeTimeout: 21000, // default value is 10000ms, try changing it to 20k or more
    agent: false,
    cookie: false,
    rejectUnauthorized: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  /**
   * Sockets
   */

  httpServer.listen(port, (err, success) => {
    if (err) console.log("error creating server", err);
    console.log("server running in production");
  });
} else if (environment === "test") {
  console.log("test env");

  /**
   * Http Server
   */
  const httpServer = http.createServer(app);
  const external_io = require("./api/controllers/common/socket.controller");
  let io = external_io.io;
  //  io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
  // io.adapter(redisAdapter({
  // 	key: 'adapterKey',
  // 	pubClient: pub,
  // 	subClient: sub
  // }));
  io.attach(httpServer, {
    serveClient: true,
    //  transports: ["websocket"],
    pingInterval: 40000,
    pingTimeout: 25000,
    upgradeTimeout: 21000, // default value is 10000ms, try changing it to 20k or more
    agent: false,
    rejectUnauthorized: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  /**
   * Sockets
   */

  httpServer.listen(port, (err, success) => {
    if (err) console.log("error creating server", err);
    console.log("server running in developmemt",port);
  });
} else {
  console.log("development env");
  /**
   * Http Server
   */
  const httpServer = http.createServer(app);
  const external_io = require("./api/controllers/common/socket.controller");
  let io = external_io.io;
  //io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
  io.adapter(createAdapter(pubClient, subClient));
  // io.adapter(redisAdapter({
  // 	key: 'adapterKey',
  // 	pubClient: pub,
  // 	subClient: sub
  // }));
  io.attach(httpServer, {
    serveClient: true,
    transports: ["websocket"],
    pingInterval: 40000,
    pingTimeout: 25000,
    upgradeTimeout: 21000, // default value is 10000ms, try changing it to 20k or more
    agent: false,
    rejectUnauthorized: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  /**
   * Sockets
   */

  httpServer.listen(port, (err, success) => {
    if (err) console.log("error creating server", err);
    console.log("server running in developmemt");
  });
}