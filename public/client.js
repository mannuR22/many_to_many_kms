// import kurento from "kurento-client";

const select = (id) => {return document.getElementById(id)};

let divRoomSelection = select('roomSelection');
let divMeetingRoom = select('meetingRoom');
let inputRoom = select('room');
let inputName = select('name');
let btnRegister = select('register');

// variables

let roomName, userName, participants = {};

let socket = io();

btnRegister.onclick = () => {
    roomName = inputRoom.value;
    userName = inputName.value;
    console.log('inside btn')
    if(roomName === '' || userName === ''){
        alert('Room and Name are required')
    }else {
        let message = {
            event: 'joinRoom',
            userName: userName,
            roomName: roomName
        }

        sendMessage(message);

        divRoomSelection.style = "display: none";
        divMeetingRoom.style = "display: block";
    }
}

socket.on('message', message => {
    console.log('Message arrived', message.event);

    switch(message.event){
        case 'newParticipantArrived':
            receiveVideo(message.userid, message.username);
            break;
        case 'existingParticipants': 
            console.log("ExistingUsers: ", message.existingUsers);
            onExistingParticipants(message.userid, message.existingUsers)
            break;
        case 'receiveVideoAnswer':
            onReceiveVideoAnswer(message.senderid, message.sdpAnswer);
            break;
        case 'candidate':
            addIceCandidate(message.userid, message.candidate);
            break;

    }
})

function sendMessage(message){
    socket.emit('message', message);
}

function sendMessage(message) {
    socket.emit('message', message);
}

function receiveVideo(userid, username){
    let video = document.createElement('video');
    let div = document.createElement('div');
    div.className = 'videoContainer';
    let name = document.createElement('div');
    video.id = userid;
    video.autoplay = true;
    name.appendChild(document.createTextNode(username));
    div.appendChild(video);
    div.appendChild(name);
    divMeetingRoom.appendChild(div);

    let user = {
        id: userid,
        username: username,
        video: video,
        rtcPeer: null
    };

    participants[user.id] = user;

    let options = {
        remoteVideo: video,
        onicecandidate: onIceCandidate
    }

    user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, err => {
        if(err){
            console.error("while creating rtc Peer",err)
        }

        user.rtcPeer.generateOffer(onOffer);

    })

    function onOffer(err, offer, wp){
        let message = {
            event: 'receiveVideoFrom',
            userid: user.id,
            roomName: roomName,
            sdpOffer: offer
        };

        sendMessage(message);
    }

    function onIceCandidate(candidate, wp){
        console.log('112');
        let message = {
            event: 'candidate',
            userid: user.id,
            roomName: roomName,
            candidate: candidate
        }

        sendMessage(message);
    }
}


function onExistingParticipants(userid, existingUsers){
    let video = document.createElement('video');
    let div = document.createElement('div');
    div.className = 'videoContainer';
    let name = document.createElement('div');
    video.id = userid;
    video.autoplay = true;
    name.appendChild(document.createTextNode(userName));
    div.appendChild(video);
    div.appendChild(name);
    divMeetingRoom.appendChild(div);

    let user = {
        id: userid,
        username: userName,
        video: video,
        rtcPeer: null
    };

    participants[user.id] = user;

    let constraints = {
        audio: true,
        video: {
            mandatory: {
                maxWidth: 320,
                maxFrameRate: 15, 
                minFrameRate: 15
            }
        }
    }
    let options = {
        localVideo: video,
        onicecandidate: onIceCandidate,
        mediaConstraints: constraints,

    }

    user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, err => {
        if(err){
            console.error(err)
            return
        }

        user.rtcPeer.generateOffer(onOffer);

    })

    existingUsers.forEach(element => {
        receiveVideo(element.id, element.name)
    })
    function onOffer(err, offer, wp){

        if(err) console.log("onOffer", err);
        let message = {
            event: 'receiveVideoFrom',
            userid: user.id,
            roomName: roomName,
            sdpOffer: offer
        };

        sendMessage(message);
    }

    function onIceCandidate(candidate, wp){
        console.log('187', roomName)
        let message = {
            event: 'candidate',
            userid: user.id,
            roomName: roomName,
            candidate: candidate
        }

        sendMessage(message);
    }
}


function onReceiveVideoAnswer(senderid, sdpAnswer) {
    console.log("senderid: ", senderid)
    console.log('sdpAnswer', sdpAnswer)
    participants[senderid].rtcPeer.processAnswer(sdpAnswer);
}


function addIceCandidate(userid, candidate) {
    participants[userid].rtcPeer.addIceCandidate(candidate);
}