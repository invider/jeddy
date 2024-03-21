function argsParser(argv) {
    const env = {
        port:   9101,
        bind:   'localhost',
        action: 'host-dir',
        debug:  false,
    }
    env.editPath = process.cwd()

    let i = 2
    while (i < argv.length) {
        const arg = argv[i]

        switch(arg) {
            case '-p':
            case '--public':
                env.bind = '0.0.0.0'
                break

            case '-b':
            case '--bind':
                const addr = argv[++i]
                if (!addr) throw `Bind address MUST be supplied for ${arg} option`
                env.bind = addr
                break

            case '-d':
            case '--debug':
                env.debug = true
                break
        }

        i++
    }

    return env
}

module.exports = argsParser
