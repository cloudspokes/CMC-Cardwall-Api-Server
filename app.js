
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();
var port = (process.env.VMC_APP_PORT || 3002);
var host = (process.env.VCAP_APP_HOST || 'localhost');

if(process.env.VCAP_SERVICES){
  var env = JSON.parse(process.env.VCAP_SERVICES);
  var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
  var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"",
    "db":"db"
  }
}

var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');

  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}

var mongourl = generate_mongo_url(mongo);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'Fv0rV8Ux8j' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);


// creates a task
app.post('/va/tasks', function(req, res){
	
	
	require('mongodb').connect(mongourl, function(err, conn){
	  conn.collection('tasks', function(err, coll){
	    coll.insert( req.body, {safe:true}, function(err){
			res.writeHead(200, {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*"
			});
			//console.log(JSON.stringify(req.body));
			var body = JSON.stringify(req.body);
			var parsejson = JSON.parse(body);
			console.log('err =  ' + err);
			
			console.log (parsejson);
			var idpos = body.indexOf("_id");
			var bodylen = body.length;
			console.log ('Id at position' + idpos + ' ' + body.substr(idpos + 6) );
			var _id = body.substr(idpos + 6);
			var endpos = _id.indexOf("}");
			
			var parseid = _id.substr(0, endpos - 1);
			console.log (parseid);			
			
			res.end(JSON.stringify([{"status":"SUCCESS"}, {"data":[{"id":parseid}]}]));
	    });
	  });
	}); 
	/*
	console.log('before require');
	require('mongodb').connect(mongourl, function(err, conn){
	    console.log('after connect ');
	  conn.collection('tasks', function(err, coll){
	    console.log ('after collection');
	    coll.insert( req.body, {safe:true}, function(err){
		console.log ('in insert');
			res.writeHead(200, {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*"
			});
			res.end(JSON.stringify("test"));
	    });
	  });
	}); */
 });




// updates a task
app.put('/va/tasks/:task_id', function(req, res){

	var ObjectID = require('mongodb').ObjectID;
	
	require('mongodb').connect(mongourl, function(err, conn){
	 
	  conn.collection('tasks', function(err, coll){
	     
	    coll.findAndModify({'_id':new ObjectID(req.params.task_id)}, [['name','asc']], { $set: req.body }, {}, function(err, document) {
	    
	      res.writeHead(200, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*"
	      });
	      
	      res.end(JSON.stringify([{"status":"SUCCESS"}, {"data":[{"id":req.params.task_id}]}]));
	      
	      
	    });
	    
	  });
	  
	});
	
	

 });


// gets all tasks
app.get('/va/tasks', function(req, res){

	require('mongodb').connect(mongourl, function(err, conn){
	  conn.collection('tasks', function(err, coll){
	    coll.find(function(err, cursor) {
			cursor.toArray(function(err, items) {
				res.writeHead(200, {
				  "Content-Type": "application/json",
				  "Access-Control-Allow-Origin": "*"
				});
				res.end(JSON.stringify(items));
			});
	    });
	  });
	});
});



// delete task
app.delete('/va/tasks/:task_id', function(req, res){

	var ObjectID = require('mongodb').ObjectID;
	
	require('mongodb').connect(mongourl, function(err, conn){
	  conn.collection('tasks', function(err, coll){
	    coll.remove({'_id':new ObjectID(req.params.task_id)}, {safe:true}, function(err, document) {
			res.writeHead(200, {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*"
			});
			res.end(JSON.stringify([{"status":"SUCCESS"}]));
	    });
	  });
	});

 });

app.listen(port, host);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
console.log("Mongodb listening on port %d", mongo['port']);
