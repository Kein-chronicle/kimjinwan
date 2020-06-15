var express = require('express');
var app = express();
var cors = require('cors');

const config = require('./config.js')
const port = process.env.PORT || 3000

const mongoose = require('mongoose')
const morgan = require("morgan")
const bodyParser = require('body-parser')

app.use(cors())

// parse JSON and url-encoded query
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// print the request log on console
app.use(morgan('test'))

// set the secret key variable for jwt
app.set('jwt-secret', config.secret)

app.get('/', function(req, res){
    res.send({'Application name': 'eyedoc-pc-api'});
});

// uploads file path
app.use('/upload', express.static('upload'));

// configure api router
app.use('/api', require('./routes/api'))

// app.get('/user/:userId', function(req, res){
//     res.send('Hello World : ' + req.params.userId );
// });


app.listen(port, function(){
    console.log('Express server has started on port ' + port + " run datetime " + new Date())
})

mongoose.connect(config.mongodbUri, { useUnifiedTopology: true, useNewUrlParser: true,  useFindAndModify: false })
const db = mongoose.connection
db.on('error', console.error)
db.once('open', ()=>{
	console.log('connected to mongodb server')
})