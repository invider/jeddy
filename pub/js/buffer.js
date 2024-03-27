import { html2text, text2html } from './parser.js'

let ibuffers = 0
let abuffers = 0
let tbuffers = 0

class Buffer {

    constructor(st) {
        st = st || {}
        this.control = null
        this.attached = !!st.attached
        this.id = ++ibuffers
        if (this.attached) {
            this.name = 'Buffer' + (++abuffers)
        } else {
            this.name = 'Buffer' + (++tbuffers)
        }
        this.path = st.path || ''
        this.text = st.text || ''
        this.versions = []
        this.snap()
        this.readOnly = !!st.readOnly
        this.plainText = !!st.plainText
        this.lastSave = 0
    }

    snap() {
        this.versions.push({
            time: Date.now(),
            text: this.text,
        })
    }

    bind(control) {
        if (!control) throw `Unable to bind [${this.name}]`
        this.control = control
    }

    hibernate() {
        if (!this.control) throw `Can't hibernate - [${this.name}] is expected to be binded`
        if (!this.active) throw `Can't hibernate - [${this.name}] is expected to be active`
        this.syncIn()
        this.active = false
    }

    activate() {
        if (!this.control) throw `Unable to activate [${this.name}] - no control binded`

        const jed = this.control.jed
        jed.contentEditable = !this.readOnly
        if (this.plainText) {
            jed.innerHTML = text2html(this.text)
        } else {
            jed.innerHTML = this.text
        }
        if (!this.readOnly) jed.focus()

        this.active = true
        window.location.hash = this.path
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
        if (!this.control) throw `Can't hibernate - [${this.name}] is expected to be binded`
        this.text = html2text(this.control.jed.innerHTML)
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

export class BufferControl {

    constructor() {
        this.currentBuffer = null
        this.buffers = []
        this.snaps = []
        for (let i = 0; i < 10; i++) {
            const buffer = new Buffer({
                path: '.snap' + (i + 1),
                text: '',
                attached:  false,
                readOnly:  false,
                plainText: true,
            })
            buffer.bind(this)
            this.snaps[i] = buffer
        }
        this.dir = {}
    }

    bind(jed) {
        this.jed = jed
    }

    hibernateCurrent() {
        if (!this.currentBuffer) return
        this.currentBuffer.hibernate()
    }

    create(st) {
        this.hibernateCurrent()
        const buffer = new Buffer(st)
        buffer.bind(this)
        buffer.activate()
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

    snapAt(index) {
        this.activate( this.snaps[index] )
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

