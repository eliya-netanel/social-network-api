//messages
const express = require('express')
const StatusCodes = require('http-status-codes').StatusCodes;
const package = require('./package.json');
const uuid = require('uuid'); //for unique id
const argon2 = require("argon2"); // for hashing
const fs = require('fs');
const path = require('path');
const moment = require('moment');

var db = require('./DB');
var users = require('./users');

const g_messages = [ ];


exports.send_message = function ( req, res )
{
	const id =  parseInt( req.params.id );
	const token = req.body.token;
	const text = req.body.text;

	if ( id <= 0)
	{
		res.status( StatusCodes.BAD_REQUEST );
		res.send( "Bad id given")
		return;
	}

	//find sendee
	const recipient = users.find_user_by_id(req, res);
	const idx = recipient.id;
//	const idx =  g_users.findIndex( user =>  user.id == id )
	if ( idx < 0 )
	{
		res.status( StatusCodes.NOT_FOUND );
		res.send( "No such user")
		return;
	}

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

	//find sender 
	const sender = users.find_user_by_token(req, res);
	//const sender = g_users.find(( curr_user ) => token === curr_user.token)
	if(sender == undefined){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("Couldn't find user with key")
		return
	}
	
	//create post details
	let message_id = g_messages.length+1;
	let message_creationDate = moment().format('DD-MM-YYYY');
	let message_text = text;
	let message_sender_id = sender.id;
	let message_recipient_id = idx;

	//add message
	const new_message = { 	message_id: message_id , 
						sender_id: message_sender_id, 
						recipient_id: message_recipient_id,
						creation_date: message_creationDate,
						text: message_text	} ;
	g_messages.push( new_message);
	
	res.send(  JSON.stringify( new_message) );   
};

exports.send_messages = async function (req, res) {

    //problem??
	let check = users.authenticate_admin(req, res);
	const num_of_recipients = 0;
	if(check == "admin"){
		const text = req.body.text;

		if (!text)
		{
			res.status( StatusCodes.BAD_REQUEST );
			res.send( "Missing text in request")
			return;
		}
		//let message = {}
		let message_creationDate = moment().format('DD-MM-YYYY');
		let message_text = text;
		let message_sender_id = 0;
		
		//get not deleted users 
		const g_users = users.get_not_deleted_users();

		g_users.forEach(user => {
			//create message details
			let message_id = g_messages.length+1;
			let message_recipient_id = user.id;
			//add message
			const new_message = { 	message_id: message_id , 
								sender_id: message_sender_id, 
								recipient_id: message_recipient_id,
								creation_date: message_creationDate,
								text: message_text	} ;
			g_messages.push( new_message);
			
			console.log(`user ${user.id} got message`);	
			// if(message_recipient_id = g_users[g_users.length-1].id)
			// {
			// 	message = new_message;
			// }
		});
		num_of_recipients = g_users.length;
		//		res.send(  JSON.stringify(message)); 
		//	+ `sent successfully to ${g_users.length -1}`) );  
	}
	res.send(  JSON.stringify(`sent successfully to ${num_of_recipients} users`)); 
}

// function get_new_message_id()
// {
// 	let max_id = 0;
// 	g_messages.forEach(
// 		item => { max_id = Math.max( max_id, item.id) }
// 	)

// 	return max_id + 1;
// }

exports.get_messages = function (req,res){
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

	//find user
	const user = users.find_user_by_token(req,res);
	//const user = g_users.find(( curr_user ) => token === curr_user.token)
	if(user == undefined){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("no user with key")
		return
	}
	if(user.token != token){
		res.status( StatusCodes.BAD_REQUEST);
		res.send("only recipient can see mmesages")
		return
	}

	const filtered = g_messages.filter(message => user.id == message.recipient_id);
	res.send(  JSON.stringify( filtered) );   
}

exports.send_activation_msg = function(req,res){
	const user = users.find_user_by_id(req,res);

	let message_id = g_messages.length+1;
	let message_creationDate = moment().format('DD-MM-YYYY');
	let message_text = "please make me an active user";
	let message_sender_id = user.id;
	let message_recipient_id = 1;

	//add message
	const new_message = { 	message_id: message_id , 
						sender_id: message_sender_id, 
						recipient_id: message_recipient_id,
						creation_date: message_creationDate,
						text: message_text	} ;
	g_messages.push( new_message);
	
	res.send(  JSON.stringify( new_message) );
}