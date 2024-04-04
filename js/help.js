const msg = `Usage: jeddy [command] [options]
    -o | --open   - open in the default web browser
    -p | --public - public access (e.g. --bind to '0.0.0.0')
    -b | --bind <address> - bind to the specified address (9101 by default)
    -d | --debug  - enable debug
    -t | --trace  - enable trace
    -h | --help   - show help message
`

function help() {
    console.log(msg)
}

module.exports = help
