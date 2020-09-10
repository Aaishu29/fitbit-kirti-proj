var express = require('express');
var app     = express();
var config  = require( './config/app.json' );
var fs      = require( 'fs' );

var Fitbit  = require( 'fitbit-oauth2' );
const port = process.env.PORT || 4000;
const path = require('path')


function connection_on(token){
	const { Connection, Request } = require("tedious");

	// Create connection to database
	const config1 = {
	  authentication: {
	    options: {
	      userName: "ubilab", // update me
	      password: "KimVicente01!" // update me
	    },
	    type: "default"
	  },
	  server: "ubilab-data.database.windows.net", // update me
	  options: {
	    database: "fitbit_db", //update me
	    encrypt: true
	  }
	};

	const connection = new Connection(config1);

	
	connection.on("connect", err => {
	  if (err) {
	    console.error(err.message);
	  } else {
	    queryDatabase();
	  }
	});

	function queryDatabase() {
	  
	  access_token = String(token.access_token)
	  refresh_token = String(token.refresh_token)
	  expires_in = parseInt(token.expires_in)
	  expires_at = String(token.expires_at)
	  scope = String(token.scope)
	  token_type = String(token.token_type)
	  user_id = String(token.user_id)
	  //console.log("INSERT INTO user_credentials VALUES('"+access_token+"','"+refresh_token+"',"+expires_in+",'"+scope+"','"+token_type+"','"+user_id+"','"+expires_at+"')CREATE TABLE user_"+user_id+"(date varchar(255), heartrate varchar(255))")


	  // Read all rows from table
	  const request = new Request(
	    "INSERT INTO user_credentials(access_token,refresh_token,expires_in,scope,token_type,user_id,expires_at,status) VALUES('"+access_token+"','"+refresh_token+"',"+expires_in+",'"+scope+"','"+token_type+"','"+user_id+"','"+expires_at+"','Consent')",
	    (err, rowCount) => {
	      if (err) {
	      	console.log(err)
	        console.error(err.message);
	      } else { 
	        console.log('${rowCount} row(s) returned');
	      }
	    }
	  );

	  connection.execSql(request);
	}
}
// Attempt to connect and execute queries if connection goes through

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/main.html')));


app.get('/thankyou', (req, res) => res.sendFile(path.join(__dirname + '/thank_you.html')));

// Simple token persist functions.
//
var tfile = 'fb-token.json';
var persist = {
    read: function( filename, cb ) {
        fs.readFile( filename, { encoding: 'utf8', flag: 'r' }, function( err, data ) {
            if ( err ) return cb( err );
            try {
                var token = JSON.parse( data );
                cb( null, token );
            } catch( err ) {
                cb( err );
            }
        });
    },
    write: function( filename, token, cb ) {
        console.log( 'persisting new token:', JSON.stringify( token ) );
        fs.writeFile( filename, JSON.stringify( token ), cb );
        connection_on(token)
    }
};

// Instanciate a fitbit client.  See example config below.
//
var fitbit = new Fitbit( config.fitbit ); 

// In a browser, http://localhost:4000/fitbit to authorize a user for the first time.
//
app.get('/fitbit', function (req, res) {
    res.redirect( fitbit.authorizeURL() );
});

// Callback service parsing the authorization token and asking for the access token.  This
// endpoint is refered to in config.fitbit.authorization_uri.redirect_uri.  See example
// config below.
//
app.get('/fitbit_auth_callback', function (req, res, next) {
    var code = req.query.code;
    fitbit.fetchToken( code, function( err, token ) {
        if ( err ) return next( err );
        
        // persist the token
        persist.write( tfile, token, function( err ) {
            if ( err ) return next( err );
        });
        
    });
    res.sendFile(path.join(__dirname + '/thank_you.html'))
});


app.listen(port);


