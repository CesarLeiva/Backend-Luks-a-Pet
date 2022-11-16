const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");


const PORT = process.env.PORT || 3001;

const saltRounds = 10;

const app = express();



app.use(express.json());
app.use(cors({
    origin: ["http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}

));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        key: "userId",
        secret: "LuksAPet",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60 * 60 * 24 * 60

        }
    })
)
const db = mysql.createConnection({
    user: "root",
    host: "containers-us-west-96.railway.app",
    port: 7803,
    password: "7kj4n2A50smwrg4d5lr3",
    database: "railway",
});

db.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});


//* Registrar
app.post('/registrar', (req, res) => {
    
    const correo = req.body.correo;
    const contra = req.body.contra;
    const nombres = req.body.nombres;
    const apellidos = req.body.apellidos;
    const celular = req.body.celular;
    const role = "Usuario";
    
    if (nombres == '' || celular == '' || correo == '' || contra == '' || apellidos == '') {
        res.send({ message: 'Por favor, completar todos los campos!!' });
    } else {
        
        bcrypt.hash(contra, saltRounds, (err, hash) => {
            
            if (err) {
                console.log(err);
            }
            
            db.query("INSERT INTO Usuario ( Nombres, Apellidos, Correo, Contraseña,Celular, Role) VALUES (?,?,?,?,?,?)",
            [nombres, apellidos, correo, hash, celular, role],
            (err, result) => {
                if (err) {
                        if (err.code == "ER_DUP_ENTRY") {
                            res.send({ err: err, message: "Correo electronico no disponible" })
                        }
                        else {
                            res.send({ err: err, message: err.message })
                        }
                    }
                    
                    res.send(result);
                    
                });
            })

    }
    

});


//* LOGIN
app.post('/login', (req, res) => {
    const correo = req.body.correo;
    const contra = req.body.contra;
    if (correo == '' || contra == '') {
        res.send({
            message: "Por favor, completar todos los campos!!"
        });
    } else {
        db.query("SELECT * FROM Usuario WHERE Correo = ?",
            [correo],
            (err, result) => {
                if (err) {
                    res.send({ err: err })
                }
                else if (result.length > 0) {
                    bcrypt.compare(contra, result[0].Contraseña, (err, response) => {
                        if (response) {
                            req.session.user = result;
                            res.send(result)
                        } else {
                            res.send({
                                message: "Usuario o Contraseña incorrectos!"
                            });
                        }
                    })
                } else {
                    res.send({
                        message: "Usuario no existe!"
                    });
                }

            });
    }
});

//* Verificar conexion
app.get('/login', (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, user: req.session.user })
    } else {
        res.send({ loggedIn: false });
    }

});

//* Cerrar Sesion (logout)
app.get('/logout', (req, res,) => {
    req.session.destroy((err) => {
        res.clearCookie("userId").send({ message: "Sesión eliminada" });
    });

});




app.listen(PORT, () => {
    console.log("running server on port", PORT);
});