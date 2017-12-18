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
        usersRef = database.ref("/users");
        playersRef = database.ref("/players");
        chatRef = database.ref("/chat");

        gameRef.on("value", function(snap) {
            console.log("game change");

            if (snap.val()) {

                snapshot.game = snap;
            }

            //handles counting attacks until time to resolve turn
            if (snap.hasChild("attacks")) {

                var attackCount = snap.child("attacks").numChildren();

            } else {

                attackCount = 0;
            }

            if ((currentUser.status === "attack")
            && (attackCount === maxCount)) {

                console.log(attackCount + "attacks");

                game.resolve(snap.child("attacks"));
            }
        });

        playersRef.on("value", function(snap) {

            game.updatePlayerHTML(snap);

            var playersCount = 0;

            if (snap.val()) {

                snapshot.players = snap;
                playersCount = snap.numChildren();
            }

            console.log("player count: " + playersCount);

            if ((playersCount < maxCount)
            && (currentUser.stat === "inQueue")) {

                game.queue();

            } else if ((playersCount < maxCount)
            && (currentUser.stat === "inGame")) {
                console.log("banner waiting");

                $("#banner").text("Waiting for players");

            } else if ((playersCount === maxCount)
            && (currentUser.stat === "inGame")) {

                game.attack();
            }
        });

        playersRef.on("child_removed", function(snap) {

            console.log("player removed");

            if (snap.val()) {

                game.reset();
            }
        });

        usersRef.on("value", function(snap) {
            console.log("Users change");

            game.updateQueueHTML(snap);

            if (snap.val()) {

                snapshot.users = snap;

                var playersCount = 0;
                if (snapshot.players) {
                    playersCount = snapshot.players.numChildren();
                }

                if ((playersCount < maxCount)
                && (currentUser.stat === "inQueue")) {

                    game.queue();

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
            currentUser.wins = 0;
            currentUser.losses = 0;
            currentUser.ties = 0;
            currentUser.id = now;
            currentUser.stat = "inQueue";

            userRef = database.ref(`/users/${now}`);
            userRef.onDisconnect().remove();
            userRef.set(currentUser);

            $(".player, .chat, .message, .queue").removeClass("hide");
            $("#welcome").addClass("hide");
        });

        $("#send").on("click", function(event) {
            event.preventDefault();

            var now = moment().format("YYYYMMDDHHmmss");
            var now2 = moment().format("YYYY MMM DD, hh:mm:ss");
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

        $(".playerHTML").empty();

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
        console.log("updateHTML");

        $("#queue").empty();

        if (snap.val()) {

            var numUsers = snap.numChildren();

            var i = 1;
            snap.forEach(function(childSnap) {

                var row = $("<tr>");
                var cell = $("<td>");
                cell.text(i + " - " + childSnap.val().username);
                row.append(cell);
                $("#queue").append(row);

                i++;
            });

        }


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

        if (gameRef.child("attacks")) {
            gameRef.child("attacks").remove();
        }

        if (currentUser.status === "attack") {
            currentUser.status === "inGame";

        } else if (currentUser.status === "resolve") {
            currentUser.status === "inGame";
        }
    },

    queue: function() {
        console.log("Adding player from queue");

        for (var firstID in snapshot.users) {

            var id = currentUser.id;

            if (firstID = currentUser.id) {

                currentUser.stat = "inGame";
                userRef.remove();
                playerRef = database.ref(`/players/${id}`);
                playerRef.onDisconnect().remove();
                playerRef.set(currentUser);
            }

            break;
        }

    },

    //allow user to click rock, paper, or scissors
    attack: function() {
        console.log("allow attack");

        $("#banner").text("New Round. Choose a weapon.");

        currentUser.status = "attack";

        $(".currentUser > .option").on("click", function() {

            //disable onclick until another round of attacks
            $(".option").addClass("hide");

            var selection = $(this).data("weapon").trim();
            var id = currentUser.id;

            newAttackRef = gameRef.child(`attacks/${id}`) ;
            newAttackRef.onDisconnect().remove();
            newAttackRef.set({
                weapon: selection
            });
        });

        $(".option").removeClass("hide");
    },

    resolve: function(attacksSnap) {
        console.log("resolving turn");

        currentUser.status = "resolving";

        var id = currentUser.id;
        var winCount = snapshot.players.child(`${id}/wins`).val();
        var lossCount = snapshot.players.child(`${id}/losses`).val();
        var tieCount = snapshot.players.child(`${id}/ties`).val();
        var myAttack, theirAttack, message;

        attacksSnap.forEach(function(childSnap) {

            var index = childSnap.key;

            if (index === id) {

                myAttack = childSnap.child("weapon").val();

            } else {

                theirAttack = childSnap.child("weapon").val();
            }
        });

        if ((myAttack === "r") && (theirAttack === "s")) {
          winCount++;
          message = "You win. Starting new game..."
        } else if ((myAttack === "r") && (theirAttack === "p")) {
          lossCount++;
          message = "You lose. Starting new game..."
        } else if ((myAttack === "s") && (theirAttack === "r")) {
          lossCount++;
          message = "You lose. Starting new game..."
        } else if ((myAttack === "s") && (theirAttack === "p")) {
          winCount++;
          message = "You win. Starting new game..."
        } else if ((myAttack === "p") && (theirAttack === "r")) {
          winCount++;
          message = "You win. Starting new game..."
        } else if ((myAttack === "p") && (theirAttack === "s")) {
          lossCount++;
          message = "You lose. Starting new game..."
        } else if (myAttack === theirAttack) {
          tieCount++;
          message = "Tie Game. Starting new game..."
        }

        currentUser.wins = winCount;
        currentUser.losses = lossCount;
        currentUser.ties = tieCount;

        $("#banner").text(message);

        game.reset();

        setTimeout(function() {
            playerRef.child("wins").set(winCount);
            playerRef.child("losses").set(lossCount);
            playerRef.child("ties").set(tieCount);
        }, 5000);
    },
}

$(document).ready(function() {
    fireBase.initialize();
});