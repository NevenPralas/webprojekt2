const {Client} = require('pg');

const client = new Client({
    host: "dpg-ct0bh6hopnds73aatn60-a.frankfurt-postgres.render.com",
    user: "dbweb_t92a_user",
    port: 5432,
    password: "jGtIJQAWDUJ964c3ikX6I2AQWgujC4Qx",
    database: "dbweb_t92a",
    ssl: {
        rejectUnauthorized: false, 
      }
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