import { html2text, text2html } from './parser.js'

let ibuffers = 0
let abuffers = 0
let tbuffers = 0

class Buffer {

    constructor(st) {
        st = st || {}
        this.attached = !!st.attached
        this.id = ++ibuffers
        if (this.attached) {
            this.name = 'Buffer' + (++abuffers)
        } else {
            this.name = 'Buffer' + (++tbuffers)
        }
        this.path = st.path || ''
        this.jed = null
        this.text = st.text || ''
        this.versions = []
        this.snap()
        this.readOnly = !!st.readOnly
        this.plainText = !!st.plainText

        if (st.jed) this.bind(st.jed)
    }

    snap() {
        this.versions.push(this.text)
    }

    bind(jed) {
        if (!jed) throw `Unable to bind [${this.name}]`
        this.jed = jed
        this.activate()
    }

    hibernate() {
        if (!this.jed) throw `Can't hibernate - [${this.name}] is expected to be binded`
        if (!this.active) throw `Can't hibernate - [${this.name}] is expected to be active`
        this.active = false
        this.text = html2text(this.jed.innerHTML)
    }

    activate() {
        if (!this.jed) throw `Unable to unbind [${this.name}]`

        this.jed.contentEditable = !this.readOnly
        if (this.plainText) {
            this.jed.innerHTML = text2html(this.text)
        } else {
            this.jed.innerHTML = this.text
        }
        if (!this.readOnly) this.jed.focus()

        this.active = true
    }

    // text source change notification
    touch() {
    }
}

class BufferControl {

    constructor() {
        this.currentBuffer = null
        this.buffers = []
        this.dir = {}
    }

    hibernateCurrent() {
        if (!this.currentBuffer) return
        this.currentBuffer.hibernate()
    }

    create(st) {
        this.hibernateCurrent()
        const buffer = new Buffer(st)
        this.currentBuffer = buffer

        if (buffer.attached) {
            this.buffers.push(buffer)
            if (buffer.path) this.dir[buffer.path] = buffer
        }
    }

    activate(buffer) {
        if (!buffer) return
        this.hibernateCurrent()
        buffer.activate()
        this.currentBuffer = buffer
    }

    activateAt(index) {
        this.activate( this.buffers[index] )
    }

    open(path) {
        const buffer = this.dir[path]
        if (!buffer) return
        this.activate(buffer)
        return buffer
    }

    list() {
        return this.buffers.map(buf => `<li> <a href="#${buf.path}">${buf.name}: ${buf.path}</a>`).join('\n')
    }

}

export const bufferControl = new BufferControl()
