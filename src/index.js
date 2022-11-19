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
    const identificacion = req.body.identificacion;
    const correo = req.body.correo;
    const contra = req.body.contra;
    const nombres = req.body.nombres;
    const apellidos = req.body.apellidos;
    const celular = req.body.celular;
    const role = "Usuario";

    if (identificacion == "" || nombres == '' || celular == '' || correo == '' || contra == '' || apellidos == '') {
        res.send({ message: 'Por favor, completar todos los campos!!' });
    } else {

        bcrypt.hash(contra, saltRounds, (err, hash) => {

            if (err) {
                console.log(err);
            }

            db.query("INSERT INTO Usuario ( IdUsuario, Nombres, Apellidos, Correo, Contraseña,Celular, Role) VALUES (?,?,?,?,?,?,?)",
                [identificacion, nombres, apellidos, correo, hash, celular, role],
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
    console.log(req.session)
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

//? Probar: agregar mascota && agregar propuesta
app.post('/propuesta', (req, res) => {
    //? Mascota
    const nombre = req.body.nombre;
    const sexo = req.body.sexo;
    const esterilizado = req.body.esterilizado;
    const edad = req.body.edad;
    const descripcion = req.body.descripcion;
    const foto = "https://ichef.bbci.co.uk/news/640/cpsprodpb/15665/production/_107435678_perro1.jpg";
    const idMascota = null;

    db.query("INSERT INTO Mascota ( Nombre, Sexo, Esterilizado, Edad,Descripcion, Foto) VALUES (?,?,?,?,?,?)",
        [nombre, sexo, esterilizado, edad, descripcion, foto],
        (err, result) => {
            if (err) {
                res.send({ err: err })
                console.log(err);
            } else {


                console.log(result);
                //? Propuesta
                const idUsuario = req.body.idUsuario;
                const idMascota = result.insertId;
                const departamento = req.body.departamento;
                const ciudad = req.body.ciudad;
                const adoptado = false;

                db.query("INSERT INTO PropuestaAdopcion ( IdUsuario, IdMascota, Departamento, Ciudad, Adoptado) VALUES (?,?,?,?,?)",
                    [idUsuario, idMascota, departamento, ciudad, adoptado],
                    (err, result2) => {
                        if (err) {
                            res.send({ err: err })
                            console.log(err);
                        } else {
                            res.send({ result, result2 });
                        }

                    });

            }

        });


})

//* ver propuestas

app.get('/propuestas', (req, res) => {

    db.query("SELECT PropuestaAdopcion.*, Mascota.* from PropuestaAdopcion Inner join Mascota on PropuestaAdopcion.IdMascota = Mascota.IdMascota",
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No hay propuestas"
                });
            }

        });
});

//* ver propuestas de un usuario 
app.get('/propuestas/:id', (req, res) => {

    const usuarioId = req.params.id;

    db.query("SELECT PropuestaAdopcion.*, Mascota.* from PropuestaAdopcion Inner join Mascota on PropuestaAdopcion.IdMascota = Mascota.IdMascota where Idusuario = ?", [usuarioId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No ha creado propuestas"
                });
            }

        });
});

//* ver propuesta unica
app.get('/propuesta/:id', (req, res) => {

    const propuestaId = req.params.id;

    db.query("SELECT PropuestaAdopcion.*, Mascota.*, Usuario.Celular FROM PropuestaAdopcion INNER JOIN Mascota ON PropuestaAdopcion.IdMascota = Mascota.IdMascota INNER JOIN Usuario ON PropuestaAdopcion.IdUsuario = Usuario.IdUsuario where IdPropuesta = ?", [propuestaId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No existe la propuesta"
                });
            }

        });
});

//* eliminar propuesta unica
app.delete('/propuesta/:id', (req, res) => {

    const propuestaId = req.params.id;

    db.query("delete from PropuestaAdopcion where IdPropuesta = ?", [propuestaId],
        (err, result) => {
            console.log(result)
            if (err) {
                res.send({ err: err })
            }
            else if (result.protocol41 == true) {
                res.send({
                    message: "Se ha eliminado la propuesta"
                });
            } else {
                res.send({
                    message: "No se ha eliminado la propuesta"
                });
            }

        });
});

//* ver Reportes

app.get('/reportes', (req, res) => {

    db.query("SELECT * from ReporteAdopcion",
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No hay reportes"
                });
            }

        });
});


//* mandar pqrs
app.post('/pqrs', (req, res) => {
    //? pqrs 
    const idUsuario = req.body.idUsuario;
    const mensaje = req.body.mensaje;

    db.query("INSERT INTO Pqrs ( IdUsuario, Mensaje) VALUES (?,?)",
        [idUsuario, mensaje],
        (err, result) => {
            if (err) {
                console.log(err);
            }

            res.send(result);

        });

});

//* ver pqrs
app.get('/pqrs', (req, res) => {

    db.query("SELECT Pqrs.*, Usuario.* from Pqrs Inner join Usuario on Pqrs.IdUsuario = Usuario.IdUsuario",
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No hay PQRS"
                });
            }

        });
});


//* ver pqrs unica
app.get('/pqrs/:id', (req, res) => {

    const pqrsId = req.params.id;

    db.query(" SELECT Pqrs.*, Usuario.* from Pqrs Inner join Usuario on Pqrs.IdUsuario = Usuario.IdUsuario where IdPQRS = ?", [pqrsId],
        (err, result) => {
            if (err) {
                res.send({ err: err })
            }
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send({
                    message: "No existe la PQRS"
                });
            }

        });
});




app.listen(PORT, () => {
    console.log("running server on port", PORT);
});