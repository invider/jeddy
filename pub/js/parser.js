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

export function html2text(source) {

    const stream = createStream(source)
    const lex = createHtmlLex(stream)

    let out = ''
    let token = lex.next()
    let lastToken = {}
    while(token) {
        if (env.debug) {
            console.log(token.t + ': [' + token.v + ']')
        }
        if (token.t === 't') {
            out += token.v
        } else if (token.t === '<') {
            switch(token.v) {
                case 'br':
                    if (lastToken.t !== '<' || lastToken.v !== 'div') {
                        out += '\n'
                    }
                    break
                case 'div':
                    //if (lastToken.t !== '/' || lastToken.v !== 'div') {
                    out += '\n'
                    //}
                    break
            }

        } else if (token.t === '/') {
            switch(token.v) {
                case 'div':
                    if (lastToken.v !== 'br') out += '\n';
                    break;
            }
        } else if (token.t === '&') {
            switch(token.v) {
                case 'nbsp': out += ' '; break;
                case 'quot': out += '"'; break;
                case 'amp':  out += '&'; break;
                case 'lt':   out += '<'; break;
                case 'gt':   out += '>'; break;
            }
        }

        lastToken = token
        token = lex.next()
    }

    return out
}

function createTextLex(stream) {
    const { getc, retc, aheadc, eof } = stream

    function normalizeLine(line) {
        if (!line) return ''

        let prefix = 0
        while (line.startsWith(' ')) {
            prefix ++
            line = line.substring(1)
        }
        for (let i = 0; i < prefix; i++) {
            line = '&nbsp;' + line
        }

        let tabfix = 0
        while (line.startsWith('\t')) {
            tabfix ++
            line = line.substring(1)
        }
        for (let i = 0; i < tabfix; i++) {
            line = '&#9;' + line
        }

        if (prefix || tabfix) return normalizeLine(line)
        else return line
    }

    function escapeHtml(line) {
        if (!line) return ''
        //line = line.replaceAll('"', '&quot;')
        line = line.replaceAll('&', '&amp;')
        line = line.replaceAll('<', '&lt;')
        line = line.replaceAll('>', '&gt;')
        return line
    }

    function nextLine() {
        let line = ''
        let c = getc()
        
        while (c && c !== '\n') {
            line += c
            c = getc()
        }
        line = escapeHtml(line)
        line = normalizeLine(line)
        return line
    }


    function next() {
        if (eof()) return
        return nextLine()
    }

    return {
        next
    }
}

export function text2html(source) {
    const stream = createStream(source)
    const lex = createTextLex(stream)

    let out = ''
    let line = lex.next()

    while(line !== undefined) {
        line += '<br>'
        out += line
        //console.log('[' + line + ']')

        let next = lex.next()
        line = next
    }

    return out
}
