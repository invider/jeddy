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
        this.lastSave = 0

        if (st.jed) this.bind(st.jed)
    }

    snap() {
        this.versions.push({
            time: Date.now(),
            text: this.text,
        })
    }

    bind(jed) {
        if (!jed) throw `Unable to bind [${this.name}]`
        this.jed = jed
        this.activate()
    }

    hibernate() {
        if (!this.jed) throw `Can't hibernate - [${this.name}] is expected to be binded`
        if (!this.active) throw `Can't hibernate - [${this.name}] is expected to be active`
        this.syncIn()
        this.active = false
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
        this.dirty = true
        this.lastSave = Date.now()
    }

    markSaved() {
        this.dirty = false
        this.lastSave = Date.now()
    }

    isDirty() {
        return this.dirty
    }

    syncIn() {
        this.text = html2text(this.jed.innerHTML)
    }

    getLastSave() {
        return this.lastSave
    }

    getPath() {
        return this.path
    }

    getText() {
        if (this.dirty) this.syncIn()
        return this.text
    }

    getPlainText() {
        if (this.dirty) this.syncIn()
        return html2text(this.text)
    }

    status() {
        if (this.dirty) return '*' + this.path
        else return this.path
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
        return buffer
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

    current() {
        return this.currentBuffer
    }

}

export const bufferControl = new BufferControl()
