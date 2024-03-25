import { html2text, text2html } from './parser.js'

let ibuffers = 0

class Buffer {

    constructor(st) {
        st = st || {}
        this.id = ++ibuffers
        this.name = 'Buffer' + this.id
        this.path = st.path || ''
        this.jed = null
        this.text = st.text || ''
        this.versions = []
        this.snap()
        this.readOnly = !!st.readOnly

        if (st.jed) this.bind(st.jed)
    }

    snap() {
        this.versions.push(this.text)
    }

    bind(jed) {
        if (!jed) throw `Unable to bind [${this.name}]`
        this.jed = jed
        this.jed.contentEditable = !this.readOnly
        this.jed.innerHTML = text2html(this.text)
        if (!this.readOnly) this.jed.focus()
    }

    unbind() {
        if (!this.jed) throw `Unable to unbind [${this.name}]`
        this.text = html2text(this.jed.innerHTML)
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

    unbindCurrent() {
        if (!this.currentBuffer) return
        this.currentBuffer.unbind()
    }

    createBuffer(st) {
        if (this.currentBuffer) this.unbindCurrent()
        const buffer = new Buffer(st)
        this.currentBuffer = buffer
        this.buffers.push(buffer)
        if (buffer.path) this.dir[buffer.path] = buffer
    }

    listBuffers() {
        return this.buffers.map(buf => `<li> <a href="#${buf.path}">${buf.name}: ${buf.path}</a>`).join('\n')
    }

}

export const bufferControl = new BufferControl()
