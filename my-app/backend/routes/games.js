const router = require('express').Router();
let Game = require('../models/game.model');

router.route('/').get((req, res) => {
  Game.find()
    .then(games => res.json(games))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const joinCode = req.body.joinCode;

  const newGame = new Game({joinCode});

  newGame.save()
    .then(() => res.json('Game added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').get((req, res) => {
    Game.findById(req.params.id)
      .then(game => res.json(game))
      .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
Game.findByIdAndDelete(req.params.id)
    .then(() => res.json('Game deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req, res) => {
Game.findById(req.params.id)
    .then(game => {
    game.joinCode = req.body.joinCode;
    game.players = req.body.players;
    game.songPlayerPairs = req.body.songPlayerPairs;

    game.save()
        .then(() => res.json('Game updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/addPair/:id').post((req, res) => {
    Game.findById(req.params.id)
        .then(game => {
        
        game.songPlayerPairs.push({
            playerName: req.body.playerName,
            playerId: req.body.playerId,
            songName: req.body.songName,
            songId: req.body.songId
        })
    
        game.save()
            .then(() => res.json('Pair Added!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });

router.route('/addPlayer/:id').post((req, res) => {
    Game.findById(req.params.id)
        .then(game => {
        
        game.players.push({
            name: req.body.name,
            id: req.body.id,
        })
    
        game.save()
            .then(() => res.json('Player Added!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });


module.exports = router;