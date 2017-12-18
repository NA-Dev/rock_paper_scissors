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

        usersRef.on("value", function(snap) {

            var userCount = 0;
            var playerCount = 0;

            if (snapshot.players) {

                playerCount = snapshot.players.numChildren();

            }

            if (snap.val()) {

                snapshot.users = snap;
                game.updateQueueHTML(snap);

                userCount = snap.numChildren();

                //this section handles queueing
                if ((playerCount < maxCount)
                && (currentUser.status === "inQueue")) {

                    console.log("Adding player from queue");

                    currentUser.status = "inGame";

                    var id = currentUser.id;
                    var oldRef = database.ref(`/users/${id}`);
                    var newRef = database.ref(`/players/${id}`);

                    oldRef.remove();
                    newRef.onDisconnect().remove();
                    newRef.set(currentUser);
                }
            }
        });

        statusRef.on("value", function(snap) {

            if (snap.val()) {

                snapshot.status = snap;
                var status = snap.val();

            } else {

                statusRef.set("stopped");
            }

            console.log("status: " + status );

            if ((status === "queue")
            && (snapshot.users)) {

                for (var prop in snapshot.users.val()) {

                    var next = prop;
                    break;
                }

                if (next = currentUser.id) {

                    var key = currentUser.id;
                    currentUser.status = "inGame";
                    playerRef = playersRef.child(key);
                    playerRef.onDisconnect().remove();
                    playerRef.set(currentUser);
                    userRef.remove();
                }

            } else if ((status === "attack")
              && (currentUser.status === "inGame")) {

                game.attack();

            }

            // else if ((status  === "resolving") && (currentUser.status === "inGame")) {

            //     game.resolve();
            // }
        });

        gameRef.on("value", function(snap) {
            console.log("game change");

            if (snap.val()) {

                snapshot.game = snap;
            }

            if (snap.hasChild("attacks")) {
                var attackCount = snap.child("attacks").numChildren();
            } else {
                attackCount = 0;
            }

            var status = snapshot.status.val();


            if ((status === "attack")
            && (attackCount === maxCount)) {

                console.log(attackCount + "attacks");
                statusRef.set("resolving");

                game.resolve(snap.child("attacks"));
            }
        });

        playersRef.on("value", function(snap) {

            var playersCount = 0;

            if (snap.val()) {

                snapshot.players = snap;
                game.updatePlayerHTML(snap);
                playersCount = snap.numChildren();
            }

            console.log("player count: " + playersCount);

            var status = snapshot.status.val();

            if ((status === "queue")
            && (playersCount === maxCount)
            && (currentUser.status === "inGame")) {

                statusRef.set("attack");

            } else if ((playersCount < maxCount)
            && (currentUser.status === "inGame")) {

                $("#banner").text(
                    "Waiting for "
                    + maxCount - playersCount
                    + " Player(s)"
                );
            }
        });

        playersRef.on("child_removed", function(snap) {

            console.log("player removed");

            if (snap.val()) {

                game.reset();
                statusRef.set("queue");
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
            currentUser.wins = 0;
            currentUser.losses = 0;
            currentUser.ties = 0;
            currentUser.id = now;
            currentUser.status = "inQueue";

            userRef = database.ref(`/users/${now}`);
            userRef.onDisconnect().remove();
            userRef.set(currentUser);


            $("#banner").text("Please wait");
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
            $(`#p${i}Wins`).text(childSnap.val().wins);
            $(`#p${i}Losses`).text(childSnap.val().losses);
            $(`#p${i}Ties`).text(childSnap.val().ties);

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
        $("#chat").empty();
        chatRef.remove();
//-----send a system chat message------//

        var id = currentUser.id;
        currentUser.wins = 0;
        currentUser.losses = 0;
        currentUser.ties = 0;

        playersRef.child(`/${id}/wins`).set(0);
        playersRef.child(`/${id}/losses`).set(0);
        playersRef.child(`/${id}/ties`).set(0);

        if (gameRef.child("attacks")) {
            gameRef.child("attacks").remove;
        }
    },

    //allow user to click rock, paper, or scissors
    attack: function() {

        $("#banner").text("Click Your Weapon");

        $(".currentUser > .option").on("click", function() {
            var selection = $(this).data("weapon").trim();
            var id = currentUser.id;

            newAttackRef = gameRef.child(`attacks/${id}`) ;
            newAttackRef.onDisconnect().remove();
            newAttackRef.set({
                weapon: selection
            });
        });
    },

    resolve: function(attacksSnap) {

        var id = currentUser.id;
        var winCount = snapshot.players.child(`${id}/wins`).val();
        var lossCount = snapshot.players.child(`${id}/losses`).val();
        var tieCount = snapshot.players.child(`${id}/ties`).val();

        attacksSnap.forEach(function(childSnap) {

            var myAttack, theirAttack;
            var index = childSnap.key;

            if (index === currentUser.id) {

                myAttack = childSnap.child("weapon").val();
                console.log(myAttack);

            } else {

                theirAttack = childSnap.child("weapon").val();
                console.log(theirAttack);
            }

            if ((myAttack === "r") && (theirAttack === "s")) {
              winCount++;
            } else if ((myAttack === "r") && (theirAttack === "p")) {
              lossCount++;
            } else if ((myAttack === "s") && (theirAttack === "r")) {
              lossCount++;
            } else if ((myAttack === "s") && (theirAttack === "p")) {
              winCount++;
            } else if ((myAttack === "p") && (theirAttack === "r")) {
              winCount++;
            } else if ((myAttack === "p") && (theirAttack === "s")) {
              lossCount++;
            } else if (myAttack === theirAttack) {
              tieCount++;
            }

            // this.reset();
        });

        console.log(winCount, lossCount, tieCount);

        currentUser.wins = winCount;
        currentUser.losses = lossCount;
        currentUser.ties = tieCount;

        userRef.child("wins").set(winCount);
        userRef.child("losses").set(lossCount);
        userRef.child("ties").set(tieCount);
    },
}

$(document).ready(function() {
    fireBase.initialize();
});