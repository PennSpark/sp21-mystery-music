import React from 'react';
import Board from './Board';
import Swal from "sweetalert2";  
import './Game.css';

const option_letters = ['A', 'B', 'C', 'D'];

class Game extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {
      // TODO: get number of players in game from database and replace 8
      // also fill the squares with the player names in fillArray
      squares: this.fillArray(8), 
      
    };

    this.setState({
      countdown: 10,
    });

    this.player = this.props.player;
    this.round = 0;
    this.score = 0;
    this.gameOver = false;
    this.counter = 0;
    this.answer = 0;
    
  }

  // function for each new round
  newRound = () => {
    var squares = this.state.squares;

    squares = Array(8).fill("temp");
    this.round += 1;
    this.answer = this.round;

    this.setState({
      // update squares
      squares: squares,
    });

    // update scores
  }

  timer = () => {
    var timeleft = 10;
    var timer = setInterval(() => {
      if (timeleft <= 0){
        clearInterval(timer);
        //document.getElementById("countdown").innerHTML = "Finished";
        this.round += 1;
        var x = this.round;
        document.getElementById("status").innerHTML = 'Round:' + x;
        //this.newRound();
      } else {
        //document.getElementById("countdown").innerHTML = timeleft + " seconds remaining";
      }
      timeleft -= 1;
    }, 1000);
  }

  fillArray(size) {

    // TODO: get players from db to fill the array with
    var array = Array(size).fill();
    for (var index = 0; index < array.length; index++) {
      array[index] = index;
    }
    return array;
  }

  nextTurn(n) {
    // TODO: get next player from api calls?
    // currently a placeholder
    return Math.floor(Math.random() * n);
  }

  componentDidMount() {
    this.timer();
    this.props.pubnub.getMessage(this.props.gameChannel, (msg) => {

      // Publish move to the opponent's board    
      this.publishMove(msg.message.index, msg.message.piece);

      // Start a new game
      if(msg.message.reset){
        this.setState({
          // update players
          squares: this.fillArray(8),
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
    // if selected index = correct index
    if (true) {
      this.score += 1;
    }

    // TODO: use this.player and this.score value to 
    // update score for player in db

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

    // Update chosen button to show that it's been clicked
    if(squares[index]) { 
      squares[index] = 'X';

       this.setState({
         squares: squares,
       });

      // Publish move to the channel
      this.props.pubnub.publish({
        message: {
          index: index,
          piece: 'X',
        },
        channel: this.props.gameChannel
      });  

      // Check if there is a winner
      this.checkForWinner();
    }
  }
// Instructions
//   How to Play
// Up to 8 players may join a game, be sure to share the join code with your friends!
// During each round, the game will play a song from one of the player’s Spotify playlist.
// Players then have to select the user whose playlist they think the song is from.
// Correct answers get 1 point, and wrong answers get 0 points.
// After 20 rounds, the player with the most number of points wins!

  render() {

    let status;
    // Change to current round
    status = `${this.round}`;
    return (
      /*
      <div className="game">
         You are player {this.player}
        <div className="prompt">
          Guess who! {this.answer}
        </div>
        <br></br>
        
        <div className="board">
          <Board
              squares={this.state.squares}
              size={this.props.size}
              onClick={index => this.onMakeMove(index)}
            />  
            <p id="status">Round: {this.round}</p>    
            <div id="countdown"></div>      
        </div>
        
        <div className="scores-container">
          <div>
            SCORES {this.scores}
          </div>
        </div>   
      </div>
      */
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
      </div>
    </div>
    
 
    
    );
  }
}

export default Game;