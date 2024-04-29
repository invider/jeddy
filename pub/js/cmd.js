import status from './status.js'

const command = {

    echo: function(cmd) {
        console.log('command: ' + cmd.name)
        console.log('line: ' + cmd.line)
        console.dir(cmd.args)
    }
}

function register(name, fn) {
    if (!name || !fn) throw new Error('Failed to register a command')
    command[name] = fn
}

function parse(line) {
    const cmd = {
        line,
    }
    const parts = line.split(' ')
    cmd.args = parts
    if (parts.length > 0) cmd.name = parts[0]

    return cmd
}

function exec(line) {
    if (!line || typeof line !== 'string') return
    const cmd = parse(line.trim())
    if (!cmd) {
        const msg = `can't parse the command line: [${line}]`
        console.error(msg)
        status.show(msg, env.config.popupTime || 1)
    }

    const cmdFn = command[cmd.name]
    if (!cmdFn) {
        const msg = `unknown command: [${cmd.name}]`
        console.error(msg)
        status.show(msg, env.config.popupTime || 1)
    }

    cmdFn(cmd)
}

export default {
    register,
    exec,
}
