const express = require('express');

const app = express();
const server = require('http').Server(app);
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

const socketio = require('./app/socket');

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/../quiz-client/dist/quiz-client')));

// This will allow Angular to handle the routing
app.get('/*', (req, res) => {
    res.sendFile(path.resolve('../quiz-client/dist/quiz-client/index.html'));
});

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

mongodb.MongoClient.connect(
    process.env.MONGODB_URI,
    function (err, database) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        // Save database object from the callback for reuse.
        // mongo version ^3.0 will return a client object containing the database object
        db = database.db('quiz-app');
        console.log('Database connection ready');

        // Initialize the app.
        const port = process.env.PORT || 2112;
        server.listen(port, () => {
            console.log(`Quiz app listening on port ${port}`);
        });

        // start socket server
        socketio.initSocketServer(server);
    }
);