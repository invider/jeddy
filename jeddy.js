const express = require('express')
const app = express()

let port = 9101

console.log('Jeddy Text Editor')

app.use('/', express.static('pub'))

app.listen(port, () => console.log('Listening at http://localhost:' + port))
