const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Console } = require('console');

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

exports.createDataBase = function()
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

async function addItemToDB(DbName,objectToAdd)
{
	fs.readFile(DbName, (err,data) => {
		if(data)
		{
			try{
				let fileContent = JSON.parse(data);
				fileContent.push(objectToAdd);
				fs.writeFile(DbName, JSON.stringify(fileContent), (err) => { if(err){console.log(err);}});
			}
			catch{
				let fileContent = [];
				fileContent.push(objectToAdd);
				fs.writeFile(DbName, JSON.stringify(fileContent), (err) => { if(err){console.log(err);}});
			}			
		}
		else if(err){
			console.log("Error:", DbName ,err);
		}
	})
}

function addItemtoDBSync(dbName,objectToAdd){
	try{
		const fileContent = fs.readFileSync(dbName, {encoding:'utf8', flag:'r'});
		itemsCollection = JSON.parse(fileContent);
		itemsCollection.push(objectToAdd);

		fs.writeFile(dbName, JSON.stringify(itemsCollection), (err) => { if(err){console.log(err);}});
	}
	catch{
		itemsCollection = [];
		itemsCollection.push(objectToAdd);

		fs.writeFile(dbName, JSON.stringify(itemsCollection), (err) => { if(err){console.log(err);}});
	}
	

}

exports.addUserToDB = async function(user)
{
	//await addItemToDB(usersDBFile,user);
	addItemtoDBSync(usersDBFile,user);
}

exports.addPostToDB = async function(post)
{
	//await addItemToDB(postsDBFile,post);
	addItemToDBSync(postsDBFile,post);
}

exports.addMessageToDB = async function(message)
{
	//await addItemToDB(messagesDBFile,message);
	addItemtoDBSync(messagesDBFile,message);
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



exports.getUsers = function()
{
	return getDbItemsSync(usersDBFile);
}

exports.getPosts = function()
{
	return getDbItemsSync(postsDBFile); 
}

exports.getMessages = function()
{
	return getDbItemsSync(messagesDBFile);
}


function updateDbItem(dbName,updatedItem)
{
	try{
		fs.readFile(dbName, (err,data) => {
			if(data)
			{
				try{					
					let items = JSON.parse(data);					
					let index = items.findIndex( currItem => currItem.id == updatedItem.id );
					items[index] = updatedItem;
		
					fs.writeFile(dbName, JSON.stringify(items), (err) => { if(err){console.log(err);}});
				}
				catch( e ){
					console.log("Error: unable to update: ", dbName, e);
				}
			}
			else if(err)
			{
				console.log("Error: update : ", dbName, err);
			}
		})
	}
	catch(e){
		console.log("Error: updating file : ", dbName, e);
	}
}


exports.updateUser = async function(user)
{
	updateDbItem(usersDBFile, user);
}

exports.updatePost = async function(post)
{
	updateDbItem(postsDBFile, post);
}

