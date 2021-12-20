const promiseStatus = require('promise-status-async');
const argon2 = require("argon2"); // for hashing

let pssd = "mypassword";
let hashPromise  = argon2.hash(pssd);
//console.log(hashPromise);

hashPromise.isPending = true;

hashPromise.then((value)=>{
    console.log(`i was called from "then": ${value}`);
    value.isPending = false;
})

if (await promiseStatus(hashPromise) === 'pending') {
    console.log("WAT");
}

//setTimeout(()=>{console.log("i was called"), 20000});

// while(hashPromise.isPending){
//     console.log(`Pending: ${hashPromise}`);

// }

//console.log(`Done: ${hashPromise}`);


//let hashPromise2 = argon2.hash(pssd);
//console.log(hashPromise2);

///////////////////
// argon2i = require('argon2-ffi').argon2i;
// let pssd = "mypassword";

// argon2i.hash(pssd, salt).then(hash => {
//     console.log(hash); res.sendStatus(201);
// })







//const argon2 = require("argon2");

async function hashit() {
  try {
    const hash = await argon2.hash("password");
    console.log("try");
    console.log(hash);
   } catch (err) {
    console.log("ERROR " + err);
   }
}

//hashit();