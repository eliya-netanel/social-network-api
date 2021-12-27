// External modules
//const express = require('express')
//const StatusCodes = require('http-status-codes').StatusCodes;
//const package = require('./package.json');
//const uuid = require('uuid'); //for unique id
//const argon2 = require("argon2"); // for hashing
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Console } = require('console');

// DataBase Info
const dbDir =   path.join(__dirname , '/database');
const usersDBFile =  path.join(dbDir , '/users.json');
const postsDBFile =  path.join(dbDir , '/posts.json');
const messagesDBFile =  path.join(dbDir , '/messages.josn');


const initialUser = 
[ {	
	id:1, 
    name: 'Root admin',
    email:"admin@gmail.com",
    password: '$argon2i$v=19$m=512,t=2,p=2$aI2R0hpDyLm3ltLa+1/rvQ$LqPKjd6n8yniKtAithoR7A',
    token: "",
    status: "active"
} ];

exports.createDataBase = function()
{
	//if not exist : create database directories
	fs.mkdir(dbDir, {recursive: true }, ()=> { console.log(`Created a folder at:${dbDir}`);} );
	//fs.mkdir(messagesDBDir,{recursive : true},()=> { console.log(`Created a folder at:${messagesDBDir}`);} );

	if(!fs.existsSync(usersDBFile))
	{
		//fs.openSync(usersDBFile,'w');
		fs.writeFileSync(usersDBFile,JSON.stringify(initialUser));
	}
	if(!fs.existsSync(postsDBFile))
	{
		fs.openSync(postsDBFile,'w');
	}
	if(!fs.existsSync(messagesDBFile))
	{
		fs.openSync(messagesDBFile,'w');
	}
}

exports.addUserToDB = async function(user)
{		
	fs.readFile(usersDBFile, (err,data) => {
		if(data)
		{
			//let userJson = JSON.stringify(user);
			let fileContent = JSON.parse(data);
			//fileContent.push(userJson);
			fileContent.push(user);

			fs.writeFile(usersDBFile, JSON.stringify(fileContent));			
		}
		else if(err){
			console.log("Error: addUserToDB : ", err);
		}
	})
}

exports.addPostToDB = async function(post)
{		
	fs.readFile(postsDBFile, (err,data) => {
		if(data)
		{
			//let postJson = JSON.stringify(post);
			let fileContent = JSON.parse(data);
			fileContent.push(post);

			fs.writeFile(postsDBFile, JSON.stringify(fileContent));
		}
		else if(err){
			console.log("Error: addPostToDB : ", err);
		}
	})
}

exports.addMessageToDB = async function(message)
{		
	fs.readFile(messagesDBFile, (err,data) => {
		if(data)
		{
			//let postJson = JSON.stringify(message);
			let fileContent = JSON.parse(data);
			fileContent.push(message);

			fs.writeFile(messagesDBFile, JSON.stringify(fileContent));
		}
		else if(err){
			console.log("Error: addMeesageToDB : ", err);
		}
	})
}

exports.getUsers = function()
{
	return fileContent = JSON.parse(fs.readFileSync(usersDBFile));
}

exports.getPosts = function()
{
	return fileContent = JSON.parse(fs.readFileSync(postsDBFile));
}

exports.getMessages = function()
{
	return fileContent = JSON.parse(fs.readFileSync(messagesDBFile));
}

exports.updateUser() = async function(user)
{
	fs.readFile(usersDBFile, (err,data) => {
		if(data)
		{
			users = JSON.parse(data);
			index = users.findIndex( currUser => currUser.id == user.id );
			users[index] = user;

			await fs.writeFile(usersDBFile, JSON.stringify(users));
		}
		else if(err)
		{
			console.log("Error: updateUser : ", err);
		}
	})
}



