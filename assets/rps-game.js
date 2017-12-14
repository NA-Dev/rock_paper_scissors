//--- JavaScript for a RkPprSsrs game---//

var currentUser = {};
var snapshot = {};
var maxCount = 2;
var database, gameRef, playersRef, chatRef, usersRef, userRef;

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
        gameRef = database.ref("/game");
        chatRef = database.ref("/chat");

        gameRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.game = snap;
                console.log("game changed");

                if (currentUser.joined) {
                    game.checkReady();
                }
            }
        });

        usersRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.users = snap;
                game.updateQueueHTML();

                var x = snap.val().length;
                var status = snapshot.game.val().status;
                if ((x < maxCount) && (status = "")) {
                    gameRef.child("status").set("stopped");
                }
            }
        });

        playersRef.on("value", function(snap) {
            if (snap.val()) {
                snapshot.players = snap;
                game.updatePlayerHTML();

                var x = snap.val().length;
                var status = snapshot.game.val().status;
                console.log("dropPlayer", (x < maxCount), status);
                if ((x < maxCount) && (status = "started")) {
                    gameRef.child("status").set("stopped");
                }
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

            $("#name").val("");
            $("#banner").text("Getting Game Ready");
            $(".player, .chat, .queue").removeClass("hide");

            game.checkReady();
        });

        // $("#send").on("click", function sendChat(event) {
        //     event.preventDefault();
        //     var text = $("#message").val().trim();
        //     var chatRef = firebase.database().ref('chat/' + (countChat + 1));
        //     chatRef.set({
        //         username: name,
        //         message: text,
        //     });
        // });
    },

    updatePlayerHTML: function() {
        var i = 0;
        snapshot.players.forEach(function(childSnap) {
            $(`#p${i}Name`).text(childSnap.val().username);
            $(`#p${i}Score`).text(childSnap.val().score);
            i++;
        });
    },

    updateQueueHTML: function() {
        var numUsers = snapshot.users.val().length;
        for (i = 0; i <= numUsers; i++) {
            var obj = snapshot.players.val()[i];

            var row = $("<tr>");
            var cell1 = $("<td>");
            var cell2 = $("<td>");
            cell1.text(i-maxCount);
            cell2.text(obj.username);
            row.append(cell1, cell2);
            $("#queue").append(row);
        }
    },

    updateChatHTML: function() {

        $("#chat").empty();

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
    },

    updateGameHTML: function() {
    },

    checkReady: function() {
        console.log("checkReady");

        var a = snapshot.users.numChildren();
        var b = snapshot.game.val().status;
        console.log(a>=maxCount, b);

        if ((a >= maxCount) && (!(b === "started"))) {
            console.log("adding self to game");
                       var key = childSnap.key
               currentUser.inGame = true;

            var copyRef = playersRef.child(key);
            copyRef.onDisconnect().remove();
            copyRef.set(currentUser);
            userRef.set(currentUser);
        }
    },

    enterArena: function() {
        console.log("entering game");
        $("#banner").text("Restarting Game");
        gameRef.child("status").set("started");



    }
}

$(document).ready(function() {
    fireBase.initialize();
});



// function startGame() {
// }

// function attack() {

// }

// function checkWin() {

// }

// function leaveGame() {

// }


