/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const MongoClient = require('mongodb').MongoClient;
const mongo_uri = "mongodb+srv://lsmith24@seas.upenn.edu:Blueberry1!@cluster0.yhse6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(mongo_uri, { useNewUrlParser: true, useUnifiedTopology: true });

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { callbackify } = require('util');

var client_id = '7280f1c085e34591ad92ba595cb8abe9'; // Your client id
var client_secret = 'e065afc223554b009ac70dc6d3989664'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var obj = {
  table: []
};

var track_ids = [];

const fs = require('fs');

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          const data = JSON.stringify(body, null, 4);
          obj.table.push(body);
          console.log(body);
          fs.writeFile('data.json', data, 'utf8', function(err) {
            if (err) throw err;
          });

        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/playlists', function(req, res) {
  // requesting access token from refresh token
  //const fs = require('fs');
  var refresh_token = req.query.refresh_token;
  var access_token = req.query.access_token;
  var id = req.query.id;
  console.log("ID:  " + id);
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    json: true
  };
  request.post(authOptions, function(error, response, body) {
    if (!error) {
      var options = {
        url: 'https://api.spotify.com/v1/me/playlists', // + id + '/playlists',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };
      // use the access token to access the Spotify Web API
      request.get(options, function(error, response, body) {
        console.log(body);

        obj.table.push(body);
        playlist_data = JSON.stringify(obj, null, 4);
        //send playlist_data to db

        var parsed = JSON.parse(playlist_data);
        var item_arr = obj.table[0]['items'];
        var i;
        for (i = 0; i < item_arr[0].length(); i++) {
          track_ids.push(item_arr[0]['id']);
          console.log("ID: ", obj.table[0][2].items[0][i].id);
        }        
        fs.writeFile('data.json', playlist_data, 'utf8', function(err) {
          if (err) throw err;
        });
      });
    }
  });
});


app.get('/tracks', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var access_token = req.query.access_token;
  var id = req.query.id;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    json: true
  };

  var jsonOBJ = JSON.parse(obj);


  request.post(authOptions, function(error, response, body) {
    if (!error) {
      var options = {
        url: 'https://api.spotify.com/v1/playlists/' + id + '/tracks',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };
      // use the access token to access the Spotify Web API
      request.get(options, function(error, response, body) {
        //console.log(body);
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
