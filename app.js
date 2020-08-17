const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// The MongoDB Node.js 3.0 driver requires encoding special characters in the Cosmos DB password. 
//const password = encodeURIComponent('C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==');
const url = `mongodb://ubilab:m3o77TDQPWyHYMJlx9vG64fd9qxjRANkzBrrsXSkCG3I1WYV9JVRi6ENuTpEQzA0xd62NUmHnSRZcU5Kmum4sA==@ubilab.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@ubilab@`;
const dbname = "fitbitdb";
var express = require('express');
var app     = express();
var config  = require( './config/app.json' );
var fs      = require( 'fs' );
var Fitbit  = require( 'fitbit-oauth2' );
const port = process.env.PORT || 4000;
const path = require('path')

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/main.html')));



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


var insertDocument = function(doc,db, callback) {
db.collection('Research1').insertOne( doc, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the research collection.");
    callback();
});
};

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
	    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
            assert.equal(null, err);
            var db = client.db("fitbitdb");
                insertDocument(token,db, function() {
                    console.log("loop entered")
                    client.close();
                    console.log("loop closed")
                    });
            });
    }); 
});


app.listen(port);
