import express from 'express'

const app = express()

app.set('view engine', 'ejs')

let countries = ['fiji', 'thailand', 'phillipines', 'south korea', 'japan', 'vietnam']

app.get('/', (req, res) => {
    res.render('index', {title: 'This the index page', countries: countries})
})

let name = 'valarie tila'

// create a route '/about' and send 'about page' as response
app.get('/about', (req, res) => {
    res.render('about', {name: name})
})

// return 404 error
app.get('*', (req, res) => {
    res.send('404 Error. Page Not Found!')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('Server up. Application running...')
})