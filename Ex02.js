// External modules
const express = require('express')
const StatusCodes = require('http-status-codes').StatusCodes;
const package = require('./package.json');
const uuid = require('uuid'); //for unique id
const argon2 = require("argon2"); // for hashing
const fs = require('fs');
const path = require('path');
const moment = require('moment');

var posts = require('./posts');
var messages = require('./messages')
var users = require('./users')
var db = require('./DB');


const app = express();
// const status_enum = Object.freeze( {
// 	created : "created",
// 	active : "active",
// 	suspended: "suspended",
// 	deleted : "deleted"
// });
let  port = 5001;
// const dbDir =   path.join(__dirname , '/database');
// const usersDBFile =  path.join(dbDir , '/users.json');
// const postsDBFile =  path.join(dbDir , '/posts.json');
// const messagesDBDir =  path.join(dbDir , '/messages');


// async function get_data()
// {
// 	fs.mkdir(dbDir, {recursive: true }, ()=> { console.log(`Created a folder at:${dbDir}`);} );
// 	fs.mkdir(messagesDBDir,{recursive : true},()=> { console.log(`Created a folder at:${messagesDBDir}`);} );

// 	fs.readFile(usersDBFile, (err,fd)=> {
// 			//console.log(fd);	
			
// 			if(err) // file doesnt exist
// 			{
// 				fs.writeFile(usersDBFile, JSON.stringify(db.users_list), ()=> {console.log("Creating File")} );
// 			}
// 			else
// 			{
// 				try{				
// 					db.users_list = JSON.parse(fd)
// 				}
// 				catch(e){
// 					console.log("failed to parse usersDB.json", e);
// 				}
// 			}
// 		} );

// 	// fs.open(usersDBFile, 'r' , (err,fd)=> {
// 	// 	console.log(fd);	
		
// 	// 	if(err) // file doesnt exist
// 	// 	{
// 	// 		fs.writeFile(usersDBFile, JSON.stringify(db.users_list), ()=> {console.log("Creating File")} );
// 	// 	}
// 	// 	else
// 	// 	{
// 	// 		try{				
// 	// 			db.users_list = JSON.parse(fd)
// 	// 		}
// 	// 		catch(e){
// 	// 			console.log("failed to parse usersDB.json", e);
// 	// 		}
// 	// 	}
// 	// } );
	
// 	//same for Posts & messages
// }



// General app settings
const set_content_type = function (req, res, next) 
{
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	next()
}

app.use( set_content_type );
app.use(express.json());  // to support JSON-encoded bodies
app.use(express.urlencoded( // to support URL-encoded bodies
{  
  extended: true
}));



// // User's table
// let db.users_list = [ {id:1, 
// 				name: 'Root admin',
//  				email:"admin@gmail.com",
// 				password: '$argon2i$v=19$m=512,t=2,p=2$aI2R0hpDyLm3ltLa+1/rvQ$LqPKjd6n8yniKtAithoR7A',
// 				token: "",
// 				status: "active"
// 				} ];
 				
// // const g_posts = [ ];
// //const g_messages = [ ];


// API functions

// Version 
function get_version( req, res) 
{
	const version_obj = { version: package.version, description: package.description };
	res.send(  JSON.stringify( version_obj) );   
}



// Routing
const router = express.Router();

//user routs
router.get('/version', (req, res) => { get_version(req, res )  } )
// router.post('/users', (req, res) => { create_user(req, res )  } )
// router.put('/user/(:id)', (req, res) => { update_user(req, res )  } )
// router.get('/user/(:id)', (req, res) => { get_user(req, res )  })

// router.post('/user/login', (req, res) => { login_user(req, res )  })
// //only admin
// router.get('/users', (req, res) => { list_users(req, res )  } )
// router.delete('/user/(:id)', (req, res) => { delete_user(req, res )  })
// router.put('/user/state/(:id)', (req, res) => { update_user_state(req, res )  } )
router.post('/users', users.create_user )
router.put('/user/(:id)',  users.update_user)
router.get('/user/(:id)',  users.get_user)

router.post('/user/login',  users.login_user)
//only admin
router.get('/users', users.list_users )
router.delete('/user/(:id)',  users.delete_user)
router.put('/user/state/(:id)', users.update_user_state )





//posts routs
router.post('/posts', posts.create_post )
router.get('/posts', posts.get_posts )
router.delete('/post/(:id)', posts.delete_post )

//messagesRouts
// router.post('/message/(:id)', (req, res) => { send_message(req, res )  } )
// router.post('/messages', (req, res) => { send_messages(req, res )  } )
// router.get('/messages/(:id)', (req, res) => { get_messages(req, res )  } )
router.post('/message/(:id)', messages.send_message)
router.post('/messages',  messages.send_messages)
router.get('/messages/(:id)', messages.get_messages )





app.use('/api',router)



// Init 
db.get_data;
let msg = `${package.description} listening at port ${port}`
app.listen(port, () => { console.log( msg ) ; })

