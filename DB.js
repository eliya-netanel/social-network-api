const fs = require('fs');
const path = require('path');

// DataBase Info
const dbDir =   path.join(__dirname , '/database');
const usersDBFile =  path.join(dbDir , '/users.json');
const postsDBFile =  path.join(dbDir , '/posts.json');
const messagesDBFile =  path.join(dbDir , '/messages.json');


const initialUser = 
[ {	
	id:1, 
    name: 'Root admin',
    email:"admin@gmail.com",
    password: '$argon2i$v=19$m=512,t=2,p=2$aI2R0hpDyLm3ltLa+1/rvQ$LqPKjd6n8yniKtAithoR7A',
    token: "",
    status: "active"
} ];


createdatabase();
let g_users = getusers();
let g_posts = getposts();
let g_messages = getmessages();



function createdatabase()
{
	//if not exist : create database directories
	fs.mkdir(dbDir, {recursive: true } , (err) => { if(err){ console.log(err) }});	

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

exports.createDataBase = createdatabase();

// async function addItemToDB(DbName,objectToAdd)
// {
// 	fs.readFile(DbName, (err,data) => {
// 		if(data)
// 		{
// 			try{
// 				let fileContent = JSON.parse(data);
// 				fileContent.push(objectToAdd);
// 				fs.writeFile(DbName, JSON.stringify(fileContent), (err) => { if(err){console.log(err);}});
// 			}
// 			catch{
// 				let fileContent = [];
// 				fileContent.push(objectToAdd);
// 				fs.writeFile(DbName, JSON.stringify(fileContent), (err) => { if(err){console.log(err);}});
// 			}			
// 		}
// 		else if(err){
// 			console.log("Error:", DbName ,err);
// 		}
// 	})
// }

function addItemToDBSync(dbName,dbCollection,objectToAdd){
	try{
		dbCollection.push(objectToAdd);
		fs.truncateSync(dbName,0);
		fs.writeFileSync(dbName,JSON.stringify(dbCollection));
	}
	catch{
		console.log("undable to add item to DB:",objectToAdd);
	}

}

exports.addUserToDB = async function(user)
{
	//await addItemToDB(usersDBFile,user);
	addItemToDBSync(usersDBFile,g_users,user);
}

exports.addPostToDB = async function(post)
{
	//await addItemToDB(postsDBFile,post);
	addItemToDBSync(postsDBFile,g_posts,post);
}

exports.addMessageToDB = async function(message)
{
	//await addItemToDB(messagesDBFile,message);
	addItemToDBSync(messagesDBFile,g_messages,message);
}


function getDbItemsSync(dbName)
{
	try{
		let fileContent = JSON.parse(fs.readFileSync(dbName));
		return fileContent;
	}
	catch{
		return [];
	}
}

function getusers()
{
	return getDbItemsSync(usersDBFile);
}
exports.getUsers = getusers();

function getposts()
{
	return getDbItemsSync(postsDBFile); 
}

exports.getPosts = getposts();

function getmessages()
{
	return getDbItemsSync(messagesDBFile);
}

exports.getMessages = getmessages();


function updateDbItem(dbName,dbCollection,updatedItem){
	try{
		let index = dbCollection.findIndex( currItem => currItem.id == updatedItem.id );
		if(index < 0){
			console.log("item doesnt exist");
		}
		dbCollection[index] = updatedItem;
		fs.truncateSync(dbName,0);
		fs.writeFileSync(dbName,JSON.stringify(dbCollection));
	}
	catch(e){
		console.log("error updating file:", e);
	}
}


// function updateDbItem(dbName,updatedItem)
// {
// 	try{
// 		fs.readFile(dbName, (err,data) => {
// 			if(data)
// 			{
// 				try{					
// 					let items = JSON.parse(data);					
// 					let index = items.findIndex( currItem => currItem.id == updatedItem.id );
// 					items[index] = updatedItem;
		
// 					fs.writeFile(dbName, JSON.stringify(items), (err) => { if(err){console.log(err);}});
// 				}
// 				catch( e ){
// 					console.log("Error: unable to update: ", dbName, e);
// 				}
// 			}
// 			else if(err)
// 			{
// 				console.log("Error: update : ", dbName, err);
// 			}
// 		})
// 	}
// 	catch(e){
// 		console.log("Error: updating file : ", dbName, e);
// 	}
// }


exports.updateUser = async function(user)
{
	updateDbItem(usersDBFile,g_users, user);
}

exports.updatePost = async function(post)
{
	updateDbItem(postsDBFile, g_posts ,post);
}

exports.get_g_users = function(){
	return g_users;
}

exports.get_g_posts = function(){
	return g_posts;
}

exports.get_g_messages = function(){
	return g_messages;
}