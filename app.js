import express from 'express'

const app = express()

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

// create a route '/about' and send 'about page' as response
app.get('/about', (req, res) => {
    res.render('about')
})

// return 404 error
app.get('*', (req, res) => {
    res.send('404 Error. Page Not Found!')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('Server up. Application running...')
})