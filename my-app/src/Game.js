import React from 'react';
import Board from './Board';
import Swal from "sweetalert2";  
import './Game.css';
import axios from 'axios';

const option_letters = ['A', 'B', 'C', 'D'];

class Game extends React.Component {

  constructor(props) {
    super(props);

    this.player = this.props.player;
    this.roomId = this.props.roomId;
    this.databaseGameId = this.props.databaseGameId;
    this.score = 0; // idk if this is necessary, remove?
    this.gameOver = false;
    // this.answer = 0;

    this.nextTurn();

    this.state = {
      // squares contains the player names in the game for the game board thing !
      // these items must be in state in order to update the screen (render())
      // when state is also updated
      squares: option_letters, 
      size : 0,
      round : 1,
      scores: [],
      guess: "",
      answer: 0,
      currentSong: "",
      time: 10
    };

    console.log("size: " + this.state.size);
    console.log("player: " + this.player);
  }

  // function for each new round
  newRound = () => {
    var scores = this.state.scores;

    // get updated scores from db 
    axios.get('http://localhost:5001/games/getGame/' + this.databaseGameId)
    .then(response => {

      console.log(response);
      for (var i = 0; i < response.data.size; i++){
        scores[i] = response.data.players[i].score;
      }

      this.setState({
        scores: scores
      })
     
    })
    .catch((error) => {
        console.log(error);
    });


    // use nextTurn to set new answer from db when running
    this.nextTurn();
    // this.state.answer = Math.floor(this.state.size * Math.random());
    // this.state.currentSong = "random song test";
    console.log("new answer: " + this.state.answer);

    // update state
    this.setState({
      scores: scores,
      round: this.state.round + 1
    });

    console.log("round" + this.state.round);

    // starts new timer for next round
    this.timer();
  }

  // function used to determine the end of each round
  timer = () => {
    clearInterval(this.timer2);
    var timeleft = 10;
    var timer = setInterval(() => {
      if (timeleft <= 0) {
        clearInterval(timer);

        this.setState({
          time: timeleft
        });

        console.log("timer finish!");
        // end game if 10 rounds have been played
        if (this.state.round < 10) {

        this.newRound();
      } else {
        // displays winner of game, top points scorer
        this.checkForWinner();
      }
      } else {
        this.setState({
          time: timeleft
        });
        
      }
      timeleft -= 1;
    }, 1000);
  }
  
  // retrieve next player song pair info, to be used in newRound()
  nextTurn() {
    axios.get('http://localhost:5001/games/getRandomPair/' + this.databaseGameId)
    .then(response => {
      console.log(response);
      //player id of song
      //console.log("id " + response.data[0].playerId);
      //player name of song if needed
      console.log("name " + response.data[this.state.round * 2].playerName);
      //name of song if needed
      console.log("song " + response.data[this.state.round * 2].songName);

      var answer = 0;
      for (var i = 0; i < this.state.size; i++) {
        if (response.data[this.state.round * 2].playerName.localeCompare(this.state.squares[i]) === 0) {
          answer = i;
        }
      }

      this.setState({
        answer: answer,
        currentSong: response.data[this.state.round * 2].songName
      });

      console.log("got pair");
    })
    .catch((error) => {
        console.log(error);
    });
  }

  // function runs whenever a new element is added to the DOM
  // maybe switch to componentDidUpdate if more appropriate?
  componentDidMount() {

    var squares = Array(this.state.size).fill("loading names");
    var scores = Array(this.state.size).fill("loading scores");

    this.timer2 = setInterval(() => {
      if (this.state.size === 4) {
        this.timer();
      }

      axios.get('http://localhost:5001/games/getGame/' + this.databaseGameId)
      .then(response => {
        console.log("hi there");
        console.log(response);

        for (var i = 0; i < response.data.size; i++){
          console.log(response.data.players[i].playerName);
          squares[i] = response.data.players[i].playerName;
          scores[i] = 0;
        }
        
          this.setState({
            size : response.data.size,
            squares: squares,
            scores: scores
          });
      
      })
      .catch((error) => {
          console.log(error);
      });
    }, 1000);

    // gets size(num of players in game) and updates squares
    axios.get('http://localhost:5001/games/getGame/' + this.databaseGameId)
    .then(response => {
      console.log("hi there");
      console.log(response);

      for (var i = 0; i < response.data.size; i++){
        console.log(response.data.players[i].playerName);
        squares[i] = response.data.players[i].playerName;
        scores[i] = 0;
      }
      
        this.setState({
          size : response.data.size,
          squares: squares,
          scores: scores
        });
     
    })
    .catch((error) => {
        console.log(error);
    });

    // what is used to get info from other players so we can appropriately
    // update the scoreboard based on whether or not other people got answers right
    this.props.pubnub.getMessage(this.props.gameChannel, (msg) => {
 
      this.publishMove(msg.message.index);

      // Start a new game
      if(msg.message.reset){
        this.setState({
          round: 0,
          scores: [0, 0, 0, 0]
        });

        this.score = 0;
        this.gameOver = false;
        Swal.close()
      }

      // End the game and go back to the lobby
      else if(msg.message.endGame){
        Swal.close();
        this.props.endGame();
      }
    });
  }

	// Update db score 
  updateScore = (player) => {

    const updateScoreThing = {
      joinCode: this.roomId,
      playerName: player,
      score: this.score
    };

    axios.post('http://localhost:5001/games/updateScore', updateScoreThing)
      .then(res => console.log(res.data));

  }

  // bad function name, actually just displays pop up for when game is 
  checkForWinner = () => {
    var winner = 0;

    for(var i = 0; i < this.state.size; i++) {
      if (this.state.scores[i] > this.state.scores[winner]) {
        winner = this.state.squares[i];
      }
    }

    if (winner === 0) {
      winner = this.state.squares[0];
    }

    // All rounds have been completed
      this.gameOver = true;
      if(this.props.isRoomCreator) {
        Swal.fire({      
              position: 'top',
              allowOutsideClick: false,
              title: winner + ' won!',
              text: 'Want to play again?',
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
                axios.delete('http://localhost:5001/games/updateScore'+ this.databaseGameId)
                .then(res => console.log(res));
              }
            })      
          
      } else {
      Swal.fire({  
            position: 'top',
            allowOutsideClick: false,
            title: winner + ' won!',
            text: 'Waiting for a new round...',
            confirmButtonColor: 'rgb(208,33,41)',
            width: 275
          });
        }
  };
   
  // Publishing an opponent's score onto scoreboard
  // setState should rerender screen automatically
  publishMove = (index) => {
    var scores = this.state.scores;
    scores[index] = scores[index] + 1;

    this.setState({
      // update scores
      scores: scores
    });

  }

  // function runs when a button on the gameboard is clicked
  onMakeMove = (index) => {

    console.log(index);

    this.setState({
      guess: index
    });

    if (index === this.state.answer) {

      console.log("correct!");
      console.log("guess: " + index);
      this.score += 1;
      console.log("this.score: " + this.score);

      this.updateScore(this.player);

    }

  }

  render() {
    return (
      
      <div className="game">
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
            <div class="album-cover">
              <h1>
            Round: {this.state.round} <br/>
            Song: {this.state.currentSong}
            </h1>
            </div>
            <br/>
            <div class="countdown">Time left: {this.state.time}</div>  
            <div class="play-bar">
              <div class="overlap-group3-1">
                <div class="rectangle"></div>
              </div>
            </div>
          </div>
          <div class="overlap-group2">
            {/* scoreboard update */}
            <div class="leaderboard-example">
              <div class="overlap-group3">
                <div class="name-1 karla-normal-black-24px">{this.state.squares[0]}</div>
                <div class="number-1 karla-bold-black-24px">{this.state.scores[0]}</div>
              </div>
              <div class="flex-row">
                <div class="name-2 karla-normal-black-24px">{this.state.squares[1]}</div>
                <div class="number-2 karla-bold-black-24px">{this.state.scores[1]}</div>
              </div>
              <div class="flex-row-1">
                <div class="egret karla-normal-black-24px">{this.state.squares[2]}</div>
                <div class="number karla-bold-black-24px">{this.state.scores[2]}</div>
              </div>
              <div class="flex-row-2">
                <div class="name karla-normal-black-24px">{this.state.squares[3]}</div>
                <div class="number-3 karla-bold-black-24px">{this.state.scores[3]}</div>
              </div>
            </div>
          </div>

        </div>
        {/* <button type="button" value="Start Game" onClick={() => this.timer()} >start timer  </button> */}

          <Board
              squares={this.state.squares}
              size={this.props.size}
              onClick={index => this.onMakeMove(index)}
            />   
 
      </div>
    </div>
    </div>
    
 
    
    );
  }
}

export default Game;