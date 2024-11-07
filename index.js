const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const client = require('./connection.js');

app.set('view engine', 'ejs');

app.listen(8080);

app.use(session({
    store: new (require('connect-pg-simple')(session))({
        pool: client,
        tableName: 'session'
    }),
    secret: 'key that will sign cookie',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,  // Postavlja httpOnly na false
        maxAge: 24 * 60 * 60 * 1000 // Primer: kolačić traje 1 dan
    }
}));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

client.connect();

const isAuth = (req, res, next) => {
    if(req.session.isAuth){
        next();
    }
    else{
        res.redirect('/login');
    }
}


app.get('/', (req, res) => {
    //cisto primjera rada
    console.log(req.session);

    res.render('home');
});

app.get('/xss', (req, res) => {
    res.render('xss', {comment: "", options:"off"});
});

app.post('/xss', async (req, res) => {
    const {options, comment } = req.body;

    const xssPattern = /<[^>]*>/; // Regex za detekciju HTML tagova, npr. <script> ili <img>


    console.log(options);

    if(options == "on"){
        console.log("ON");

        res.cookie('connect.sid', req.session.id, {
            httpOnly: false,
            maxAge: 24*60*60*1000
        });
        res.render('xss', {comment, options});
    }
    else{
        console.log("OFF");

        if (xssPattern.test(comment)) {
            console.log("Detekritan potencijalni XSS napad!");
            return res.status(400).send('Unos sadrži potencijalno opasan kod i nije dozvoljen.');
        }
        
        res.cookie('connect.sid', req.session.id, {
            httpOnly: true,
            maxAge: 24*60*60*1000
        });
        res.render('xss', {comment, options});
    }

    // Prosljeđivanje korisničkog unosa u xss.ejs za prikaz
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { role, username, password } = req.body;

    console.log(role);

    try {
        const result = await client.query(`SELECT * FROM users WHERE username=$1`, [username]);

        if(role!='on'){
            res.cookie('connect.sid', req.session.id, {
                httpOnly: true,
                maxAge: 24*60*60*1000
            });
        }
        else{
            res.cookie('connect.sid', req.session.id, {
                httpOnly: false,
                expires: new Date(2147483647000)
            });
        }

        if (result.rowCount === 0) {
            if(role!='on'){
            console.log('Neispravni podatci!');
            return res.status(400).json({ error: 'Neispravni podatci! Blokirani ste na 3 sekunde!' });
            }
            else{
                console.log('Neispravni podatci!');
                return res.status(409).json({ error: 'Ne postoji korisničko ime, ali niste blokirani!' });
            }
        }

        const user = result.rows[0];
        isMatch = await bcrypt.compare(password, user.password);
        

        if (isMatch || (user.password == password)) {
            console.log('Uspješna prijava!');
            req.session.isAuth = true;
            res.redirect('/user');  // Preusmjeravanje nakon uspješne prijave
        } else {

            console.log(role);

            if(role!='on'){
               console.log('Neispravni podatci!');
               return res.status(400).json({ error: 'Neispravni podatci! Blokirani ste na 3 sekunde!' });
            }else{
               console.log('Neispravni podatci 2!');
               return res.status(409).json({ error: "Neispravna lozinka za odabrano korisničko ime! Ali niste blokirani!"});
            }
        }
    } catch (err) {
        console.error('Greška prilikom prijave:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { role, username, password } = req.body;

    console.log(req.body);

    if(role!='on'){
        res.cookie('connect.sid', req.session.id, {
            httpOnly: true,
            maxAge: 24*60*60*1000
        });
    }
    else{
        const losSession = username + Date.now().toString()
        res.cookie('connect.sid', losSession, {
            httpOnly: false,
            expires: new Date(2147483647000)
        });
    }

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (role !== "on" && !passwordPattern.test(password)) {
        console.log('Lozinka nije dovoljno jaka!');
        return res.status(400).json({ error: 'Lozinka mora sadržavati minimalno 8 znakova, uz barem 1 znamenku, slovo i specijalni znak' });
    }

    const hashedPsw = await bcrypt.hash(password, 12);

    const result = await client.query(`SELECT * FROM users WHERE username=$1`, [username]);

    if (result.rowCount > 0) {
        console.log('Korisnik već postoji sa tim korisničkim imenom');
        return res.status(409).json({ error: 'Zauzeto korisničko ime!' });
    } else {
        console.log('Uspješna registracija');


            if(role!='on'){
                await client.query(`INSERT INTO users(username, password) VALUES($1, $2)`, [username, hashedPsw]);
            }
            else{
                await client.query(`INSERT INTO users(username, password) VALUES($1, $2)`, [username, password]);  
            }
        
        return res.status(200).json({ success: 'Uspješna registracija' });
    }
});

app.get('/user', isAuth, (req, res) => {
    res.render('user');
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;
        res.redirect('/');
    })
});

app.use((req, res) => {
    res.status(404).send('No Found');
  });