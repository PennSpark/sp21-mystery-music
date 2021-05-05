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

router.route('/getGame/:id').get((req, res) => {
    Game.findById(req.params.id)
      .then(game => res.json(game))
      .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/getGame').get((req, res) => {
    Game.findOne({joinCode: req.body.joinCode})
        .then(game => res.json(game))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
Game.findByIdAndDelete(req.params.id)
    .then(() => res.json('Game deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/addPair/:id').post((req, res) => {
    Game.findById(req.params.id)
        .then(game => {
        
        game.songPlayerPairs.push({
            playerName: req.body.playerName,
            playerId: req.body.playerId,
            songName: req.body.songName,
            songId: req.body.songId,
            songURL: req.body.songURL
        })
    
        game.save()
            .then(() => res.json('Pair Added!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });

router.route('/addPair').post((req, res) => {
    Game.findOne({joinCode: req.body.joinCode})
        .then(game => {

        game.songPlayerPairs.push({
            playerName: req.body.playerName,
            playerId: req.body.playerId,
            songName: req.body.songName,
            songId: req.body.songId,
            songURL: req.body.songURL
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
            playerName: req.body.playerName,
            playerId: req.body.playerId,
        })

        game.size = game.size + 1;
    
        game.save()
            .then(() => res.json('Player Added!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });

router.route('/addPlayer').post((req, res) => {
    Game.findOne({joinCode: req.body.joinCode})
        .then(game => {

        game.players.push({
            playerName: req.body.playerName,
            playerId: game.size
        })

        game.size = game.size + 1;
        
        game.save()
            .then(() => res.json('Player Added!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });

router.route('/updateScore').post((req, res) => {
    Game.findOne({joinCode: req.body.joinCode})
        .then(game => {

        const index = game.players.findIndex(player => player.playerName === req.body.playerName);

        game.players[index].score = req.body.score;

        game.save()
            .then(() => res.json('Score updated!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });

router.route('/removePlayer').post((req, res) => {
    Game.findOne({joinCode: req.body.joinCode})
        .then(game => {

        const index = game.players.findIndex(player => player.playerId === req.body.playerId);

        if (index !== undefined) game.players.splice(index, 1);

        game.size = game.size - 1;
        
        game.save()
            .then(() => res.json('Player Removed!'))
            .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
    });
    
router.route('/getRandomPair/:id').get((req, res) => {
    Game.findById(req.params.id)
        .then(game => {
            var pair = game.songPlayerPairs.splice(Math.floor(Math.random() * game.songPlayerPairs.length), 1);
            game.save()
                .then(() => res.json(pair))
                .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
});


router.route('/getRandomPair').get((req, res) => {
    Game.findOne({joinCode: req.body.joinCode})
    .then(game => {
        var pair = game.songPlayerPairs.splice(Math.floor(Math.random() * game.songPlayerPairs.length), 1);
        game.save()
            .then(() => res.json(pair))
            .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
  
        
});


module.exports = router;