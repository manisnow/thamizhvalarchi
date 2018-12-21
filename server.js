const express = require('express');
const upload = require('./upload');
const cors = require('cors');


var UserController = require('./user/UserController');


const server = express();

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
};

server.use('/users', UserController);
server.use(cors(corsOptions));

server.post('/upload', upload);

server.listen(8000, () => {
    console.log('Server started!');
});
