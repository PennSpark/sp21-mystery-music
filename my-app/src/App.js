// App.js
import React, { Component } from 'react';
import Game from './Game';
import game from './Board';
import * as PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";
import shortid from 'shortid';
import axios from 'axios';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.pubnub = new PubNubReact({
      publishKey: "pub-c-353f0377-1a09-4a4f-be96-1f51d601592c",
      subscribeKey: "sub-c-7cb8e092-8c1a-11eb-9de7-3a1dcc291cdf"
    });
    // TODO: Clean up code and get rid of unnecessary bits
    this.state = {
      player: '', // username players enter for themselves
      isPlaying: false, // Set to true when at least 2 players are in a channel
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    };
    this.lobbyChannel = null; // Lobby channel
    this.gameChannel = null; // Game channel
    this.size = null; // Number of players in room USE DATABASE FOR THIS
    this.roomId = null; // Unique id when player creates a room
    this.databaseGameId = null // id for game in database for endpoints
    this.pubnub.init(this); // Initialize PubNub
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels: [this.lobbyChannel, this.gameChannel]
    });
  }

  componentDidUpdate() {
    // Check that the player is connected to a channel
    if (this.lobbyChannel != null) {
      this.pubnub.getMessage(this.lobbyChannel, (msg) => {
        // Start the game once an opponent joins the channel
        if (msg.message.notRoomCreator) {
          // Create a different channel for the game
          this.gameChannel = 'spotifygame--' + this.roomId;

          this.pubnub.subscribe({
            channels: [this.gameChannel]
          });

          this.setState({
            isPlaying: true
          });

          // Close the modals if they are opened
          Swal.close();
        }
      });
    }
  }

  // Create a room channel
  onPressCreate = (e) => {
    this.size = 1;
    // Create a random name for the channel
    this.roomId = shortid.generate().substring(0, 5);
    this.lobbyChannel = 'spotifylobby--' + this.roomId;

    //endpoint for creating a new game in databsae
    const newGame = {
      joinCode: this.roomId,
    };
    axios.post('http://localhost:5001/games/add', newGame)
    .then(res => console.log(res.data));

    this.pubnub.subscribe({
      channels: [this.lobbyChannel],
      withPresence: true
    });

    // Open the modal sweetalert2
    Swal.mixin({
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['1', '2', '3']
    }).queue([
      {
        title: 'Share this room ID with your friend',
        text: this.roomId
      },
      {
        title: 'Type your username here',
        input: 'text'
      },
      {
        title: 'Song 1',
        text: 'List your top 5 songs!',
        input: 'text',
        inputPlaceholder: 'Enter your first song'
      },
      {
        title: 'Song 2',
        input: 'text',
        inputPlaceholder: 'Enter your second song'
      },
      {
        title: 'Song 3',
        input: 'text',
        inputPlaceholder: 'Enter your third song'
      },
      {
        title: 'Song 4',
        input: 'text',
        inputPlaceholder: 'Enter your fourth song'
      },
      {
        title: 'Song 5',
        input: 'text',
        inputPlaceholder: 'Enter your fifth song'
      }
    ]).then((result) => {
      if (result.value) {
        // const answers = JSON.stringify(result.value)
        Swal.fire({
          html: `
            Your username:
            <pre><code>${result.value[1]}</code></pre>
          `,
          confirmButtonText: 'Play!'
        });

        this.setState({
          player: result.value[1],
          isRoomCreator: true,
          isDisabled: true, // Disable the 'Create' button
          myTurn: true, // Room creator makes the 1st move
        });

        // endpoint for adding a new player to a game in database
        const newPlayer = {
          joinCode: this.roomId,
          playerName: result.value[1]
        };
        axios.post('http://localhost:5001/games/addPlayer', newPlayer)
          .then(res => console.log(res.data));
          axios.get('http://localhost:5001/games/')
          .then(response => {
            for (var i = 0; i < response.data.length; i++){
              if (response.data[i].joinCode == this.roomId){
                this.databaseGameId = response.data[i]._id;
                for (var j = 2; j <= 6; j++){
                  var newPair = {
                    playerName : result.value[1],
                    songName : result.value[j]
                  };
                  axios.post('http://localhost:5001/games/addPair/' + this.databaseGameId, newPair)
                    .then(res => console.log(res.data));
                }
              
              }
            }
          })
          .catch((error) => {
              console.log(error);
          });
      };
    });
  }

  // The 'Join' button was pressed
  onPressJoin = (e) => {

    Swal.mixin({
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['1', '2', '3']
    }).queue([
      {
        inputPlaceholder: 'Enter the room id',
        input: 'text'
      },
      {
        title: 'Type your username here',
        input: 'text'
      },
      {
        title: 'Song 1',
        text: 'List your top 5 songs!',
        input: 'text',
        inputPlaceholder: 'Enter your first song'
      },
      {
        title: 'Song 2',
        input: 'text',
        inputPlaceholder: 'Enter your second song'
      },
      {
        title: 'Song 3',
        input: 'text',
        inputPlaceholder: 'Enter your third song'
      },
      {
        title: 'Song 4',
        input: 'text',
        inputPlaceholder: 'Enter your fourth song'
      },
      {
        title: 'Song 5',
        input: 'text',
        inputPlaceholder: 'Enter your fifth song'
      }
    ]).then((result) => {
      if (result.value) {
        // const answers = JSON.stringify(result.value)
        Swal.fire({
          html: `
            Your username:
            <pre><code>${result.value[1]}</code></pre>
          `,
          confirmButtonText: 'Play!'
        });
        // Check if the user typed a value in the input field
        if (result.value[1]) {
          this.joinRoom(result.value[0]);

          this.setState({
            player: result.value[1],
          });

          //endpoint for adding a new player to a game in databsae
          const newPlayer = {
            joinCode: result.value[0],
            playerName: result.value[1]
          };

          axios.post('http://localhost:5001/games/addPlayer', newPlayer)
            .then(res => console.log(res.data));

            axios.get('http://localhost:5001/games/')
            .then(response => {
              for (var i = 0; i < response.data.length; i++){
                if (response.data[i].joinCode == this.roomId){
                  this.databaseGameId = response.data[i]._id;
                  for (var j = 2; j <= 6; j++){
                    var newPair = {
                      playerName : result.value[1],
                      songName : result.value[j]
                    };
                    axios.post('http://localhost:5001/games/addPair/' + this.databaseGameId, newPair)
                      .then(res => console.log(res.data));
                  }
                
                }
              }
            })
            .catch((error) => {
                console.log(error);
            });
        };
      };
    });

  }

  // Join a room channel
  joinRoom = (value) => {
    this.roomId = value;
    this.lobbyChannel = 'spotifylobby--' + this.roomId;

    // Check the number of people in the channel
    this.pubnub.hereNow({
      channels: [this.lobbyChannel],
    }).then((response) => {
      if (response.totalOccupancy < 8) {
        this.size += 1;

        this.pubnub.subscribe({
          channels: [this.lobbyChannel],
          withPresence: true
        });

        this.pubnub.publish({
          message: {
            notRoomCreator: true,
          },
          channel: this.lobbyChannel
        });
      }
      else {
        // Game in progress
        Swal.fire({
          title: 'Error',
          text: 'Game is full.',
        })
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // Reset everything
  endGame = () => {
    this.setState({
      player: '',
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    });

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;

    this.pubnub.unsubscribe({
      channels: [this.lobbyChannel, this.gameChannel]
    });
  }

  render() {
    return (
   <div>
     {
       !this.state.isPlaying &&
   
       <div class="home-v2-1 screen">
         <div class="overlap-group">
           <img
             class="card-pricing-2"
             src="https://anima-uploads.s3.amazonaws.com/projects/60760a93d4d62b3f8b0aea2b/releases/608797e5c0ff3678276ff026/img/card-pricing-2@1x.svg"
           />
           <img
             class="card-pricing-3"
             src="https://anima-uploads.s3.amazonaws.com/projects/60760a93d4d62b3f8b0aea2b/releases/608797e5c0ff3678276ff026/img/card-pricing-3@1x.svg"
           />
           <div class="text-1">
             How to Play<br />1. Up to 8 players may join a game, be sure to share the join code with your friends!<br />2. During
             each round, the game will play a song from one of the player’s Spotify playlist.<br />3. Players then have to
             select the user whose playlist they think the song is from.<br />4. Correct answers get 1 point, and wrong answers
             get 0 points.<br />5. After 20 rounds, the player with the most number of points wins!
           </div>
           <div class="flex-row">
              <button
                class="create-button"
                disabled={this.state.isDisabled}
                onClick={(e) => this.onPressCreate()}
                > Create
              </button>
              <button
                class="join-button"
                onClick={(e) => this.onPressJoin()}
                > Join
              </button>
           </div>
         </div>
       </div>
  
    }

    {
      this.state.isPlaying &&
      <Game
        pubnub={this.pubnub}
        gameChannel={this.gameChannel}
        player={this.state.player}
        size={this.size}
        isRoomCreator={this.state.isRoomCreator}
        endGame={this.endGame}
        roomId ={this.roomId}
        databaseGameId = {this.databaseGameId}
      />
    }
   </div>

                                
    );
  }
}
export default App;