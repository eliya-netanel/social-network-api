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
const g_posts = [ ];

const status_enum = Object.freeze( {
	created : "created",
	active : "active",
	suspended: "suspended",
	deleted : "deleted"
});


//// posts
//export const create_post = async (req, res) => 
//export async function create_post( req, res )
exports.create_post = function(req, res)
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

	// //find user
	const user = users.find_user_by_token(req, res);

	//if(!user){}


	// const user = db.users_list.find(( curr_user ) => token === curr_user.token)
	// if(user == undefined){
	// 	res.status( StatusCodes.BAD_REQUEST);
	// 	res.send("Couldn't find user with key")
	// 	return
	// }
	if(user.status != status_enum.active){
		res.status( StatusCodes.BAD_REQUEST);
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
}

exports.get_posts = function ( req, res) 
{
	const display = g_posts.filter(post => post.status != status_enum.deleted);
	res.send(  JSON.stringify(display) );   
}

exports.delete_post = function ( req, res )
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
	const user = users.find_user_by_token(req,res);


	//const user =g_posts.find(( curr_user ) => token === curr_user.token)
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

	//todo - not actualy delete - just display without
	//g_posts.splice( post.id, 1 )
	post.status = status_enum.deleted;
	res.send(  JSON.stringify( `deleted post with id ${id}`) );   
}
