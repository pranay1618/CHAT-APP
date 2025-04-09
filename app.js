require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect('mongodb://Localhost:27017/CHAT-APP');

const app = require('express')();

const http = require('http').Server(app);

const UserRoute = require('./routes/userRoute');

const User = require('./models/userModel');
const Chat = require('./models/chatModel');
const { Socket } = require('socket.io');

app.use('/', UserRoute);

const io = require('socket.io')(http);

var usp = io.of('/user-namespace');

usp.on('connection', async function(socket) {
    console.log('user connected');

    var userId = socket.handshake.auth.token;

    await User.findByIdAndUpdate({_id: userId},{$set: {is_online: '1'}});

    //broadcast to all users
    socket.broadcast.emit('getOnlineUser',{user_id: userId});

    socket.on('disconnect',async function() {

        console.log('user disconnected');

        var userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({_id: userId},{$set: {is_online: '0'}});

        //broadcast to all users
        socket.broadcast.emit('getOfflineUser',{user_id: userId});
    });

    socket.on('newChat',function(data) {
        socket.broadcast.emit('loadNewChat',data);
    });

    //Load old chats

    socket.on('existsChat',async function(data){
        var chats = await Chat.find({$or: [
            {sender_id: data.sender_id, receiver_id: data.receiver_id},
            {sender_id: data.receiver_id, receiver_id: data.sender_id},

        ]});

        socket.emit('loadChats', {chats : chats});
    });

    //delete chats
    socket.on('chatDeleted',async function(id){
        socket.broadcast.emit('chatMessageDeleted',id);
    });    

    //update chats
    socket.on('ChatUpdated',async function(data){
        socket.broadcast.emit('chatMessageUpdated',data);
    });    
});




// This closing parenthesis was missing

http.listen(3000, function() {
    console.log('server started on port 3000');
});