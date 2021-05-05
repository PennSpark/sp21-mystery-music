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
      currentSong: ""
    };

    console.log("size: " + this.state.size);
    console.log("player: " + this.player);
  }

  // function for each new round
  newRound = () => {
    var scores = this.state.scores;
    // DONE (yet to be tested)
    // check guess and compare to actual answer
    // if correct use props.publish to push score to other players to update their render
    // also update current state (setstate) to update local render (done below)

    // TODO: check that this.state.guess is actually the index value needed?
    // ik player ids are based on when the player is added to the game so i think it works
    // but idk for sure !
    // also if componentMount w/e it's called actually runs to publish scores to other players
    // and even if it does does it publish all of them if they're all sent at the same time?
    // publish to database in timer before retrieving score


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
        // add new state if i want to display timer on screen? 
        // implement if there is time

        console.log("timer finish!");
        // end game if 4 rounds have been played, replace 4 with global var later
        if (this.state.round < 4) {

        this.newRound();
      } else {
        // displays winner of game, top points scorer
        this.checkForWinner();
      }
      } else {
        if (timeleft % 5 === 0) {
          console.log(timeleft);
        }
        
      }
      timeleft -= 1;
    }, 1000);
  }

  // tbh unnecessary function bc it doesn't work?
  // leaving here for now in case it's useful (copied into componentDidMount atm)
  fillArray(size) {
    var array = Array(size).fill();
    axios.get('http://localhost:5001/games/getGame/' + this.databaseGameId)
    .then(response => {
      for (var i = 0; i < response.data.size; i++){
        console.log(response.data.players[i].playerName);
        array[i] = response.data.players[i].playerName;
      }
    })
    .catch((error) => {
        console.log(error);
    })

    return array;
  }
  
  // retrieve next player song pair info, to be used in newRound()
  nextTurn() {
    axios.get('http://localhost:5001/games/getRandomPair/' + this.databaseGameId)
    .then(response => {
      console.log(response);
      //player id of song
      console.log("id " + response.data[0].playerId);
      //player name of song if needed
      console.log("name " + response.data[0].playerName);
      //name of song if needed
      console.log("song " + response.data[0].songName);

      this.setState({
        answer: response.data[0].playerId,
        currentSong: response.data[0].songName
      });

      console.log("got pair");
    })
    .catch((error) => {
        console.log(error);
    });
  }

  // function runs whenever a new element is added to the DOM
  // maybe switch to componentDidUpdate if more appropriate?
  // because of pubnub, need to run pubnub to publish updated local scores
  // received from other players and aaaa
  componentDidMount() {
    // currently timer() (and game) starts on button push but
    // that only runs locally for one player, idk if i should just 
    // make a statement that starts the game when there are 4 players
    // i could use pubnub to start timer at the same time??? maybe but
    // too much work and prev sol would be easier ig
    // currently commented out atm
    // this.timer();
    var squares = Array(this.state.size).fill("loading names");
    var scores = Array(this.state.size).fill("loading scores");

    this.timer2 = setInterval(() => {
      if (this.state.size === 2) {
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
    }, 2000);

    //gets size(num of players in game) and updates squares
    // TODO:
    // this is used to initally populate game board, rn it doesn't update
    // board for players already ingame when new players join
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

      // edit publish move to publish scoreboard instead?
      // old copied code, currently publishes move to opponents' boards
      // but not actually bc i commented out the code that sends the message    
      this.publishMove(msg.message.index);

      // Start a new game
      // TODO: update this appropriately with new values in state and etc
      // idk if necessary? if no time just delete and don't give option to replay game
      if(msg.message.reset){
        this.setState({
          // update players
          squares: this.fillArray(4),
          round: 0
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

	// Update db score if answer is correct
  // not necessary bc i think i can use pubnub to keep track of scores?
  // side note is pubnub even necessary with backend???
  // so yeah bc there's no route to retrieve scores i'm not using this function!
  updateScore = (player) => {

    const updateScoreThing = {
      joinCode: this.roomId,
      playerName: player,
      score: this.score
    };

    axios.post('http://localhost:5001/games/updateScore', updateScoreThing)
      .then(res => console.log(res.data));
      

		// End the game once there is a winner
		// this.gameOver = true;
		// this.newRound(winner);	
  }

  // bad function name, actually just displays pop up for when game is 
  // TODO: actually display winner lol
  checkForWinner = () => {
    var winner = 0;

    for(var i = 0; i < this.state.size; i++) {
      if (this.state.scores[i] > this.state.scores[winner]) {
        winner = i;
      }
    }

    // All rounds have been completed
      this.gameOver = true;
      if(this.props.isRoomCreator) {
        Swal.fire({      
              position: 'top',
              allowOutsideClick: false,
              title: 'Game Over',
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

    // no need to check correctness since done in new move,
    // just update scores based on info from pubnub message 
    // this function is called in componentDidMount

  }

  // function runs when a button on the gameboard is clicked
  // don't need to check correctness, just update current state.guess
  // TODO: have some visible display to buttons being clicked? rn it's just console
  onMakeMove = (index) => {
    var squares = this.state.squares;

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

    // if (index == this.answer) { 
    //   console.log("correct!");
    //   // Update chosen button to show that it's been clicked
    //   // squares[index] = 'X';

    //   this.score += 1;

    //    this.setState({
    //      squares: squares,
    //    });

      // Publish move to the channel
      // this.props.pubnub.publish({
      //   message: {
      //     player: index,
      //    
      //   },
      //   channel: this.props.gameChannel
      // });  
    // }
  }

  render() {
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
            Round: {this.state.round} <br/>
            Song: {this.state.currentSong}
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
            {/* scoreboard update */}
            <div class="leaderboard-example">
              <div class="overlap-group3">
                <div class="name-1 karla-normal-black-24px">{this.state.squares[0]}</div>
                <img
                  class="star-1"
                  src="https://anima-uploads.s3.amazonaws.com/projects/60760a93d4d62b3f8b0aea2b/releases/6078ee0985f5e7f39b088386/img/star-1@2x.svg"
                />
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
        <button type="button" value="Start Game" onClick={() => this.timer()} >start timer  </button>
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