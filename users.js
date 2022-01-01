const express = require('express')
const StatusCodes = require('http-status-codes').StatusCodes;
const package = require('./package.json');
const uuid = require('uuid'); //for unique id
const argon2 = require("argon2"); // for hashing
const fs = require('fs');
const path = require('path');
const moment = require('moment');
var db = require('./DB');

const status_enum = Object.freeze( {
	created : "created",
	active : "active",
	suspended: "suspended",
	deleted : "deleted"
});


db.createDataBase();
let g_users = db.getUsers();
// let g_users = 
// [ {	
// 	id:1, 
//     name: 'Root admin',
//     email:"admin@gmail.com",
//     password: '$argon2i$v=19$m=512,t=2,p=2$aI2R0hpDyLm3ltLa+1/rvQ$LqPKjd6n8yniKtAithoR7A',
//     token: "",
//     status: "active"
// } ];


function getTokenFromRequest(req){
		
	try{
		return JSON.parse(req.headers.authorization).token;
	}
	catch{
		return undefined;
	}
}

exports.list_users = async function ( req, res) 
{
	let check = await auth_admin( req, res) ;
	if(check == "admin"){
		const display = g_users.filter(user => user.status != status_enum.deleted);
		res.send(  JSON.stringify(display) );   
	}
}

exports.get_not_deleted_users = function() {
	return g_users.filter(user => user.status != status_enum.deleted); 
}

//for outside use - calls the inner func
exports.authenticate_admin = function (req,res){
	return auth_admin(req,res);
}

//for inner file use
function auth_admin(req,res){	
	try{
		const token = getTokenFromRequest(req);
		

		if (!token)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send("Missing token in request")
		return "no token";
	}
	if(token != g_users[0].token){
		res.status( StatusCodes.UNAUTHORIZED );
		res.send( "Only admin can access")
		return "not admin";
	}
	else{
		return "admin";
	}
	}
	catch( err ){
		res.status(StatusCodes.BAD_REQUEST  )
		res.send("Error: token in an ivalid format")
		return "cant parse";
	}
	
	//const token = req.body.token;

	
}

exports.get_user = function ( req, res )
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

exports.ask_to_activate = function ( req, res )
{
	try{
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
	catch(e){
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Unable to send activation request");
		return;
	}
	
}

exports.find_user_by_token = function ( req, res )
{
	const token = getTokenFromRequest(req);

	if (!token)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send("Missing token in request")
		return "no token";
	}
	const user =  g_users.find( user =>  user.token == token )
	if ( !user)
	{
		res.status( StatusCodes.NOT_FOUND );
		res.send( "No such user")
		return;
	}
	return user;   
}

exports.find_user_by_id = function ( req, res )
{
	try{
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
		return user;   
	}
	catch{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "No such user")
		return;
	}

	
}

exports.delete_user = async function ( req, res )
{
	let check = await auth_admin(req, res);
	if(check == "admin")
	{
		try{
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
			const user = g_users[idx];
			user.status = status_enum.deleted;
			
			//updateDbPromise = db.updateUser(user);
			res.send(  JSON.stringify( `deleted user with id ${id}` ) );   
	
			db.updateUser(user);			
		}
		catch(e){
			console.log("error deleting user:" , e);
			res.status(StatusCodes.BAD_REQUEST);
			res.send("error : unable to delete user");
		}
		
	}
}

exports.create_user = async function ( req, res )
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

	//test if email already used
	let emailIndex = g_users.findIndex( user => email == user.email);
	if(emailIndex >= 0){
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Email already in use");
		return;
	}

	if (!password)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Missing password in request")
		return;
	}

	//create user details
	let user_id = g_users.length +1 ;
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
	
	db.addUserToDB(new_user);	
}


async function argon2Async( prehashedPassword)
{	
	hashPromise = argon2.hash(prehashedPassword);
	return hashPromise;
}


exports.update_user = function ( req, res )
{
	try{
		const id =  parseInt( req.params.id );

		if ( id <= 0 || id == NaN)
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
		
		db.updateUser(user);		
	}
	catch(e){
		console.log("error updating user: ", e);
	}
}

exports.update_user_state = async function ( req, res )
{
	let check = auth_admin(req, res);
	if(check == "admin")
	{
		try{
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

				let user_status;
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
				
				db.updateUser(user);
			}
		}
		catch{

		}
	}
}


exports.login_user = function ( req, res )
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
	let user_list = g_users;
	const user = user_list.find(( curr_user ) => email === curr_user.email)
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
				}
				else{
					console.log("logged in");
				}
				user.token = authentication_key;
			 	res.send(JSON.stringify({ token: authentication_key })); 
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

exports.logout_user = function (req,res)
{
	const token = getTokenFromRequest(req);

	if (!token)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send("Missing token in request")
		return "no token";
	}
	const user =  g_users.find( user =>  user.token == token )
	if ( !user)
	{
		res.status( StatusCodes.NOT_FOUND );
		res.send( "No such user")
		return;
	}
  
	//give random unknown token
	user.token = uuid.v4();
	res.status( StatusCodes.OK);
	res.send(`logged out ${user.name}`);
}


