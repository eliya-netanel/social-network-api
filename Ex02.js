// External modules
const express = require('express')
const StatusCodes = require('http-status-codes').StatusCodes;
const package = require('./package.json');
const uuid = require('uuid'); //for unique id
const argon2 = require("argon2"); // for hashing
const fs = require('fs');
const path = require('path');
const moment = require('moment');


const app = express();
const status_enum = Object.freeze( {
	created : "created",
	active : "active",
	suspended: "suspended",
	deleted : "deleted"
});
let  port = 5001;
const dbDir =   path.join(__dirname , '/database');
const usersDBFile =  path.join(dbDir , '/users.json');
const postsDBFile =  path.join(dbDir , '/posts.json');
const messagesDBDir =  path.join(dbDir , '/messages');


async function get_data()
{
	fs.mkdir(dbDir, {recursive: true }, ()=> { console.log(`Created a folder at:${dbDir}`);} );
	fs.mkdir(messagesDBDir,{recursive : true},()=> { console.log(`Created a folder at:${messagesDBDir}`);} );

	fs.readFile(usersDBFile, (err,fd)=> {
			//console.log(fd);	
			
			if(err) // file doesnt exist
			{
				fs.writeFile(usersDBFile, JSON.stringify(g_users), ()=> {console.log("Creating File")} );
			}
			else
			{
				try{				
					g_users = JSON.parse(fd)
				}
				catch(e){
					console.log("failed to parse usersDB.json", e);
				}
			}
		} );

	// fs.open(usersDBFile, 'r' , (err,fd)=> {
	// 	console.log(fd);	
		
	// 	if(err) // file doesnt exist
	// 	{
	// 		fs.writeFile(usersDBFile, JSON.stringify(g_users), ()=> {console.log("Creating File")} );
	// 	}
	// 	else
	// 	{
	// 		try{				
	// 			g_users = JSON.parse(fd)
	// 		}
	// 		catch(e){
	// 			console.log("failed to parse usersDB.json", e);
	// 		}
	// 	}
	// } );
	
	//same for Posts & messages
}



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



// User's table
let g_users = [ {id:1, 
				name: 'Root admin',
 				email:"admin@gmail.com",
				password: '$argon2i$v=19$m=512,t=2,p=2$aI2R0hpDyLm3ltLa+1/rvQ$LqPKjd6n8yniKtAithoR7A',
				token: "",
				status: "active"
				} ];
 				
const g_posts = [ ];


// API functions

// Version 
function get_version( req, res) 
{
	const version_obj = { version: package.version, description: package.description };
	res.send(  JSON.stringify( version_obj) );   
}


async function list_users( req, res) 
{
	let check = await authenticate_admin(req, res);
	if(check == "admin"){
		res.send(  JSON.stringify( g_users) );   
	}
}


function authenticate_admin(req,res){
	const token = req.body.token;

	if (!token)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send("Missing token in request")
		return "no token";
	}
	if(token != admin_key){
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Only admin can access")
		return "not admin";
	}
	else{
		return "admin";
	}
}

function get_user( req, res )
{
	const id =  parseInt( req.params.id );

	if ( id <= 0)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Bad id given")
		return;
	}

	const user =  g_users.find( user =>  user.id == id )
	if ( !user)
	{
		res.status( StatusCodes.NOT_FOUND );
		res.send( "No such user")
		return;
	}

	res.send(  JSON.stringify( user) );   
}

async function delete_user( req, res )
{
	let check = await authenticate_admin(req, res);
	if(check == "admin")
	{
		const id =  parseInt( req.params.id );

		if ( id <= 0)
		{
			res.status( StatusCodes.BAD_REQUEST );
			res.send( "Bad id given")
			return;
		}

		if ( id == 1)
		{
			res.status( StatusCodes.FORBIDDEN ); // Forbidden
			res.send( "Can't delete root user")
			return;		
		}

		const idx =  g_users.findIndex( user =>  user.id == id )
		if ( idx < 0 )
		{
			res.status( StatusCodes.NOT_FOUND );
			res.send( "No such user")
			return;
		}
		g_users.splice( idx, 1 )
		res.send(  JSON.stringify( {}) );   
	}
}

async function create_user( req, res )
{
	const name = req.body.name;
	const email = req.body.email;
	const password = req.body.password;

	if (!name)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing name in request")
		return;
	}

	const twoWordRegex = /[a-zA-Z]+\s+[a-zA-Z]+/g;
	if(!twoWordRegex.test(name))
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing First or Last name");
		return;
	}

	if (!email)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing email in request")
		return;
	}

	const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	if(!emailRegex.test(email))
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Email not formatted correctly");
		return;
	}

	if (!password)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing password in request")
		return;
	}

	//create user details
	let user_id = get_new_user_id();
	let user_hashedpassword = await argon2Async(password);
	let user_creationDate = moment().format('DD-MM-YYYY');
	let user_status = status_enum.created;

	//add user
	const new_user = { 	id: user_id , 
						name: name, 
						email: email, 
						password : user_hashedpassword,
						creation_date: user_creationDate,
						status: user_status	} ;
	g_users.push( new_user  );
	
	res.send(  JSON.stringify( new_user) );   
}


async function argon2Async( prehashedPassword)
{	
	hashPromise = argon2.hash(prehashedPassword);
	return hashPromise;
}


function update_user( req, res )
{
	const id =  parseInt( req.params.id );

	if ( id <= 0)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Bad id given")
		return;
	}

	const idx =  g_users.findIndex( user =>  user.id == id )
	if ( idx < 0 )
	{
		res.status( StatusCodes.NOT_FOUND );
		res.send( "No such user")
		return;
	}

	const name = req.body.name;

	if ( !name)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing name in request")
		return;
	}

	const user = g_users[idx];
	user.name = name;

	res.send(  JSON.stringify( {user}) );   
}


async function update_user_state( req, res )
{
	let check = await authenticate_admin(req, res);
	if(check == "admin")
	{
		const id =  parseInt( req.params.id );
		const new_status = req.body.status;

		if ( id <= 0)
		{
			res.status( StatusCodes.BAD_REQUEST );
			res.send( "Bad id given")
			return;
		}
		if ( id == 1)
		{
			res.status( StatusCodes.FORBIDDEN ); // Forbidden
			res.send( "Can't update root user")
			return;		
		}

		const idx =  g_users.findIndex( user =>  user.id == id )
		if ( idx < 0 )
		{
			res.status( StatusCodes.NOT_FOUND );
			res.send( "No such user")
			return;
		}
		else // found id && not root 
		{
			const user = g_users[idx];

			let user_status;// = status_enum.created;
			switch(new_status){
				case "approve":
					user.status = status_enum.active;
				break;
				case "suspend":
					user.status = status_enum.suspended;
				break;
				case "restore":
					user.status = status_enum.active;
				break
				default:
					res.status( StatusCodes.NOT_FOUND );
					res.send( "Not a valid status")
					return;
			}
			res.send(  JSON.stringify( {user}) );   
		}
	}
}


function login_user( req, res )
{
	console.log("logging in user...");

	const email = req.body.email;
	const password = req.body.password;

	if (!email)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing email in request")
		return;
	}
	if (!password)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing password in request")
		return;
	}

	const user = g_users.find(( curr_user ) => email === curr_user.email)
	if (user != undefined)
	{
		console.log("found user");
		//check password
		const check_pass = argon2.verify(user.password, password).catch(() => {
			throw new Error('Something went wrong. Please try again.')
		   })
		   .then(match => {
			if (match) {
				const authentication_key = uuid.v4();
				if(user.id == 1){
					console.log("logged in as admin");
					//to check later if admin- to delete etc...
					//admin_key = authentication_key;
				}
				else{
					console.log("logged in");
				}
				user.token = authentication_key;
			 	res.send(JSON.stringify(authentication_key)); 
			}
			else{
				res.status( StatusCodes.BAD_REQUEST);
				res.send("Wrong password");
			}})

	}
	else{
		res.status( StatusCodes.BAD_REQUEST);
		res.send("Couldn't find user")
	}
}

function get_new_user_id()
{
	let max_id = 0;
	g_users.forEach(
		item => { max_id = Math.max( max_id, item.id) }
	)

	return max_id + 1;
}

// Routing
const router = express.Router();

//user routs
router.get('/version', (req, res) => { get_version(req, res )  } )
router.post('/users', (req, res) => { create_user(req, res )  } )
router.put('/user/(:id)', (req, res) => { update_user(req, res )  } )
router.get('/user/(:id)', (req, res) => { get_user(req, res )  })

router.post('/user/login', (req, res) => { login_user(req, res )  })
//only admin
router.get('/users', (req, res) => { list_users(req, res )  } )
router.delete('/user/(:id)', (req, res) => { delete_user(req, res )  })
router.put('/user/state/(:id)', (req, res) => { update_user_state(req, res )  } )

//posts routs
router.post('/posts', (req, res) => { create_post(req, res )  } )
router.get('/posts', (req, res) => { get_posts(req, res )  } )
router.delete('/post/(:id)', (req, res) => { delete_post(req, res )  } )




app.use('/api',router)



// Init 
get_data();
let msg = `${package.description} listening at port ${port}`
app.listen(port, () => { console.log( msg ) ; })


//// posts

function create_post( req, res )
{
	const token = req.body.token;
	const text = req.body.text;

	if (!text)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing text in request")
		return;
	}

	if (!token)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing token in request")
		return;
	}

	//find user
	const user = g_users.find(( curr_user ) => token === curr_user.token)
	if(user == undefined){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("Couldn't find user with key")
		return
	}
	if(user.status != status_enum.active){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("only active user can post")
		return
	}
	//create post details
	let post_id = get_new_post_id();
	let post_creationDate = moment().format('DD-MM-YYYY');
	let post_text = text;
	let post_creator_id = user.id;

	//add post
	const new_post = { 	id: post_id , 
						creator_id: post_creator_id, 
						creation_date: post_creationDate,
						text: post_text	} ;
	g_posts.push( new_post);
	
	res.send(  JSON.stringify( new_post) );   
}

function get_new_post_id()
{
	let max_id = 0;
	g_posts.forEach(
		item => { max_id = Math.max( max_id, item.id) }
	)

	return max_id + 1;
}

function get_posts( req, res) 
{
	res.send(  JSON.stringify( g_posts) );   
}

function delete_post( req, res )
{
	const token = req.body.token;
	const id =  parseInt( req.params.id );
	if (!id)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing id in request")
		return;
	}
	if ( id <= 0)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Bad id given")
		return;
	}

	if (!token)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing token in request")
		return;
	}

	//find post
	const post = g_posts.find((curr_post) => id === curr_post.id)
	if(post == undefined){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("Couldn't find post with id")
		return
	}
	//find user
	const user = g_users.find(( curr_user ) => token === curr_user.token)
	if(user == undefined){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("no user with key")
		return
	}
	if(user.id != post.creator_id && user.id != 1){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("only creator can delets post")
		return
	}
	g_posts.splice( post.id, 1 )
	res.send(  JSON.stringify( `deleted post with id ${id}`) );   
}