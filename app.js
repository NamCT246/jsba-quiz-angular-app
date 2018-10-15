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

io.on('connection', socket => {
    console.log(socket.id + ` has joined`);

    socket.on('disconnect', function () {
        console.log(socket.id + ` has disconnected`);
    })
});

let port = process.env.PORT || 2112;
server.listen(port, () => {
    console.log('Quiz app listening on port ' + port);
});