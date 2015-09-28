//Require express modules
var express = require('express');
var app = express();

// Require MongoDb
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/users');

var bodyParser = require('body-parser');
var morgan = require('morgan');
var port = process.env.PORT || 8080
var User = require('./app/models/user');
var jwt = require('jsonwebtoken');

// App Configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var superSecret = 'ilovescotchscotchyscotchscotch';

// APP CORS configuration
app.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

	next();
});

// Logging
app.use(morgan('dev'));


app.get('/', function(req, res){
	res.send('Welcome to the CRM First page');
});

var apiRouter = express.Router();

// Check to make sure a user with that username exists
// Check to make sure that the user has the correct password (by comparing their password to the hashed one saved in the database) 
// Create a token if all is well

apiRouter.post('/authenticate', function(req, res){

	User.findOne({username: req.body.username }).select('name username password').exec(function(err, user){
		if(err){
			throw err;
		}

		if(!user){
			res.json({
				success: false,
				message: 'Authentication failed, User not found!!'
			});
		}else if(user){
			var validPassword = user.comparePassword(req.body.password);

			if(!validPassword){
				res.json({
					success: false,
					message: 'Password you typed is wrong!!'
				})
			}else{
				var token = jwt.sign({
					name: user.name,
					username: user.username},superSecret,{expiresInMinutes: 1440}
				);

				res.json({
					success: true,
					message: 'enjoy your token',
					token: token
				})
			}
		}
	});
});

apiRouter.use(function(req, res, next){
	console.log("Somebody just came to our app!");
	next();
});

apiRouter.get('/', function(req, res){
	res.json({ message: 'hooray! welcome to our api!' });
});


apiRouter.post('/users', function(req, res){
	var user = new User();

	user.name = req.body.name;
	user.username = req.body.username;
	user.password = req.body.password;

	user.save(function(err){
		if(err){
			if(err.code === 11000){
				return res.json({success: false, message: 'User already exists'});
			}else{
				return res.send(err);
			}
		}

		res.send({message: 'User Created'});
	})
});

apiRouter.get('/users', function(req, res){
	var users = User.find(function(err, users){
		if(err){
			return res.send(err);
		}

		res.json(users);
	})
});

apiRouter.route('/users/:id')
		.get(function(req, res){
			User.findById(req.params.id, function(err, user){
				if(err){
					return res.send(err);
				}

				res.json(user);

			})
		})
		.put(function(req, res){
			User.findById(req.params.id, function(err, user){
				uName = req.body.username;
				nName = req.body.name;
				pwd = req.body.password;
				if(uName) user.username = uName;
				if(nName) user.name = nName;
				if(pwd) user.password = pwd;

				user.save(function(err){
					if(err){
						return res.send(err);
					}

					res.json(user);
				})
			})
		})
		.delete(function(req, res){
			User.findById(req.params.id, function(err, user){
				user.remove(function(err){
					if(err){
						return res.send(err);
					}

					res.json({message: 'Successfully Deleted!'});
				})
			});
		})


app.use('/api', apiRouter);

app.listen(port);
console.log('Magic happens on port ' + port);
