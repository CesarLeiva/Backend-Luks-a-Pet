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
    origin: ["http://localhost:5500"],
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