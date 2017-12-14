//--- JavaScript for a RkPprSsrs game---//

var currentUser = {};
var snaps = {};
var database;

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
                console.log("signedin");
                var uid = credential.uid;

                userRef = database.ref("/users/" + uid);
                //Creates and stores reference to -> a new /users entry in firebase
                //folder will be removed when user session ends
                userRef.onDisconnect().remove();
                userRef.set("");


            } else {
                // No user is signed in.
                console.log("notsignedin");
                firebase.auth().signInAnonymouslyAndRetrieveData()
                .catch(function(error) {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.error(errorCode, errorMessage);
                });
            }
        });

        game.initialize();
    },

    getSnapshot: function() {

        database.ref().on("value", function(snapshot) {
            snaps.all = snapshot;
            console.log(snapshot.val());
          });

    },
}

var game = {

    initialize: function() {

        $("#join").on("click", function (event) {
            event.preventDefault();

            var time = moment().format("MM/DD/YYYY hh:mm:ss");
            var name = $("#name").val().trim();

            currentUser.username = name;
            currentUser.score = 0;
            currentUser.joinTime = time;

            console.log(currentUser);

            fireBase.getSnapshot();

            $("#name").val("");
            $("#banner").text("Getting Game Ready");
            $(".player, .chat, .queue").removeClass("hide");
        });
    },

    getSnapshot: function() {

        var userRef = database.ref("users");
        var gameRef = database.ref("game");
        var chatRef = database.ref("chat");

        userRef.on("value", function(snap) {
            if (snap.val())
        });



    },
}

$(document).ready(function() {
    fireBase.initialize();
});



// function usersChange(users) {
//     countUsers = users.numChildren();
//     // var i = 1;
//     // $.each(users.val(), function(id, obj) {
//     //     database.ref("/users/" + id).update({
//     //         queue: i
//     //     });
//     //     i++
//     // });
//     updatePlayerHTML(users);
// };

// function updatePlayerHTML(users) {
//     var i = 1;

//     $.each(users.val(), function (id, obj) {
//         if (i <= game.maxCount) {
//             $("#p" + i + "Name").text(obj.username);
//             $("#p" + i + "Score").text(obj.score);

//         } else {
//             var row = $("<tr>");
//             var cell1 = $("<td>");
//             var cell2 = $("<td>");
//             cell1.text(i-game.maxCount);
//             cell2.text(obj.username);
//             row.append(cell1, cell2);
//             $("#queue").append(row);
//         }

//         i++;
//     });
// }

// function updateChatHTML(chat) {

//     countChat = chat.numChildren();
//     $("#chat").empty();

//     for (var i = 1; i <= countChat; i++) {
//         var message = chat.child(i + "/message").val();
//         var username = chat.child(i + "/username").val();
//         var row = $("<tr>");
//         var cell = $("<td>");

//         cell.text(username + ": " + message);
//         row.append(cell);
//         $("#chat").append(row);

//         var tbody = $("#chat")[0];
//         tbody.scrollTop = tbody.scrollHeight;
//     }
// }

// $("#send").on("click", function sendChat(event) {
//     event.preventDefault();
//     var text = $("#message").val().trim();
//     var chatRef = firebase.database().ref('chat/' + (countChat + 1));
//     chatRef.set({
//         username: name,
//         message: text,
//     });
// });


// function startGame() {
// }

// function attack() {

// }

// function checkWin() {

// }

// function leaveGame() {

// }


