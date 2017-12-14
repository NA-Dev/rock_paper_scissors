//--- JavaScript for a RkPprSsrs game---//

var currentUser = {};
var snapshot = {};
var maxCount = 2;
var database, countRef, statusRef, playersRef,
  chatRef, usersRef, userRef, playerRef;

var fireBase = {

    initialize: function() {

        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyCBCDIF-vKHu5ldlVtR2Uj_qTLuCEApL1M",
            authDomain: "rkpprssrs.firebaseapp.com",
            databaseURL: "https://rkpprssrs.firebaseio.com",
            projectId: "rkpprssrs",
            storageBucket: "rkpprssrs.appspot.com",
            messagingSenderId: "433253856407"
        };
        firebase.initializeApp(config);
        database = firebase.database();

        //Sign user in Anonymously
        firebase.auth().onAuthStateChanged(function(credential) {
            if (credential) {
                // User is signed in.
                var uid = credential.uid;
                currentUser.uid = uid;

                userRef = database.ref("/users/" + uid);
                //Creates and stores reference to -> a new /users entry in firebase
                //folder will be removed when user session ends
                userRef.onDisconnect().remove();
                userRef.set("");
            } else {
                // No user is signed in.
                firebase.auth().signInAnonymouslyAndRetrieveData()
                .catch(function(error) {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.error(errorCode, errorMessage);
                });
            }

        });

        fireBase.getSnapshot();
    },

    getSnapshot: function() {

        console.log("getSnapshot");

        usersRef = database.ref("/users");
        playersRef = database.ref("/players");
        countRef = database.ref("/game/count");
        statusRef = database.ref("/game/status");
        chatRef = database.ref("/chat");

        statusRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.status = snap;
            }

            var status = snap.val();
            console.log("game" + status);

            if ((status === "stopped")
             && (currentUser.joined)
             && (!currentUser.inGame)) {
                 game.checkReady();
                console.log("check sent by snapshot");
            } else if (status === "started") {
                // game.startPlaying();
            }
        });

        countRef.on("value", function(snap) {
            if (snap) {
                snapshot.count = snap.val();
            }
        });

        usersRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.users = snap;
                game.updateQueueHTML();

                // var x = snap.val().length;
                // var status = snapshot.status.val();
                // if ((x < maxCount) && (status = "")) {
                //     statusRef.set("stopped");
                //     game.restart();
                // }
            }
        });

        playersRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.players = snap;
                game.updatePlayerHTML();
                var count = snap.numChildren();
            } else {
                var count = 0;
            }
            countRef.set(count);

            var status = snapshot.status.val();
            console.log(count + " players");

            if ((count < maxCount) && (status === "started")) {
                statusRef.set("stopped");
                game.restart();
            } else if (
              (count === maxCount)
              && (status === "stopped")
              && (currentUser.inGame)) {
                statusRef.set("started");
                game.startPlaying();
            }
        });

        chatRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.chat = snap;
                game.updateChatHTML();
            }
        });

        game.initialize();
    },
}

var game = {

    initialize: function() {
        console.log("gameinit");

        $("#join").on("click", function (event) {
            event.preventDefault();
            console.log("joined");

            var time = moment().format("YYYYMMDDhhmmss");
            var name = $("#name").val().trim();
            $("#name").val("");


            currentUser.username = name;
            currentUser.score = 0;
            currentUser.id = time;
            currentUser.joined = true;

            userRef.remove();
            userRef = database.ref(`/users/${time}`);
            //Creates and stores reference to -> a new /users entry in firebase
            //folder will be removed when user session ends
            userRef.onDisconnect().remove();
            userRef.set(currentUser);


            $("#banner").text("Getting Game Ready");
            $(".player, .chat, .message, .queue").removeClass("hide");
            $("#welcome").addClass("hide");

            console.log("check sent by join");
            game.checkReady();
        });

        $("#send").on("click", function sendChat(event) {
            event.preventDefault();
            var text = $("#message").val().trim();
            $("#message").val("");

            if (snapshot.chat) {
                countChat = snapshot.chat.numChildren();
            } else {
                countChat = 0;
            }

            chatRef.child((countChat + 1)).set({
                username: currentUser.username,
                message: text,
            });
        });
    },

    updatePlayerHTML: function() {
        var i = 0;

        $(".playerHTML").empty();
        snapshot.players.forEach(function(childSnap) {
            $(`#p${i}Name`).text(childSnap.val().username);
            $(`#p${i}Score`).text(childSnap.val().score);

            if (childSnap.val().id === currentUser.id) {
                $(`#p${i}`).addClass("currentUser");
            }

            i++;
        });
    },

    updateQueueHTML: function() {
        $("#queue").empty();
        var numUsers = snapshot.users.numChildren();

        var i = 1;
        snapshot.users.forEach(function(childSnap) {
            if (i > maxCount) {
                var row = $("<tr>");
                var cell1 = $("<td>");
                var cell2 = $("<td>");
                cell1.text(i-maxCount + " - ");
                cell2.text(childSnap.val().username);
                row.append(cell1, cell2);
                $("#queue").append(row);
            }
            i++;
        });
    },

    updateChatHTML: function() {

        $("#chat").empty();

        if (snapshot.chat) {
            snapshot.chat.forEach(function(childSnap){
                var message = childSnap.val().message;
                var username = childSnap.val().username;
                var row = $("<tr>");
                var cell = $("<td>");

                cell.text(username + ": " + message);
                row.append(cell);
                $("#chat").append(row);

                var tbody = $("#chat")[0];
                tbody.scrollTop = tbody.scrollHeight;
            });
        }
    },

    updateGameHTML: function() {
    },

    restart: function() {
        chatRef.remove();
        this.updateChatHTML();

        currentUser.score = 0;
        userRef.child("score").set(0);
        playerRef.child("score").set(0);
        this.updatePlayerHTML();
    },

    checkReady: function() {
        console.log("checkReady");

        var status = snapshot.status.val();
        var count = snapshot.count;

        var i = 1;
        snapshot.users.forEach(function(childSnap) {
            console.log("checking "+ i);

            if ((i <= maxCount)
            && (count <= maxCount)
            && (!(status === "started"))) {
                console.log("adding self to game");
                var key = childSnap.key;
                if (key = currentUser.id) {
                    console.log("added");
                    currentUser.inGame = true;
                    playerRef = playersRef.child(key);
                    playerRef.onDisconnect().remove();
                    playerRef.set(currentUser);
                    userRef.set(currentUser);
                }

                return true; //breaks firebase forEach() loop
            }
            i++
        });
    },

    startPlaying: function() {
        $("#banner").text("Click Your Weapon");
        // $(".currentUser > .option").text("Rock");
        $(".currentUser > .option").on("click", function() {

        });
    },

    newRound: function() {

    },

    checkWin: function() {

    },
}

$(document).ready(function() {
    fireBase.initialize();
});


