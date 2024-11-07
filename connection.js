const {Client} = require('pg');

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "Damburger1#",
    database: "ranjivosti"
});

const createUser = async(username, password) => {
    const query = 
       `INSERT INTO users(username, password)
                         VALUES('${username}', '${password}')`;
    const values = [username, password];

    try{
        const res = await client.query(query, values);
        console.log("Kreiran korisnik: ", res.rows[0]);
    } catch(err){
        console.error('Greska: ', err);
    }
};

module.exports = client;