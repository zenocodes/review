import express from 'express'
import bcrypt from 'bcrypt'

const app = express()

// set a tempate engine for the app, ejs (embedded javascript)
app.set('view engine', 'ejs')

// source static files from public
app.use(express.static('public'))

// configuration to access form information
app.use(express.urlencoded({extended:false}))

const users = [
    {
        id: 2,
        fullname: 'Valarie Tila',
        email: 'valarie@review.com',
        password: '$2b$10$Mcjt.gCN82L3DTk2EFZkO.Rnk1j2KBu47ko734gTnwpqJWFoZ/10O'
      }
]

app.get('/', (req, res) => {
    res.render('index')
})

// display login form 
app.get('/login' , (req, res) => {
    const user = {
        email: '',
        password: ''
    }
    res.render('login', {error: false, user: user})
})

// submit login form 
app.post('/login', (req, res) => {
    
    const user = users.find(user => user.email === req.body.email)

    if(user) {
        // authenticate
        bcrypt.compare(req.body.password, user.password, (error, matches) => {
            if(matches) {
                console.log('grant access')
            } else {
                const user = {
                    email: req.body.email,
                    password: req.body.password
                }
                let message = 'Email/Password mismatch.'
                res.render('login', {error: true, message: message, user: user})
            }
        })
        
    } else {
        const user = {
            email: req.body.email,
            password: req.body.password
        }
        let message = 'Account does not exist. Please create one.'
        res.render('login', {error: true, message: message, user: user})
    }
    
})

// display signup form 
app.get('/signup', (req, res) => {
    const user = {
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    }
    res.render('signup', {error: false, user: user})
})

// submit signup form
app.post('/signup', (req, res) => {

    if(req.body.password === req.body.confirmPassword) {

        let user = users.find(user => user.email === req.body.email)

        if(user) {
            const user = {
                fullname: req.body.fullname,
                email: req.body.email,
                password: req.body.password,
                confirmPassword: req.body.confirmPassword
            }
            let message = 'Account already exists with the email provided.'
            res.render('signup', {error: true, message: message, user: user})

        } else {
            bcrypt.hash(req.body.password, 10, (error, hash) => {
                const user = {
                    id: users.length + 1,
                    fullname: req.body.fullname,
                    email: req.body.email,
                    password: hash
                }
                users.push(user)
                console.log(user)
                console.log('Account successfully created')
            })
        }

    } else {
        const user = {
            fullname: req.body.fullname,
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword
        }
        let message = 'Password and Confirm password does not match.'
        res.render('signup', {error: true, message: message,user: user})
    }

})


// return 404 error
app.get('*', (req, res) => {
    res.send('404 Error. Page Not Found!')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('Server up. Application running...')
})