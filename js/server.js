const fs = require('fs')
const open = require('open')
const express = require('express')
const bodyParser = require('body-parser')
const util = require('./util.js')

const EXPRESS_PATH = '/node_modules/express/index.js'

const envcPath = '/envc'
const workspacePath = '/workspace*'

let env = {}

// common environment
function envcHandler(req, res, next) {
    const envc = {
        app:     env.app,
        title:   env.title,
        version: env.version,
        release: env.release,
        debug:   env.debug,
        trace:   env.trace,
        started: (new Date(env.started)).toISOString(),
        uptime:  Math.floor((Date.now() - env.started)/1000),
        workspace: process.cwd(),
    }
    const content = JSON.stringify(envc, null, 4)

    res.status(200)
    res.setHeader('Content-Type', 'application/json')
    res.end(content)
}

function workspaceLoadHandler(req, res, next) {
    try {
        const origPath = req.path.substring(workspacePath.length)

        function notFound(path) {
            console.log(`404 Not Found: ${path}`)
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

            res.status(303) // HTTP See Other - to indicate the directory listing
            res.send(list.join('\n'))
        }

        // list local folder on empty path
        if (origPath === '') {
            return listPath('./', false)
        }

        const path = './' + origPath

        if (!fs.existsSync(path)) {
            notFound(origPath)
            return
        }

        const lstat = fs.lstatSync(path)
        if (lstat.isDirectory()) {
            console.log('listing: ' + path)
            return listPath(path, true)

        } else if (lstat.isFile()) {
            console.log('loading: ' + path)
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
    } catch(e) {
        console.log(e)
    }
}

function workspaceSaveHandler(req, res, next) {
    try { 
        const origPath = req.path.substring(workspacePath.length)

        // guard against empty path
        if (origPath === '') {
            const msg = 'Unable to save - no file specified'
            console.error(msg)
            res.status(500)
            res.send(msg)
            return
        }

        const path = './' + origPath
        if (env.trace) console.log('---------------------------------------')
        console.log('saving: ' + path)
        if (env.trace) console.log('---------------------------------------')
        if (env.trace) console.log(req.body.toString())
        if (env.trace) console.log('=======================================')

        fs.writeFile(path, req.body, (err) => {
            if (err) {
                console.log(err)
                res.status(500).send(`Unable to save ${path}`)
            } else {
                res.status(200).send('Saved')
            }
        })
    } catch (e) {
        console.log(e)
    }
}

function serve(environment) {
    const app = express()
    env = environment

    const expressPath = require.resolve('express')
    if (!expressPath) throw "Can't determine Jeddy module home path!"
    const modulePath = expressPath.substring(0, expressPath.length - EXPRESS_PATH.length)
    env.jeddyBase = modulePath
    env.jeddyPub  = modulePath + '/pub'

    app.use(bodyParser.text())

    console.log(`Working Dir: ${env.editPath}`)
    if (env.debug) console.log(`Jeddy Base: ${env.jeddyBase}`)

    // host static from /pub
    app.use('/', express.static(modulePath + '/pub'))

    app.get(envcPath, envcHandler)

    app.get(workspacePath, workspaceLoadHandler)
    app.post(workspacePath, workspaceSaveHandler)

    const at = `http://${env.bind}:${env.port}`
    app.listen(env.port, env.bind, () => console.log(`Listening at ${at}`))

    if (env.open) {
        setTimeout(() => {
            console.log(`Opening default browser at ${at}`)
            open(at)
        }, 2000)
    }
}

module.exports = {
    serve,
}
