const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const playerSchema = new Schema({
    name: {
      type: String,
    },
    id: {
      type: Number,
    },
    score: {
      type: Number,
      default: 0,
    },
});

const pairSchema = new Schema({
    playerName: {
        type: String,
    },
    playerId: {
        type: Number,
    },
    songName: {
        type: String,
    },
    songId: {
        type: String,
    },
    songURL: {
      type: String,
  },
});

const gameSchema = new Schema({
  joinCode: { type: String, unique: true},
  players: [playerSchema],
  songPlayerPairs: [pairSchema],
}, {
  timestamps: true,
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;