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
//var ex02 = require('./Ex02');

db.createDataBase();
const g_posts = db.getPosts();

const status_enum = Object.freeze( {
	created : "created",
	active : "active",
	suspended: "suspended",
	deleted : "deleted"
});


function getTokenFromRequest(req){
		
	try{
		return JSON.parse(req.headers.authorization).token;
	}
	catch{
		return undefined;
	}
	
}

exports.create_post = function(req, res)
{
	const token = getTokenFromRequest(req);
	
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
	const user = users.find_user_by_token(req, res);
	if(user.status != status_enum.active){
		res.status( StatusCodes.UNAUTHORIZED);
		res.send("only active user can post")
		return
	}

	//create post details
	let post_id = g_posts.length+1;
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
	
	db.addPostToDB(new_post);
}

exports.get_posts = function ( req, res) 
{
	try{
		const user = users.find_user_by_token(req,res);

		const display = g_posts.filter(post => post.status != status_enum.deleted);
		res.send(  JSON.stringify(display) ); 
	}
	catch{
		
	}
	  
}

exports.delete_post = function ( req, res )
{
	//const token = req.body.token;
	const token = getTokenFromRequest(req);
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
	const user = users.find_user_by_token(req,res);
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
	post.status = status_enum.deleted;
	res.send(  JSON.stringify( `deleted post with id ${id}`) );
	
	db.updatePost(post);
}

