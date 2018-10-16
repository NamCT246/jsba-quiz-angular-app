let express = require('express');

let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let path = require('path');
let cors = require('cors');
let _ = require('lodash');

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

/* =====  Handlers for socket connetion ===== */

let rooms = [],
    num_client = 0;

io.on('connection', socket => {
    var currRoom;
    num_client++;

    console.log(`${socket.id} has joined`);

    function createRoom(newRoom) {
        socket.join(newRoom);
        updateRoom('create', newRoom);
    }

    function joinRoom(room) {
        socket.join(room);
        updateRoom('join', room);
    }

    function leaveRoom(oldRoom) {
        var leaver = {
                id: socket.id,
                username: socket.id,
            },
            room = getRoomByName(oldRoom);

        if (room) {
            socket.leave(oldRoom);
            socket.to(oldRoom).emit('leaveRoom', leaver);

            var userIndex = room.userId.indexOf(socket.id);

            if (userIndex >= 0) room.userId.splice(userIndex, 1);

            if (room.num_user > 0) {
                --room.num_user;
            }

            if (room.num_user === 0) {
                var i = _.indexOf(rooms, room);
                rooms.splice(i, 1);
            }
        } else {
            return;
        }
    }

    function updateRoom(method, room) {
        if (method === 'create') {
            var createdRoom = {
                name: room,
                num_user: 1,
                userId: [],
            };
            createdRoom.userId[0] = socket.id;
            rooms.push(createdRoom);
        }

        if (method === 'join') {
            var room_to_update = getRoomByName(room);
            room_to_update.num_user++;
            room_to_update.userId.push(socket.id);

            socket.in(room).emit('userJoin', {
                user: socket.id,
            });
        }

        currRoom = room;
        socket.emit('successJoin', room);
    }

    function getRoomByName(roomName) {
        var room = _.find(rooms, {
            name: roomName
        });
        if (!room) return;

        return room;
    }

    function getRoomBySocketId(id) {
        return _.filter(rooms, function (room) {
            return room.userId.indexOf(id) === 0;
        });
    }

    function getRoomUserNums(room) {
        var room = getRoomByName(room);
        if (!room) return;

        return {
            length: room.userId.length,
            index: rooms.indexOf(room),
        };
    }

    socket.on('createRoom', function (room, ack) {
        if (currRoom && room !== currRoom) {
            leaveRoom(currRoom);
        }

        if (getRoomByName(room)) {
            ack({
                type: 'Abort',
                reason: 'Room already exist. Try creating a new one',
            });
            return;
        }

        createRoom(room);
        ack({
            type: 'Ok',
            room: room,
        });
        console.log("created room number " + room);
    });

    socket.on('joinRoom', function (room, ack) {
        if (!getRoomByName(room)) {
            ack({
                type: 'Abort',
                reason: 'Room not exist. Better create a new one',
            });
            return;
        }

        if (currRoom) {
            if (room === currRoom) {
                ack({
                    type: 'Abort',
                    reason: 'You are already in this room',
                });
                return;
            } else {
                leaveRoom(currRoom);
            }
        }

        joinRoom(room);
        ack({
            type: 'Ok',
            room: room,
        });
    });

    socket.on('leaveRoom', function (room, ack) {
        leaveRoom(room);
        ack({
            type: 'Ok',
            room: room,
        });
    });

    socket.on('disconnect', function () {
        console.log(`${socket.id} has disconnected`);

        leaveRoom(currRoom);
        --num_client;
        currRoom = undefined;

        // clear all room if no user present
        if (num_client === 0) {
            rooms = [];
        }
    });
});

let port = process.env.PORT || 2112;
server.listen(port, () => {
    console.log(`Quiz app listening on port ${port}`);
});