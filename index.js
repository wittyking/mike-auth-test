const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:8888"],
  }),
);
app.use(cookieParser());

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

const port = 8000;
const secret = "mysecret";

let conn = null;

// function init connection mysql
const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "tutorial",
  });
};

/* เราจะแก้ไข code ที่อยู่ตรงกลาง */
app.post('/api/register', async (req,res) => {
  try {
    const { email, password } = req.body
    const passwordHash = await bcrypt.hash(password, 10)
    const userData ={
      email,
      password: passwordHash
    }
    const [results] = await conn.query('INSERT INTO users SET ?', userData)
    res.json({
      message: 'insert ok',
      results
    })    
  } catch (error) {
    console.log('error', error)
    res.json({
      message: 'insert error',
      error
    })
  }
})

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [results] = await conn.query('SELECT * from users where email = ?', email)
    const userData = results[0]
    console.log(userData)
    const match = await bcrypt.compare(password, userData.password)
    if (!match) {
      res.status(400).json({
        message: 'login fail (wrong email, pass)'
      })
      return false
    }

    //สร้าง token jwt 
    // const token = jwt.sign({email, role: 'admin'}, secret, { expiresIn: '1h'}) //method 1-2
    // res.cookie('token', token, {  //method-2
    //   maxAge: 300000,
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: "none",
    // })

    req.session.userId = userData.id
    req.session.user = userData

    console.log("sessionID ",req.sessionID)

    res.json({
      message: 'login success',
      // token  //method 1)
    })
  } catch (error) {
    console.log('error', error)
    res.status(401).json({
      message: 'login fail',
      error
    })
  }
})

app.get('/api/users', async (req, res)=> {
  try {
    // const authHeader = req.headers['authorization'] //method 1)
    // let authToken = ''
    // if ( authHeader) {      
    //   authToken = authHeader.split(' ')[1]
    // }
    // const authToken = req.cookies.token  //ร้องขอ cookies จาก client  methode 2)
    // console.log('authToken', authToken)   //methode 2)
    // const user = jwt.verify(authToken, secret)   //methode 2)
    //เราจะมั่นใจว่า user มาอย่างถูกต้องแล้ว โดยเทียบกับ secret
    // recheck จาก database เราก็ได้

    if (!req.session.userId){
      throw { message: 'Auth fail'}
    }
    console.log(req.session)
    //method 1-2
    // const [checkeResuls] = await conn.query('SELECT * from users where email = ?',user.email)

    // if (!checkeResuls[0]){
    //   throw { message: 'user not found'}
    // }

    // console.log('user', user)
    const [ results] = await conn.query('SELECT * from users')
    res.json({
      users : results
    })
  } catch (error) {
    console.log('error', error)
    res.status(401).json({
      message: 'authentication fail',
      error
    })
    
  }
})

// Listen
app.listen(port, async () => {
  await initMySQL();
  console.log("Server started at port 8000");
});