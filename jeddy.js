#!/usr/bin/env node

const fs = require('fs')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const util = require('./js/util')

const EXPRESS_PATH = '/node_modules/express/index.js'

let port = 9101

console.log('Jeddy Text Editor')

const expressPath = require.resolve('express')
if (!expressPath) throw "can't determine Jeddy module home path!"
const modulePath = expressPath.substring(0, expressPath.length - EXPRESS_PATH.length)

app.use(bodyParser.text())

console.log(`${modulePath}/pub`)
app.use('/', express.static(modulePath + '/pub'))

const jopen = '/jed/open*'
app.get(jopen, (req, res, next) => {
    const origPath = req.path.substring(jopen.length)

    function notFound(path) {
        res.status(404).send(`Not Found: [${path}]`)
    }

    function listPath(path, parent) {
        const list = []
        if (parent) {
            list.push(`<li><a href="#${path}/..">..</a>`)
        }

        fs.readdirSync(path).forEach(file => {
            const filePath = util.joinPath(path, file)
            list.push(`<li><a href="#${filePath}">${file}</a>`)
        })

        res.status(303) // See Other
        res.send(list.join('\n'))
    }

    // list local folder on empty path
    if (origPath === '') {
        return listPath('./', false)
    }

    const path = './' + origPath
    console.log('path: ' + path)

    if (!fs.existsSync(path)) notFound(origPath)

    const lstat = fs.lstatSync(path)
    if (lstat.isDirectory()) {
        return listPath(path, true)

    } else if (lstat.isFile()) {
        fs.readFile(path, (err, data) => {
            if (err) {
                console.log(err)
                notFound(path)

            } else {
                res.type('.txt')
                res.status(200)
                res.send(data)
            }
        })
    } else {
        notFound(origPath)
    }
})

const jsave = '/jed/save*'
app.post(jsave, (req, res, next) => {
    const origPath = req.path.substring(jopen.length)

    // guard against empty path
    if (origPath === '') {
        res.status(500)
        res.send('Unable to save - no file specified')
        return
    }

    const path = './' + origPath
    console.log('saving: ' + path)
    console.log('data: ' + req.body.toString())
    console.log('----')

    fs.writeFile(path, req.body, (err) => {
        if (err) {
            console.log(err)
            res.status(500).send(`Unable to save ${path}`)
        } else {
            res.status(200).send('Saved')
        }
    })
})


app.listen(port, () => console.log('Listening at http://localhost:' + port))

