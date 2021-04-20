// App.js
import React, { Component } from 'react';
import Game from './Game';
import game from './Board';
import * as PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";
import shortid from 'shortid';
import axios from 'axios';
import './index.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.pubnub = new PubNubReact({
      publishKey: "pub-c-353f0377-1a09-4a4f-be96-1f51d601592c",
      subscribeKey: "sub-c-7cb8e092-8c1a-11eb-9de7-3a1dcc291cdf"
    });
    this.state = {
      player: '', // 1, 2, 3, 4, 5
      isPlaying: false, // Set to true when at least 2 players are in a channel
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
    };
    this.lobbyChannel = null; // Lobby channel
    this.gameChannel = null; // Game channel
    this.size = null; // Number of players in room
    this.roomId = null; // Unique id when player creates a room
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
      joincode: this.roomId,
    };
    axios.post('http://localhost:5000/games/add', newGame)
      .then(res => console.log(res.data));

    this.pubnub.subscribe({
      channels: [this.lobbyChannel],
      withPresence: true
    });

    // Open the modal sweetalert2
    Swal.mixin({
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['1', '2']
    }).queue([
      {
        title: 'Share this room ID with your friend',
        text: this.roomId
      },
      {
        title: 'Type your username here',
        input: 'text'
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

        //endpoint for adding a new player to a game in databsae
        const newPlayer = {
          joincode: result.value[0],
          name: "filler",
          id: result.value[1]
        };
        axios.post('http://localhost:5000/games/addPlayer', newPlayer)
          .then(res => console.log(res.data));
      }
    })
  }

  // The 'Join' button was pressed
  onPressJoin = (e) => {

    Swal.mixin({
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['1', '2']
    }).queue([
      {
        inputPlaceholder: 'Enter the room id',
        input: 'text'
      },
      {
        title: 'Type your username here',
        input: 'text'
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
            joincode: result.value[0],
            name: "filler",
            id: result.value[1]
          };

          axios.post('http://localhost:5000/games/addPlayer', newPlayer)
            .then(res => console.log(res.data));
        }
      }
    })

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
        <div className="title">
          <h1> MysteryMusic </h1>
        </div>
        {
          !this.state.isPlaying &&
          <div className="game">
            <div className="board">
              <div className="button-container">
                <div id="create-container">
                  <h2>Host</h2>
                  <h3>Start the game!</h3> <br></br>
                  <h4>Create the game for other players to join</h4>
                  <button
                    className="button "
                    disabled={this.state.isDisabled}
                    onClick={(e) => this.onPressCreate()}
                  > Create
                </button>
                </div>
                <div id="join-container">
                  <h2>Joiner</h2>
                  <h3>Join a game!</h3> <br></br>
                  <h4>Join a game another player is hosting</h4>
                  <button
                    className="button"
                    onClick={(e) => this.onPressJoin()}
                  > Join
                </button>
                </div>
              </div>
            </div>
          </div>
        }

        {
          this.state.isPlaying &&
          <div className="game">
            <h3>Your room code: {this.roomId}</h3>
            {
            // TODO: get size from database 
            }
            <h3>Number of people in game: {this.size}</h3>
          <Game
            pubnub={this.pubnub}
            gameChannel={this.gameChannel}
            player={this.player}
            size={this.size}
            isRoomCreator={this.state.isRoomCreator}
            endGame={this.endGame}
          />
          </div>
        }
      </div>
    );
  }
}
export default App;