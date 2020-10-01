var config = require( './config/app' );
var fs     = require( 'fs' );
var Fitbit = require( 'fitbit-oauth2' );

// Simple token persist code
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

// Instanciate the client
//
var fitbit = new Fitbit( config.fitbit );
results=[]
counter1=0
counter2=0
res1=[]
tok_en=[]
function collect_tokens(){
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

    // Attempt to connect and execute queries if connection goes through
    connection.on("connect", err => {
      if (err) {
        console.error(err.message);
      } else {
        queryDatabase();
      }
    });

    function queryDatabase() {
      console.log("Reading rows from the Table...");

      // Read all rows from table
      const request = new Request(
        "SELECT * from user_credentials",
        (err, rowCount) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log(`${rowCount} row(s) returned`);
          }
        }
      );

      request.on("row", columns => {
        var token={}
        columns.forEach(column => {
          x=column.metadata.colName
          y=column.value
          token[x] = y
          
        });
        console.log(token)
        heartrate=[]
        h_time=[]
        steps=[]
        sleep=[]
        s_time=[]
        sleep_time=[]
        var new_token={}
        // Set the client's token
        fitbit.setToken( token );

        // Make an API call
        fitbit.request({
            uri: "https://api.fitbit.com/1/user/-/activities/heart/date/2020-07-25/1min.json",
            method: 'GET',
        }, function( err, body, token ) {
            if ( err ) {
                console.log( err );
                process.exit(1);
            }
            console.log( body['activities-heart-intraday'] );
            heartrate.append(body['activities-heart-intraday']['dataset']['value'])
            h_time.append(body['activities-heart-intraday']['dataset']['time'])
            new_token = token
            // If the token arg is not null, then a refresh has occured and
            // we must persist the new token.
        });
        fitbit.request({
            uri: "https://api.fitbit.com/1/user/-/activities/steps/date/2020-07-25/1min.json",
            method: 'GET',
        }, function( err, body, token ) {
            if ( err ) {
                console.log( err );
                process.exit(1);
            }
            console.log( body['activities-steps-intraday'] );
            steps.append(body['activities-steps-intraday']['dataset']['value'])
            s_time.append(body['activities-steps-intraday']['dataset']['time'])

            // If the token arg is not null, then a refresh has occured and
            // we must persist the new token.
        });
        fitbit.request({
            uri: "https://api.fitbit.com/1/user/-/sleep/date/2020-07-25.json",
            method: 'GET',
        }, function( err, body, token ) {
            if ( err ) {
                console.log( err );
                process.exit(1);
            }
            console.log( body['sleep'][0]['minuteData']);
            sleep.append(body['sleep'][0]['minuteData']['value'])
            sleep_time.append(body['sleep'][0]['minuteData']['time'])

            // If the token arg is not null, then a refresh has occured and
            // we must persist the new token.
        });
      

      for (var i=0;i<length(h_time);i++){
        uid = String(new_token.user_id)
        date = new Date("2015-07-25");
        x1=h_time[i]
        y1=heartrate[i]
        if(h_time[i]==s_time[counter1]){
            y2=steps[counter1]
            counter1=counter1+1
        }
        else{
            y2=-99
        }
        if(h_time[i]==sleep_time[counter2]){
            y3=sleep[counter2]
            counter2=counter2+1
        }
        else{
            y3=-99
        }
        res1.append([uid,date,x1,y1,y2,y3])
      }
      access_token = String(new_token.access_token)
      refresh_token = String(new_token.refresh_token)
      expires_in = parseInt(new_token.expires_in)
      expires_at = String(new_token.expires_at)
      scope = String(new_token.scope)
      token_type = String(new_token.token_type)
      user_id = String(new_token.user_id)
      tok_en.append([access_token,refresh_token,expires_in,scope,token_type, user_id, expires_at,"Consent"])

      });
            // for (var i = 0; i < 10; i++) {
      // console.log(results.rows[i]);
      // result += results.rows[i] + "\n";
      // }
      connection.execSql(request);
    }
    console.log(tok_en)
    console.log(res1)

}

app.get('/fitbit_auth_callback', function (req, res, next) {
    collect_tokens(function(){
        console.log(r.length)
    })  
    res.sendFile(path.join(__dirname + '/thank_you.html'))
});




//let the user enter the date and we retreive the data for that day.
//update the refresh token and access token data as well.