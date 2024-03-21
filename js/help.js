const msg = `Usage: jeddy [options]
    -p | --public - public access (bind to '0.0.0.0')
    -b | --bind <address> - bind to the specified address
    -d | --debug  - set debug flag
    -h | --help   - show help message
`

function help() {
    console.log(msg)
}

module.exports = help
