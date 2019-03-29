const express = require('express')
const app = express();
const path = require('path')
const PORT = process.env.PORT || 80

var vim = require('./routes/vim');
var vms = require('./routes/vms');
var home = require('./routes/home');
var methodOverride = require('method-override')

app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

app.use('/api/vim', vim);
app.use('/api/vms', vms);
app.use('/home', home);