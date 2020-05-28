function createStream(source) {
    let pos = 0
    let buf
    let buffered = false

    function getc() {
        if (buffered) {
            buffered = false
            return buf
        }
        buf = source.charAt(pos++)
        return buf
    }

    function retc() {
        if (buffered) throw 'stream buffer overflow!'
        buffered = true
    }

    function aheadc() {
        if (buffered) return buf
        else return source.charAt(pos)
    }

    function eof() {
        return (pos >= source.length)
    }

    return {
        getc,
        retc,
        aheadc,
        eof,
    }
}

function createHtmlLex(stream) {
    const { getc, retc, aheadc, eof } = stream

    function isSpecial(c) {
        return (c === '<' || c === '&')
    }

    function next() {
        let token = ''

        if (eof()) return
        let c = getc()

        if (c === '<') {
            // determine open or closing tag
            let type = '<'
            if (aheadc() === '/') {
                getc()
                type = '/'
            }

            // consume tag
            c = getc()
            while(c && c !== '>') {
                token += c
                c = getc()
            }

            return {
                t: type,
                v: token,
            }
        } else if (c === '&') {

            // consume symbol definition
            c = getc()
            while(c && c !== ';') {
                token += c
                c = getc()
            }

            return {
                t: '&',
                v: token,
            }
        }

        // text span
        while (c && !isSpecial(c)) {
            token += c
            c = getc()
        }
        retc()

        if (token.length > 0) return { t: 't', v: token }
        throw 'unable to parse input stream'
    }

    return {
        next,
    }
}

export function html2md(source) {

    const stream = createStream(source)
    const lex = createHtmlLex(stream)

    let out = ''
    let token = lex.next()
    while(token) {
        console.log(token)
        if (token.t === 't') {
            out += token.v
        } else if (token.t === '<') {
            switch(token.v) {
                case 'br': out += '\n'
            }
        } else if (token.t === '/') {
            switch(token.v) {
                case 'div': out += '\n'
            }
        } else if (token.t === '&' && token.v === 'nbsp') {
            out += ' '
        }

        token = lex.next()
    }

    return out
}

function createMdLex(stream) {
    const { getc, retc, aheadc, eof } = stream

    function normalizeLine(line) {
        let prefix = 0
        while (line.startsWith(' ')) {
            prefix ++
            line = line.substring(1)
        }
        for (let i = 0; i < prefix; i++) {
            line = '&nbsp;' + line
        }
        return line
    }

    function nextLine() {
        let line = ''
        let c = getc()
        
        while (c && c !== '\n') {
            line += c
            c = getc()
        }
        return normalizeLine(line)
    }


    function next() {
        if (eof()) return

        let line = nextLine()
        return line + '\n'
    }

    return {
        next
    }
}

export function md2html(source) {
    const stream = createStream(source)
    const lex = createMdLex(stream)

    let out = ''
    let line = lex.next()

    while(line) {
        out += line
        console.log(line)

        let next = lex.next()
        if (line.length > 1 && next && next.length === 1) {
            next += '<br>'
        }
        line = next
    }

    return out
}

