const {Client} = require('pg');

const client = new Client({
    host: "csdb9q88fa8c73900h00-a.frankfurt-postgres.render.com",
    user: "dbwebprojekt_user",
    port: 5432,
    password: "gXdmvhq6OHu6LkW8ZUevRRCcPdAX6rd2",
    database: "dbwebprojekt"
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