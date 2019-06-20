/* global $, QiscusMeet */

const options = { 
    hosts: { 
        domain: 'meet.qiscus.com', 
        muc: 'conference.meet.qiscus.com', // FIXME: use XEP-0030 
        focus: 'focus.meet.qiscus.com', 
    }, 
        bosh:'//meet.qiscus.com/http-bind' // FIXME: use xep-0156 for that // The name of client node advertised in XEP-0115 'c' stanza 
};

const confOptions = {
    openBridgeChannel: true
};

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
const remoteTracks = {};

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
            QiscusMeet.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            QiscusMeet.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        localTracks[i].addEventListener(
            QiscusMeet.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        localTracks[i].addEventListener(
            QiscusMeet.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        if (localTracks[i].getType() === 'video') {
            $('#remote-video').append(
                `<video class='small-video' autoplay='1' id='localVideo${i}' />`);
                localTracks[i].attach($(`#localVideo${i}`)[0]);
            document.getElementById("localVideo").srcObject = document.getElementById(`localVideo${i}`).srcObject;
        } else {
            $('#remote-video').append(
                `<audio autoplay='1' autoplay='1' muted='true' id='localAudio${i}' class='largeVideo' />`);
                localTracks[i].attach($(`#localAudio${i}`)[0]);
        }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    }
    const idx = remoteTracks[participant].push(track);

    track.addEventListener(
        QiscusMeet.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        QiscusMeet.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
    track.addEventListener(
        QiscusMeet.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
    track.addEventListener(QiscusMeet.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    const id = participant + track.getType() + idx;

    if (track.getType() === 'video') {
        $('#remote-video').append(
            `<video autoplay='1' id='${participant}video${idx}' />`);
    } else {
        $('#remote-video').append(
            `<audio autoplay='1' id='${participant}audio${idx}' />`);
    }
    track.attach($(`#${id}`)[0]);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference joined!');
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log('user left');
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];
    for (let i = 0; i < tracks.length; i++) {
        if(tracks[i].getType() == "video") {
            // debugger
            document.getElementById(`${id}${tracks[i].getType()}${i+1}`).remove();
        }
        
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    room = connection.initQiscusConference(window.location.pathname.split('/')[2], confOptions);
    room.on(QiscusMeet.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(QiscusMeet.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(
        QiscusMeet.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(QiscusMeet.events.conference.USER_JOINED, id => {
        console.log('user join');
        remoteTracks[id] = [];
    });
    room.on(QiscusMeet.events.conference.USER_LEFT, onUserLeft);
    room.on(QiscusMeet.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        QiscusMeet.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        QiscusMeet.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        QiscusMeet.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        QiscusMeet.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        QiscusMeet.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        QiscusMeet.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

let isVideo = true;
let isAudio = true;

$(document).on("click", ".small-video", function (el, e) {
    var id = el.target.id;
    document.getElementById("localVideo").srcObject = document.getElementById(id).srcObject
});

function hangup() {
    room.leave();
    connection.disconnect();
}

function mutedAudio() {
    isAudio = !isAudio;
    (!isAudio) ? localTracks[0].mute() : localTracks[0].unmute();
}
/**
 *
 */
function mutedVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    (!isVideo) ? localTracks[1].mute() : localTracks[1].unmute();
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    QiscusMeet.mediaDevices.setAudioOutputDevice(selected.value);
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);

// QiscusMeet.setLogLevel(QiscusMeet.logLevels.ERROR);
const initOptions = {
    disableAudioLevels: true,

    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',

    // Whether desktop sharing should be disabled on Chrome.
    desktopSharingChromeDisabled: false,

    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: [ 'screen', 'window' ],

    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',

    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: true
};

QiscusMeet.init(initOptions);

connection = new QiscusMeet.QiscusConnection(null, null, options);

connection.addEventListener(
    QiscusMeet.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    QiscusMeet.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    QiscusMeet.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

QiscusMeet.mediaDevices.addEventListener(
    QiscusMeet.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

QiscusMeet.createLocalTracks({ devices: [ 'audio', 'video' ] })
    .then(onLocalTracks)
    .catch(error => {
        throw error;
    });

if (QiscusMeet.mediaDevices.isDeviceChangeAvailable('output')) {
    QiscusMeet.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
            = devices.filter(d => d.kind === 'audiooutput');

        if (audioOutputDevices.length > 1) {
            $('#audioOutputSelect').html(
                audioOutputDevices
                    .map(
                        d =>
                            `<option value="${d.deviceId}">${d.label}</option>`)
                    .join('\n'));

            $('#audioOutputSelectWrapper').show();
        }
    });
}
