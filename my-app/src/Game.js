import React from 'react';
import Board from './Board';
import Swal from "sweetalert2";  
import './Game.css';
import axios from 'axios';

const option_letters = ['A', 'B', 'C', 'D'];

class Game extends React.Component {

  constructor(props) {
    super(props);

    this.setState({
      countdown: 10,
    });

    this.player = this.props.player;
    this.roomId = this.props.roomId;
    this.databaseGameId = this.props.databaseGameId;
    this.round = 0;
    this.score = 0;
    this.gameOver = false;
    this.counter = 0;
    this.answer = 0;

    this.state = {
      // squares contains the player names in the game !
      // use fillArray to get list of players from db
      // displayed by Board.js
      squares: [], 
      size : 0
    };

    console.log("size: " + this.state.size);
    console.log("player: " + this.player);
  }

  // function for each new round
  newRound = () => {
    var squares = this.state.squares;

    squares = Array(this.state.size).fill("temp");
    this.round += 1;
    this.answer = this.round;

    this.setState({
      // update squares
      squares: squares
    });

    // update scoreboard
    // update current song
  }

  timer = () => {
    var timeleft = 10;
    var timer = setInterval(() => {
      if (timeleft <= 0){
        clearInterval(timer);
        //document.getElementById("countdown").innerHTML = "Finished";
        this.round += 1;
        var x = this.round;
        //document.getElementById("status").innerHTML = 'Round:' + x;
        //this.newRound();
      } else {
        //document.getElementById("countdown").innerHTML = timeleft + " seconds remaining";
      }
      timeleft -= 1;
    }, 1000);
  }

  fillArray(size) {
    var array = Array(size).fill();
    axios.get('http://localhost:5001/games/getGame/' + this.databaseGameId)
    .then(response => {
      for (var i = 0; i < response.data.players.length; i++){
        array[i] = response.data.players[i].playerName;
      }
    })
    .catch((error) => {
        console.log(error);
    })

    return array;
  }

  

  nextTurn(n) {
    axios.get('http://localhost:5001/games/getRandomPair/' + this.databaseGameId)
    .then(response => {
      //player id of song
      this.answer = response.data[0].playerId;
      //player name of song if needed
      console.log(response.data[0].playerName);
      //name of song if needed
      console.log(response.data[0].songName);
    })
    .catch((error) => {
        console.log(error);
    })
  }

  componentDidMount() {
    this.timer();
    //gets size(num of players in game) and updates squares
    axios.get('http://localhost:5001/games/getGame/' + this.databaseGameId)
    .then(response => {
      console.log("hi there");
      console.log(response);
        this.setState({
          size : response.data.size,
          squares: this.fillArray(response.data.size)
        });
     
    })
    .catch((error) => {
        console.log(error);
    })

    
    this.props.pubnub.getMessage(this.props.gameChannel, (msg) => {

      // edit publish move to publish scoreboard instead?
      // Publish move to the opponent's board    
      this.publishMove(msg.message.index, msg.message.piece);

      // Start a new game
      if(msg.message.reset){
        this.setState({
          // update players
          squares: this.fillArray(8)
        });

        this.round = 0;
        this.score = 0;
        this.gameOver = false;
        this.counter = 0;
        this.answer = 0;
        Swal.close()
      }

      // End the game and go back to the lobby
      else if(msg.message.endGame){
        Swal.close();
        this.props.endGame();
      }
    });
  }

	// Update score if answer is correct
  updateScore = (winner) => {

    const updateScoreThing = {
      joinCode: this.roomId,
      playerId: winner,
      score: this.score
    };
    axios.post('http://localhost:5001/games/updateScore', updateScoreThing)
      .then(res => console.log(res.data));
      

		// End the game once there is a winner
		// this.gameOver = true;
		// this.newRound(winner);	
  }
  
  checkForWinner = () => {

    // All rounds have been completed
    if (this.round === 4) {
      this.gameOver = true;
      if(this.props.isRoomCreator) {
        Swal.fire({      
              position: 'top',
              allowOutsideClick: false,
              title: 'Game Over',
              text: 'Ready for next round?',
              showCancelButton: true,
              confirmButtonColor: 'rgb(208,33,41)',
              cancelButtonColor: '#aaa',
              cancelButtonText: 'Nope',
              confirmButtonText: 'Yea!',
              width: 275,
            }).then((result) => {
              // Start a new round
              if (result.value) {
                this.props.pubnub.publish({
                  message: {
                    reset: true
                  },
                  channel: this.props.gameChannel
                });
              }
      
              else{
                // End the game
                this.props.pubnub.publish({
                  message: {
                    endGame: true
                  },
                  channel: this.props.gameChannel
                });
              }
            })      
          
      } else {
      Swal.fire({  
            position: 'top',
            allowOutsideClick: false,
            title: 'Game Over',
            text: 'Waiting for a new round...',
            confirmButtonColor: 'rgb(208,33,41)',
            width: 275
          });
        }
    }
  };
   
  // Publishing an opponent's move onto the board
  // not even necessary ):
  // except maybe !!! for publishing scores ig
  publishMove = (index, piece) => {
    var squares = this.state.squares;

    squares[index] = piece;

    this.setState({
      // update scores
      squares: squares,
    });
    
    if (index === this.answer) {
      this.scores[index] += 1;
    }

    this.checkForWinner()
  }

  // Making a move on the board and publishing it
  onMakeMove = (index) => {
    var squares = this.state.squares;

    console.log(index);

    if (index == this.answer) { 
      console.log("correct!");
      // Update chosen button to show that it's been clicked
      squares[index] = 'X';

      this.score += 1;

       this.setState({
         squares: squares,
       });

      // Publish move to the channel
      // this.props.pubnub.publish({
      //   message: {
      //     index: index,
      //     piece: 'X',
      //   },
      //   channel: this.props.gameChannel
      // });  

      // Check if there is a winner
      this.checkForWinner();
    }
  }

  render() {

    let status;
    // Change to current round
    status = `${this.round}`;
    return (
      
      <div className="game">
         {/* You are player {this.player}
        <div className="prompt">
          Guess who! {this.answer}
        </div>
        <br></br> */}
        
        {/* <div className="scores-container">
          <div>
            SCORES {this.scores}
          </div>
        </div>   
      </div> */}
      
      <div class="container-center-horizontal">
      <div class="game-screen-1 screen">
        <div class="flex-row-5">
          <img
            class="mystery-music-logo3-1"
            src="https://anima-uploads.s3.amazonaws.com/projects/60760a93d4d62b3f8b0aea2b/releases/608797e5c0ff3678276ff026/img/mysterymusic-logo3-1@2x.png"
          />
          <div class="overlap-group">
            <h1 class="text-1">Guess Whose Playlist?</h1>
          </div>
        </div>
        <div class="flex-row-4">
          <div class="overlap-group1">
            <img
              class="vector-197"
              src="https://anima-uploads.s3.amazonaws.com/projects/60760a93d4d62b3f8b0aea2b/releases/6078ee0985f5e7f39b088386/img/vector-197@2x.svg"
            />
          </div>
          <div class="flex-col">
            <div class="album-cover"></div>
            <div class="play-bar">
              <div class="overlap-group3-1">
                <div class="rectangle"></div>
              </div>
            </div>
          </div>
          <div class="overlap-group2">
            // scoreboard update
            <div class="leaderboard-example">
              <div class="overlap-group3">
                <div class="name-1 karla-normal-black-24px">Linda</div>
                <img
                  class="star-1"
                  src="https://anima-uploads.s3.amazonaws.com/projects/60760a93d4d62b3f8b0aea2b/releases/6078ee0985f5e7f39b088386/img/star-1@2x.svg"
                />
                <div class="number-1 karla-bold-black-24px">6</div>
              </div>
              <div class="flex-row">
                <div class="name-2 karla-normal-black-24px">Lindsay</div>
                <div class="number-2 karla-bold-black-24px">5</div>
              </div>
              <div class="flex-row-1">
                <div class="egret karla-normal-black-24px">Egret</div>
                <div class="number karla-bold-black-24px">3</div>
              </div>
              <div class="flex-row-2">
                <div class="name karla-normal-black-24px">David</div>
                <div class="number-3 karla-bold-black-24px">1</div>
              </div>
            </div>
          </div>

        </div>
        <div className="board">
          <Board
              squares={this.state.squares}
              size={this.props.size}
              onClick={index => this.onMakeMove(index)}
            />   
            <div id="countdown"></div>      
        </div>
      </div>
    </div>
    </div>
    
 
    
    );
  }
}

export default Game;