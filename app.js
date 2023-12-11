require('dotenv').config()
const express = require("express")
const port = process.env.PORT
var mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express()
var session = require('express-session')
const fs = require('fs');
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);






var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    max_allowed_packet:'1000m'
    
});

app.use(express.static('public'));
app.set('trust proxy', 1)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.use(express.json());


app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: true
    }
}))

const { transporter } = require('./email.js')

const redirectLogin = (req, res, next) =>{
    if(!req.session.userId){
        res.redirect('/login')
    }else{
        next()
    }
}
const redirectHome = (req, res, next) =>{
    if(req.session.userId){
        res.redirect('/dash')
    }else{
        next()
    }
}

function getFileExtension(filename){
    return filename.split('.').pop();
}

function round(number, decimalPlaces) {
    let factor = Math.pow(10, decimalPlaces);
    return Math.round(number * factor) / factor;
}


function getFolderSize(path) {
    let size = 0;
  
    // Read the directory contents
    const files = fs.readdirSync(path);
  
    for (const file of files) {
      const filePath = `${path}/${file}`;
      const stats = fs.lstatSync(filePath);
  
      if (stats.isDirectory()) {
        // Recursively get the size of subfolders
        size += getFolderSize(filePath);
      } else if (stats.isFile()) {
        // Add file size to the total size
        size += stats.size;
        size = size / 2147483648
        size = size * 100
        size = round(size, 1)
      }
    }
  
    return size;
  }
  
/*
/
/   PAGES ROTES
/
*/

app.get('/', (req, res) => {
    const { userId } = req.session
    res.render('index', {userid: userId});
});

/*
/
/   USER ROTES
/
*/
app.post('/user', redirectLogin, (req, res) => {
    res.status(200).jsonp({userid: req.session.userId, email: req.session.email, username: req.session.username})   
})


/*
/
/   DASH ROTES
/
*/
app.get('/dash', redirectLogin, (req, res) => {
    const userId = req.session.userId
    const folderSize = getFolderSize(__dirname + `/users/${userId}`)
    res.render('dash', {
        folderSize: folderSize
    })
   
})

app.get('/dash/files', redirectLogin, (req, res) => {
    const userid = req.session.userId 
    
    const files = fs.readdirSync(`./users/${userid}/`)
    res.render('arquivos', {
        files: files
    })
   
})
app.get('/dash/profile', redirectLogin, (req, res) => {
    res.render('profile', {
     username: req.session.username
    })
    
 })

app.get('/file/:file', redirectLogin, (req, res) => {
    
    const userid = req.session.userId
    const file = req.params.file
    const url = `./users/${userid}/${file}`
    const fileExtention = getFileExtension(file)
    fs.stat(url, (error, stats) => { 
        if (error) { 
          res.redirect('/dash')
          console.log(error)
        } 
        else { 
        fs.readFile('./users/' + userid + '/' + file, function(err, data) {
            res.render('file-preview', {
                filecontent: data,
                fileextention: fileExtention,
                file: file
            })
        })
         
        } 
      }); 
})

app.get('/f/upload', redirectLogin, (req, res) => {
    const userId = req.session.userId
    function getFolderSize(path) {
        let size = 0;
      
        // Read the directory contents
        const files = fs.readdirSync(path);
      
        for (const file of files) {
          const filePath = `${path}/${file}`;
          const stats = fs.lstatSync(filePath);
      
          if (stats.isDirectory()) {
            // Recursively get the size of subfolders
            size += getFolderSize(filePath);
          } else if (stats.isFile()) {
            // Add file size to the total size
            size += stats.size;
            size = size / 2147483648
            size = size * 100
            size = round(size, 1)
          }
        }
      
        return size;
      }
      
      // Usage example
      const folderPath = __dirname + `/users/${userId}`;
      const folderSize = getFolderSize(folderPath);

      res.send(folderSize)
})
/*
/
/   SESSION ROTES
/
*/


app.get('/login', redirectHome, (req, res) => {
    res.render('login')
 })



app.get('/register', redirectHome, (req, res) => {
    res.render('register');
});

app.get('/resetpassword', redirectHome, (req, res) => {
    res.render('forgot', {type: ''})
})
app.get('/oauth/password', redirectHome, (req, res) => {
    res.render('forgot', {type: 'email'})
})

app.post('/oauth/resetpassword', redirectHome, (req, res) => {
   const password = req.body.password
   const token = req.body.token
   const nToken = token.replace('?token=', '')
   const hash = bcrypt.hashSync(password, salt);

   connection.query('SELECT * FROM `token_reset` WHERE `token` =' + `"${nToken}"`, function (error, results, fields) {
    if(results.length == 0){
        res.jsonp({status: "erro", message: "Token não existente"})
    }else{
        connection.query('UPDATE `usuarios` SET `password`= '+ `"${hash}"` +'  WHERE `id` =' + `"${results[0].id}"`, function (error, results, fields) {
            res.json({status: "success"})
            connection.query('DELETE FROM `token_reset` WHERE `token`= '+ `"${nToken}"`)
        })
    }
    
   })

})

app.post('/oauth/resetcode', (req, res) => {
    function makeid(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
    const email = req.body.email
    const token = makeid(50)
    connection.query('SELECT * FROM `usuarios` WHERE `email` =' + `"${email}"`, function (error, results, fields) {
        const resultados = results
        if(results.length == 0){
            res.status(500).jsonp({status: "error", mensagem: "Usuário inexistente"})
        }else{
            connection.query('INSERT INTO `token_reset`(`id`, `token`) VALUES' + ` ("${results[0].id}", "${token}")`, function (error, results, fields) {
                async function main() {
                    // send mail with defined transport object
                    const reset = await transporter.sendMail({
                      from: 'contato@joelmo.tech', // sender address
                      to: email, // list of receivers
                      subject: `Redefina sua senha`, // Subject line
                      html: `Olá, ${resultados[0].name} <br> Aqui está o seu link de redefinição de senha: <br> <a href="http://localhost:3001/oauth/password?token=${token}">Clique aqui</a>`
                      
                    });                   
                }
                main()
                res.status(200).json({status: "success", mensagem: `Link para redefinição de senha enviado para ${email}`})
            })
        }
    })
    
    
    
})
/*
/
/   O AUTH ROTES
/
*/
app.post('/email/contact', (req, res) =>{
    
    const email = req.body.email
    const name = req.body.name
    const msg = req.body.msg
    async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: 'contato@joelmo.tech', // sender address
          to: "heitor.juliani19@gmail.com", // list of receivers
          subject: `Nova Solicitação de Contato de ${name}`, // Subject line
          text: `${msg}`, // plain text body
          html: `
          
          <table>
              <thead>
                <tr>
                  <th colspan="2"><strong>Email:</strong> ${email}</th>
                </tr>
              </thead>
              <tbody>
              <tr>
                   <td><strong>Nome:</strong></td>
                  <td>${name}</td>
                </tr>
                <tr>
                   <td><strong>Mensagem:</strong></td>
                  <td>${msg}</td>
                </tr>
              </tbody>
            </table>`
          
        });
      
        res.status(200).send('{"status": "success"}')
        
      }
      
      main().catch(console.error);
})

app.post('/oauth/login', redirectHome, (req, res) => {
    
    const { email, password } = req.body
    
   if(email && password){
   connection.query('SELECT * FROM `usuarios` WHERE `email` =' + `"${email}"`, function (error, results, fields) {
    const resultado = bcrypt.compareSync(password, results[0].password);
       if(results){
        var tamanho = results.length
        if(tamanho = 0){
            res.status(500).jsonp({status: "error", message: "Usuário não existente"})
        }else{
            if(resultado == true && email == results[0].email){
                req.session.userId = results[0].id
                req.session.email = results[0].email
                req.session.username = results[0].name
                res.status(200).jsonp({status: "success", message: "Login autorizado com sucesso!"})
            }else{
                res.status(500).jsonp({status: "error", message: "Senha ou email incorretos!"})
            }
        }
       }else{
        res.status(500).jsonp({status: "error", message: "Erro interno no servidor, tente novamente!"})
       }
        
      });
    }
    
}) 


app.post('/oauth/register', redirectHome, (req, res) => {
    const { email, password, name } = req.body
    const hash = bcrypt.hashSync(password, salt);
    connection.query('SELECT * FROM `usuarios` WHERE `email` =' + `"${email}"`, function (error, results, fields) {
       tamanho = results.length
        if(tamanho > 0){
            res.status(500).jsonp({status: "error", message: "Usuário já existente, por favor faça o login"})
        }else{
            const data = Date.now()
            var rounded_data = Math.round(data / 1000)
            connection.query('INSERT INTO `usuarios`(`id`,`name`, `email`, `password`) VALUES' + `("${rounded_data}","${name}", "${email}", "${hash}")`, function (error, results, fields){
                fs.mkdir(`./users/${rounded_data}`, (error) => { 
                    if (error) { 
                      console.log(error); 
                    } 
                }); 
                res.status(200).jsonp({status: "success", message: "Usuário criado com sucesso, por favor faça o login"})
           })
        }
      });
}) 

app.get('/oauth/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if(err){
            console.log(err)
            res.redirect('/dash')
        }
        res.clearCookie('sid')
        res.redirect('/login')
    })
}) 



app.listen(port, () => {
    console.log(`App rodando em http://localhost:${port}`)
})
