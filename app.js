import express from 'express'
import bcrypt from 'bcrypt'
import mysql from 'mysql'
import session from 'express-session'
import multer from 'multer'

const app = express()
const upload = multer({dest: 'public/uploads/'})

// create connection with the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'review'
})

// set a tempate engine for the app, ejs (embedded javascript)
app.set('view engine', 'ejs')

// create session middleware
app.use(session({
    secret: 'siri',
    resave: false,
    saveUninitialized: false
}))

// source static files from public
app.use(express.static('public'))

// configuration to access form information
app.use(express.urlencoded({extended:false}))

// constantly check if user is logged in
app.use((req, res, next) => {
    if(req.session.userID === undefined) {
        res.locals.isLoggedIn = false
    } else {
        res.locals.isLoggedIn = true
        res.locals.username = req.session.username
        res.locals.user = req.session.user
        res.locals.business = req.session.profile
    }
    next()
})

// landing page
app.get('/', (req, res) => {
    res.render('index')
})

/* reviewers' routes */

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

    connection.query(
        'SELECT * FROM users WHERE email = ?',
        [req.body.email],
        (error, results) => {
            if(results.length > 0) {
                // authenticate
                bcrypt.compare(req.body.password, results[0].password, (error, matches) => {
                    if(matches) {
                        req.session.userID = results[0].userID
                        req.session.username = results[0].fullname.split(' ')[0]
                        req.session.user = 'reviewer'
                        res.redirect('/app')
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
        }
    )
    
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

        connection.query(
            'SELECT email FROM users WHERE email = ?',
            [req.body.email],
            (error, results) => {
                if(results.length > 0) {
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

                        connection.query(
                            'INSERT INTO users (fullname, email, password) VALUES (?,?,?)',
                            [req.body.fullname, req.body.email, hash],
                            (error, results) => {
                                res.redirect('/login')
                            }
                        )

                    })
                }
            }
        )

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

// application homepage
app.get('/app', (req, res) => {
    if(res.locals.isLoggedIn) {
        res.render('reviewer-dashboard')
    } else {
        res.redirect('/login')
    }
})

// reviewer's profile
app.get('/profile', (req, res) => {
    if(res.locals.isLoggedIn) {

        let sql = 'SELECT * FROM users WHERE userID = ?'

        connection.query(
            sql, [req.session.userID],
            (error, results) => {

                const profile = {
                    id: results[0].userID,
                    name: results[0].fullname,
                    email: results[0].email,
                    photoURL: results[0].photoURL
                }

                res.render('reviewer-profile', {profile: profile})
            }
        )

        
    } else {
        res.redirect('/login')
    }

})

// display edit profile form
app.get('/edit-profile/:id', (req, res) => {
    if(res.locals.isLoggedIn) {

        let sql = 'SELECT * FROM users WHERE userID = ?'

        connection.query(
            sql, [parseInt(req.params.id)], 
            (error, results) => {
                const profile = {
                    id: results[0].userID,
                    name: results[0].fullname,
                    email: results[0].email,
                    phoneNumber: results[0].phone_number,
                    location: results[0].location,
                    facebookURL: results[0].facebookURL,
                    twitterURL: results[0].twitterURL,
                    instagramURL: results[0].instagramURL,
                    photoURL: results[0].photoURL
                }
                res.render('reviewer-edit-profile', {profile: profile})
            }
        )

    } else {
        res.redirect('/login')
    }
})

// submit edit profile
app.post('/edit-profile/:id', upload.single('photoURL'), (req, res) => {
    const profile = {
        name: req.body.fullname,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        location: req.body.location,
        facebookURL: req.body.facebookURL,
        twitterURL: req.body.twitterURL,
        instagramURL: req.body.instagramURL,
        photoURL: req.file.filename
    }

    let sql = 'UPDATE users SET fullname = ?, email = ?, phone_number = ?, location = ?, facebookURL = ?, twitterURL = ?, instagramURL = ?, photoURL = ? WHERE userID = ?'

    connection.query(
        sql,
        [
            profile.fullname,
            profile.email,
            profile.phoneNumber,
            profile.location,
            profile.facebookURL,
            profile.twitterURL,
            profile.instagramURL,
            profile.photoURL,
            req.session.userID
        ],
        (error, results) => {
            res.redirect('/profile')
        }
    )

})

/* .reviewers' routes */

/* business routes */

// display create business profile form
app.get('/business/create-profile', (req, res) => {
    const profile = {
        business: {
            name: '',
            email: '',
            tagLine: '',
            category: '',
            description: '',
            location: ''
        },
        rep: {
            name: '',
            contacts: '',
            email: '',
            password: '',
            cPassword: ''
        }
    }
    res.render('create-business-profile', {error: false, profile: profile})
})

// submit create business profile form
app.post('/business/create-profile', (req, res) => {

    const profile = {
        business: {
            name: req.body.businessName,
            email: req.body.businessEmail,
            tagLine: req.body.tagLine,
            category: req.body.businessCategory,
            description: req.body.businessDescription,
            location: req.body.businessLocation
        },
        rep: {
            name: req.body.adminName,
            contacts: req.body.adminPhoneNumber,
            email: req.body.adminEmail,
            password: req.body.adminPassword,
            cPassword: req.body.adminConfirmPassword
        }
    }

    if(profile.rep.password === profile.rep.cPassword) {

        let sql = 'SELECT * FROM business_profile WHERE b_email = ?'

        connection.query(
            sql, [profile.business.email], (error, results) => {
                if(results.length > 0) {
                    let message = 'Business profile with the email provided already existed.'
                    res.render('create-business-profile', {error: true, message: message, profile: profile})
                } else {
                    bcrypt.hash(profile.rep.password, 10, (error, hash) => {
                        let sql = 'INSERT INTO business_profile (b_name, b_email, b_tag_line, b_category, b_description, b_location, b_contact_person, b_phone_number, b_email_address, b_password) VALUES (?,?,?,?,?,?,?,?,?,?)'
                        connection.query(
                            sql, 
                            [
                                profile.business.name,
                                profile.business.email,
                                profile.business.tagLine,
                                profile.business.category,
                                profile.business.description,
                                profile.business.location,
                                profile.rep.name,
                                profile.rep.contacts,
                                profile.rep.email,
                                hash
                            ], 
                            (error, results) => {
                                res.redirect('/business/login')
                            }
                        )
                    })
                }
            }
        )

    } else {
        let message = 'Password and confirm password does not match.'
        res.render('create-business-profile', {error: true, message, profile: profile})
    }
})

// display business login form
app.get('/business/login', (req, res) => {

    const profile = {
        businessEmail: '',
        businessPassword: ''
    }

    res.render('login-business', {error: false, profile: profile})

})

// submit business login form
app.post('/business/login', (req, res) => {

    const profile = {
        businessEmail: req.body.email,
        businessPassword: req.body.password
    }

    let sql = 'SELECT * FROM business_profile WHERE b_email = ?'

    connection.query(
        sql, [profile.businessEmail],
        (error, results) => {
            if(results.length > 0) {
                bcrypt.compare(profile.businessPassword, results[0].b_password, (error, matches) => {
                    if(matches) {
                        req.session.userID = results[0].b_id
                        req.session.business = results[0].b_name
                        req.session.username = results[0].b_contact_person.split(' ')[0]
                        req.session.user = 'business'
                        req.session.profile = results[0]
                        res.redirect('/business/dashboard')
                    } else {
                        let message = 'Incorrect Password.'
                        res.render('login-business', {error: true, message: message, profile: profile})
                    }
                })
            } else {
                let message = 'Business profile does not exist. Please create one.'
                res.render('login-business', {error: true, message: message, profile: profile})
            }
        }
    )

})

// business dashboard
app.get('/business/dashboard', (req, res) => {

    if(res.locals.isLoggedIn && req.session.user === 'business') {

        let sql = 'SELECT * FROM business_profile WHERE b_id = ?'

        connection.query(
            sql, [req.session.userID], 
            (error, results) => {
                res.render('business-profile', {profile: results[0]})
            }
        )

    } else {
        res.redirect('/business/login')
    }
    
})

// display edit business profile form
app.get('/business/edit-profile/:id', (req, res) => {
    let sql = 'SELECT * FROM business_profile WHERE b_id = ?'

    connection.query(
        sql, [req.session.userID],
        (error, results) => {

            const profile = {
                business: {
                    name: results[0].b_name,
                    email: results[0].b_email,
                    tagLine: results[0].b_tag_line,
                    category: results[0].b_category,
                    description: results[0].b_description,
                    location: results[0].b_location
                },
                rep: {
                    name: results[0].b_contact_person,
                    contacts: results[0].b_phone_number,
                    email: results[0].b_email_address,
                    password: ''
                }
            }

            res.render('edit-business-profile', {error: false, profile: profile})
        }
    )

})

// submit edit business profile form
app.post('/business/edit-profile/:id', (req, res) => {
    const profile = {
        business: {
            name: req.body.businessName,
            email: req.body.businessEmail,
            tagLine: req.body.tagLine,
            category: req.body.businessCategory,
            description: req.body.businessDescription,
            location: req.body.businessLocation
        },
        rep: {
            name: req.body.adminName,
            contacts: req.body.adminPhoneNumber,
            email: req.body.adminEmail,
            password: req.body.adminPassword
        }
    }

    // check password
    bcrypt.compare(profile.rep.password, res.locals.business.b_password, (error, matches) => {
        if(matches) {
            let sql = 'UPDATE business_profile SET b_name = ?, b_email = ?, b_tag_line = ?, b_category = ?, b_description = ?, b_location = ?, b_contact_person = ?, b_phone_number = ?, b_email_address = ? WHERE b_id = ?'
            connection.query(
                sql, 
                [
                    profile.business.name,
                    profile.business.email,
                    profile.business.tagLine,
                    profile.business.category,
                    profile.business.description,
                    profile.business.location,
                    profile.rep.name,
                    profile.rep.contacts,
                    profile.rep.email,
                    parseInt(req.params.id)
                ],
                (error, results) => {
                    res.redirect('/business/dashboard')
                }
            )
        } else {
            // incorrect password
            let message = 'Incorrect Password'
            res.render('edit-business-profile', {error: true, message: message, profile: profile})
        }
    })
    

})

/* .business routes */


// logout functionality
app.get('/logout', (req, res) => {
    // kill session
    req.session.destroy((error) => {
        res.redirect('/')
    })
})

// return 404 error
app.get('*', (req, res) => {
    res.send('404 Error. Page Not Found!')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('Server up. Application running...')
})