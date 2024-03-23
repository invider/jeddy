#!/usr/bin/env node

const argsParser = require('./js/argsParser.js')
const server = require('./js/server.js')
const help = require('./js/help')

const env = argsParser(process.argv)

console.log('Jeddy Local Web Text Editor')
console.log('Version: 0.1')

switch(env.action) {
    case 'host-dir':
        server.serve(env)
        break
    case 'help':
        help()
        break
}

