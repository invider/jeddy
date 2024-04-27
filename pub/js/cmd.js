
const command = {
}

function register(name, fn) {
    if (!name || !fn) throw new Error('Failed to register a command')
    command[name] = fn
}

function exec(line) {

    switch(line) {
        case 'help': command.help(); break;
        default:
            console.log(`unknown command: [${line}]`)
    }

}

export default {
    register,
    exec,
}
