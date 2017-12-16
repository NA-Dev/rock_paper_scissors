//--- JavaScript for a RkPprSsrs game---//

var currentUser = {};
var snapshot = {};
var maxCount = 2; //max number of players allowed in game

var database, gameRef, usersRef, chatRef, playersRef, userRef, playerRef;

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

        this.getSnapshot();
    },

    getSnapshot: function() {

        gameRef = database.ref("/game");
        statusRef = database.ref("/status");
        usersRef = database.ref("/users");
        playersRef = database.ref("/players");
        chatRef = database.ref("/chat");

        gameRef.on("value", function(snap) {
            console.log("game change");

            if (snap.val()) {

                snapshot.game = snap;
            }

            var attackCount = 0;
            if (snap.val().attackCount) {

                attackCount = snap.val().attackCount;
            }

            if (attackCount === maxCount) {
                console.log(attackCount);
                statusRef.set("resolving");
            }
        });

        statusRef.on("value", function(snap) {

            if (snap.val()) {

                snapshot.status = snap;
                var status = snap.val();
            }

            console.log("status: " + status );

            if ((status === "queue")) {

                var next = snapshot.users[1];
                if (next.child(key) === currentUser.uid) {

                    currentUser.inGame = true;
                    playerRef = playersRef.child(key);
                    playerRef.onDisconnect().remove();
                    playerRef.set(currentUser);
                    userRef.remove();
                }

            } else if ((status === "attack") && (currentUser.inGame)) {

                game.attack();

            } else if ((status  === "resolving") && (currentUser.inGame)) {

                game.checkWin();
            }
        });

        playersRef.on("value", function(snap) {

            if (snap.val()) {

                snapshot.players = snap;
                game.updatePlayerHTML(snap);
            }
        });

        playersRef.on("child_added", function(snap) {


            var count = 0;
            if (snapshot.players) {

                count = snapshot.players.numChildren();
            }
            console.log("added player" + count );

            if ((count === maxCount)
            && (currentUser.inGame)) {

                statusRef.set("attack");

            } else if ((count < maxCount)
            && (currentUser.inGame)) {

                $("#banner").text(
                    "Waiting for "
                    + maxCount - count
                    + " Player(s)"
                );
            }
        });

        playersRef.on("child_removed", function(snap) {

            console.log("child removed");

            if (snap.val()) {

                game.reset();
                statusRef.set("queue");
            }
        });

        usersRef.on("value", function(snap) {

            if (snap.val()) {

                game.updateQueueHTML(snap);

                var count = 0;
                if (snapshot.players) {

                    count = snapshot.players.numChildren();
                }
            console.log("added user" + status );

                if ((count < maxCount)
                && (!currentUser.inGame)) {

                    var id = currentUser.id;
                    var oldRef = database.ref(`/users/${id}`);
                    var newRef = database.ref(`/players/${id}`);

                    oldRef.remove();
                    newRef.onDisconnect().remove();
                    newRef.set(currentUser);
                }
            }
        });

        chatRef.on("child_added", function(snap) {

            if (snap.val()) {
                game.updateChatHTML(snap);
            }
        });

        game.initialize();
    },
}

var game = {

    initialize: function() {

        $("#join").on("click", function(event) {

            event.preventDefault();

            var now = moment().format("YYYYMMDDHHmmss");
            var name = $("#name").val().trim();
            $("#name").val("");

            currentUser.username = name;
            currentUser.score = 0;
            currentUser.id = now;

            userRef = database.ref(`/users/${now}`);
            userRef.onDisconnect().remove();
            userRef.set(currentUser);


            $("#banner").text("Getting Game Ready");
            $(".player, .chat, .message, .queue").removeClass("hide");
            $("#welcome").addClass("hide");
        });

        $("#send").on("click", function(event) {
            event.preventDefault();

            var now = moment().format("YYYYMMDDHHmmss");
            var now2 = moment().format("YYYY MMM DD, hh:mm:ss");
            console.log(now);
            var text = $("#message").val().trim();
            $("#message").val("");

            chatRef.child(`${now}`).set({
                username: currentUser.username,
                message: text,
                time: now2
            });
        });
    },

    updatePlayerHTML: function(snap) {

        var i = 0;
        snap.forEach(function(childSnap) {

            $(`#p${i}Name`).text(childSnap.val().username);
            $(`#p${i}Score`).text(childSnap.val().score);

            if (childSnap.val().id === currentUser.id) {
                $(`#p${i}`).addClass("currentUser");
            }

            i++;
        });
    },

    updateQueueHTML: function(snap) {

        $("#queue").empty();

        var numUsers = snap.numChildren();

        var i = 1;
        snap.forEach(function(childSnap) {
            if (i > maxCount) {
                var row = $("<tr>");
                var cell1 = $("<td>");
                var cell2 = $("<td>");
                cell1.text(i - maxCount + " - ");
                cell2.text(childSnap.val().username);
                row.append(cell1, cell2);
                $("#queue").append(row);
            }
            i++;
        });
    },

    updateChatHTML: function(snap) {

        var message = snap.val().message;
        var name = snap.val().username;
        var time = snap.val().time;

        var row = $("<tr>");
        var cell = $("<td>");

        cell.text(time + " --- " + name + ": " + message);

        row.append(cell);
        $("#chat").append(row);

        //keeps last message at bottom, scroll up for chat history
        var tbody = $("#chat")[0];
        tbody.scrollTop = tbody.scrollHeight;
    },

    reset: function() {
            console.log("reset");
        gameRef.child("attackCount").set(0);
        $("#chat").empty();
        chatRef.remove();
//-----send a system chat message------//

        var id = currentUser.id;
        currentUser.score = 0;
        playersRef.ref(`/${id}/score`).set(0);
    },

    //allow user to click rock, paper, or scissors
    attack: function() {
        $("#banner").text("Click Your Weapon");
        // $(".currentUser > .option").text("Rock");
        $(".currentUser > .option").on("click", function() {
            var selection = $(this).data("weapon").trim();
            attackRef.push({
                weapon: selection,
                id: currentUser.id
            });
        });
    },

    checkWin: function() {
    },
}

$(document).ready(function() {
    fireBase.initialize();
});