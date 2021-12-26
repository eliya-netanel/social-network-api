// External modules
const express = require('express')
const StatusCodes = require('http-status-codes').StatusCodes;
const package = require('./package.json');
const uuid = require('uuid'); //for unique id
const argon2 = require("argon2"); // for hashing
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const dbDir =   path.join(__dirname , '/database');
const usersDBFile =  path.join(dbDir , '/users.json');
const postsDBFile =  path.join(dbDir , '/posts.json');
const messagesDBDir =  path.join(dbDir , '/messages');

const status_enum = Object.freeze( {
	created : "created",
	active : "active",
	suspended: "suspended",
	deleted : "deleted"
});

exports.get_data = async function ()
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



// User's table
// let g_users = [ {id:1, 
//     name: 'Root admin',
//      email:"admin@gmail.com",
//     password: '$argon2i$v=19$m=512,t=2,p=2$aI2R0hpDyLm3ltLa+1/rvQ$LqPKjd6n8yniKtAithoR7A',
//     token: "",
//     status: "active"
// } ];
     
// exports.users_list = function(req, res){
//       //  res.render('users', { title: 'Users', users: users });
//     return g_users;  
//     };    

//     exports.posts_list = function(req, res){
//         return g_posts;
//     };   

//     exports.messages_list = function(req, res){
//         return g_messages;
//     };   

// const g_posts = [ ];
// const g_messages = [ ];

exports.status_enum_list = function(req, res){
	        return status_enum;
	    };  