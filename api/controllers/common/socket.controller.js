exports.io = io = require('socket.io')();
// var redis = require('socket.io-redis');
// ioadapter.adapter(redis({ host: '151.106.7.74', port: 6379, password:"924c26af011150c0f6ad220d138cf1f21838c0e1a70c65018aa481b1ce625de8" }));
// const { createAdapter } = require("@socket.io/redis-adapter");
// const { createClient } = require("redis");
// const pubClient = createClient({ host: "151.106.7.74", port: 6379,  auth_pass: "924c26af011150c0f6ad220d138cf1f21838c0e1a70c65018aa481b1ce625de8" } );
// const subClient = pubClient.duplicate();
// io.adapter(createAdapter(pubClient, subClient));
// const { createAdapter } = require("socket.io/redis-adapter");
// const { createClient } = require("redis");
/**
 * Socket Scenarios as for the last update Socket Count(7)
 * 1, branch login
 * 2, branch logout
 * 
 * 3, table join
 * 4, table leave
 * 
 * 3, takeaway join
 * 4, takeaway close
 * 
 * 5, valet join
 * 6, valet close
 * 
 * 7, common table updates
 *    | -- new order on table
 *    | -- order status updates
 *    | -- order payment updates
 *    | -- order discount updates
 *    | -- delete ordere updates
 */

var Socket = {
	emit: function (event, data) {
		io.sockets.emit(event, data)
	}
}

var cookie = require('cookie');
disConnectedSockets = []
//var io = ioadapter.of('/');
io.on('error', function(err) {
	console.log('Redis error: ' + err);
});
// io.set( 'origins','*:*' );
io.on('connection', async function (socket) {

	/**
	 * The Below Funciton will check the socket
	 * If the socket is already in the connection, It Updates, else it save it as new one
	 */
	await processSocket(socket);

	socket.on('disconnecting', (reason) => {
		let rooms = Object.keys(socket.rooms);
		console.log('socket disconnected', reason, rooms);
	});

	/*************************** Sockets *************************/

	/************** Branch Based Sockets ***************************/
	socket.on('logged_in_branch', branchId => {
		console.log('logged_in_branch .....', branchId)
		joinBranch(branchId);
	
	});

	socket.on('logged_out_branch', branchId => {
		console.log('logged_out_branch .....', branchId)
		leaveBranch(branchId);
		// socket.emit('remove_cookie', socket.id)
	});

	const joinBranch = branchId => {
		console.log('socket.rooms before joining branch .....', socket.rooms)
		socket.room = branchId;
		socket.join(branchId);
		socket.rooms[branchId] = branchId;
		console.log('socket.rooms after joining branch ....', socket.rooms)
	
	  
		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
		// socket.emit('branch_login', 'Connected To Branch Socket');
	};

	const leaveBranch = branchId => {
		console.log('socket.rooms before leaving branch .....', socket.rooms)
		socket.leave(branchId);
		delete socket.rooms[branchId];
		console.log('socket.rooms after leaving branch .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
		// socket.broadcast.to(branchId).emit('branch_logout', 'One session get closed');
	};

	/******************************** Customer Bases Sockets (Mobile Users) ***************************/

	/********************************* Table Users ******************************/

	socket.on('table_engaged', tableId => {
		console.log('engaging table ....', tableId)
		joinTable(tableId);
	});

	socket.on('leave_table', tableId => {
		console.log('leaving table .....', tableId)
		leaveTable(tableId)
		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });

	});

	const joinTable = tableId => {
		console.log('socket.rooms before joining table .....', socket.rooms)
		socket.room = tableId;
		socket.join(tableId);
		socket.rooms[tableId] = tableId;
		console.log('socket.rooms after joining table .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
		// socket.broadcast.to(tableId).emit('table_engage', 'Another device found');
	};

	const leaveTable = tableId => {
		console.log('socket rooms before leaving table .....', socket.rooms)
		socket.leave(tableId);
		delete socket.rooms[tableId]
		console.log('socket rooms after leaving table .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
	};

	/********************************* Takeaway Users ******************************/
	socket.on('take_away', orderId => {
		console.log('joining takeaway .....', orderId)
		joinOrder(orderId);
	});

	socket.on('close_take_away', orderId => {
		console.log('closing takeaway .....', orderId)
		closeOrder(orderId);
	});

	const joinOrder = orderId => {
		console.log('socket.rooms befire joining takeaway .....', socket.rooms)
		socket.room = orderId;
		socket.join(orderId);
		socket.rooms[orderId] = orderId;
		console.log('socket.rooms after joining takeaway .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
		// socket.broadcast.to(orderId).emit('take_initiated', 'Another device found');
	};

	const closeOrder = orderId => {
		console.log('socket.rooms bofore closing takeaway .....', socket.rooms)
		socket.leave(orderId);
		delete socket.rooms[orderId];
		console.log('socket.rooms after closing takeaway .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
		// socket.broadcast.to(orderId).emit('take_initiated', 'Another device found');
	};

	/********************************* Valet Users ******************************/
	socket.on('join_valet', valetData => {
		let vehicleData = valetData.vehicle_details;
		console.log('joining valet .....', vehicleData)
		joinValet(vehicleData);
	});

	socket.on('leave_valet', serialNumber => {
		console.log('leaving valet .....', serialNumber)
		leaveValet(serialNumber);
		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
	});

	const joinValet = vehicleData => {
		let serialNumber = vehicleData.serial_number;
		console.log('socket room before joining valet .....', socket.rooms)
		socket.room = serialNumber;
		socket.join(serialNumber);
		socket.rooms[serialNumber] = serialNumber;
		console.log('socket room after joining valet .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
		socket.broadcast.to(serialNumber).emit('update_valet', 'socket joined with valet');
	};

	const leaveValet = serialNumber => {
		console.log('rooms before leaving valet .....', socket.rooms)
		socket.leave(serialNumber);
		delete socket.rooms[serialNumber];
		console.log('rooms after leaving valet .....', socket.rooms)

		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: socket.rooms });
	};


	/************************************ Common Sockets for Branch and Customers ***************************/
	socket.on('table_updated', tableData => {
		console.log('updating table .....', tableData)
		updateTables(tableData)
	});

	const updateTables = tableData => {
		socket.broadcast.to(tableData.branch_id).emit('update_table', tableData);
	};


	/**
	 * Not in Use
	 */
	socket.on('bill_updated', (data) => {
		// data.message = "Bill Confirmed";
		// data.status = "bill_partially_confirmed";
		// data.socket_data = 'bill_confirmed';
		console.log('updating bill .....', data)
		socket.broadcast.to(data.branch_id).emit("update_table", data);
		socket.broadcast.to(data.branch_id).emit("update_order", data);
	});

});

/**
 * Process Sockets
 * @param {*} socket 
 */
async function processSocket(socket) {
	if (socket.request.headers.cookie) {
		console.log('request contains cookies');

		let parsedCookie = cookie.parse(socket.request.headers.cookie);
		console.log('cookie data .....', parsedCookie)
		if (parsedCookie.socket_rooms) {
			console.log('socket contains existing rooms');
			let existingRooms = JSON.parse(parsedCookie.socket_rooms);
			delete existingRooms[parsedCookie.io];     // delete old io

			await Object.values(existingRooms).forEach((e) => {
				// Note: socket ids of length 20 is used to vary and filter them
				if (e && (e.length != 20)) {
					// join socket rooms
					socket.room = e;
					socket.join(e)
				} else {
					// Socket ID -> Remove every IDs
					delete existingRooms[e];
				}
			})

			// Create and join current IO room
			socket.room = socket.id;
			socket.join(socket.id)
			existingRooms[socket.id] = socket.id;

			console.log('new socket rooms', existingRooms)
			socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: existingRooms });

		} else {
			console.log('no socket rooms available');
			socket.room = socket.id;
			socket.join(socket.id);
			let existingRooms = {};

			// Create and join current IO room
			existingRooms[socket.id] = socket.id;  

			console.log('new socket rooms', existingRooms)
			socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: existingRooms });
		}

	} else {

		console.log('no cookies found'); // this might lead to problem in notifying users
		let existingRooms = {};

		// Create and join current IO room
		socket.room = socket.id;
		socket.join(socket.id);

		existingRooms[socket.id] = socket.id;
		console.log('existingRooms --------------', existingRooms)
		socket.emit('update_cookie', { socket_id: socket.id, socket_rooms: existingRooms });
	}
}