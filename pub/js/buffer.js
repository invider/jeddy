import { html2text, text2html } from './parser.js'
import status from './status.js'
import env from './env.js'

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
        this.snapshot()
        this.readOnly = !!st.readOnly
        this.snapOnly = !!st.snapOnly
        this.plainText = !!st.plainText
        this.lastSave = 0
        this.lastTouch = 0
        this.lastCached = 0
        this.dirty = false
        this.cached = true
        this.outOfSync = false
    }

    snapshot() {
        this.versions.push({
            time: Date.now(),
            text: this.getText(),
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
        this.control.currentBuffer = this

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
        status.showCurBuffer()
    }

    // text source change notification
    touch() {
        this.lastTouch = Date.now()
        this.outOfSync = true
        if (this.cached) {
            this.cached = false
            this.lastCached = Date.now()
        }
        if (!this.dirty) {
            this.dirty = true
            this.lastSave = Date.now()
            status.showCurBuffer()
        }
    }

    isTouchedAfter(timestamp) {
        return (timestamp < this.lastTouch)
    }

    markSaved() {
        this.dirty = false
        this.lastSave = Date.now()
        if (this.active) status.showCurBuffer()
    }

    markCached() {
        this.cached = true
        this.lastCached = Date.now()
    }

    isSavedAfter(timestamp) {
        return (timestamp < this.lastSave)
    }

    isCachedAfter(timestamp) {
        return (timestamp < this.lastCached)
    }

    isDirty() {
        return this.dirty
    }

    isCached() {
        return this.cached 
    }

    isAttached() {
        return this.attached 
    }

    syncIn() {
        if (env.debug) console.log('syncing...')
        if (!this.control) throw `Can't sync in - [${this.name}] is expected to be binded`
        if (!this.active) throw `Can't sync in - [${this.name}] is hibernated`
        this.text = html2text(this.control.jed.innerHTML)
        this.outOfSync = false
    }

    getLastSave() {
        return this.lastSave
    }

    getPath() {
        return this.path
    }

    setText(text) {
        this.text = text
    }

    getText() {
        if (this.active && this.outOfSync) this.syncIn()
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

    title() {
        return this.path
    }
}

export class BufferControl {

    constructor() {
        this.currentBuffer = null
        this.buffers = []
        this.snaps = []
        for (let i = 0; i < 10; i++) {
            this.createSnapAt(i)
        }
        this.dir = {}
    }

    bind(jed) {
        this.jed = jed
    }

    getBindedElement() {
        return this.jed
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

        if (buffer.attached && !buffer.readOnly) {
            this.buffers.push(buffer)
            if (buffer.path) this.dir[buffer.path] = buffer
        }
        return buffer
    }

    activate(buffer) {
        if (!buffer) return
        this.hibernateCurrent()
        buffer.activate()
    }

    refreshCurrent() {
        if (!this.currentBuffer) return
        this.currentBuffer.activate()
    }

    activateAt(index) {
        this.activate( this.buffers[index] )
    }

    createSnapAt(i) {
        const buffer = new Buffer({
            path: '!snap' + i,
            text: '',
            attached:  false,
            readOnly:  false,
            snapOnly:  true,
            plainText: true,
        })
        buffer.bind(this)
        this.snaps[i] = buffer
    }

    setSnapAt(i, text) {
        if (!this.snaps[i]) this.createSnapAt(i)
        this.snaps[i].setText(text)
    }

    snapAt(index) {
        if (!Number.isInteger(index) || isNaN(index)) {
            console.error(`Can't open snap [${snapNumberPath}]!`)
            return
        }
        if (!this.snaps[index]) {
            console.log(`creating extra snap #${index}`)
            this.createSnapAt(index)
        }
        this.activate( this.snaps[index] )
    }

    getSnaps() {
        return this.snaps
    }

    openSnap(path) {
        // cut the "!snap" part from path
        const snapNumberPath = path.substring(5)
        const index = parseInt(snapNumberPath)
        this.snapAt(index)
    }

    open(path) {
        const buffer = this.dir[path]
        if (!buffer) return
        this.activate(buffer)
        return buffer
    }

    htmlList() {
        return this.buffers.map(buf => `<li> <a href="#${buf.path}">${buf.name}: ${buf.path}</a>`).join('\n')
    }

    current() {
        return this.currentBuffer
    }

    currentText() {
        if (!this.currentBuffer) return ''
        return this.currentBuffer.getText()
    }

    dirtyBefore(before) {
        return this.buffers.filter(buf => buf.isAttached() && buf.isDirty() && buf.getLastSave() < before)
    }

    hintDirty() {
        if (!this.jed) return 
        const cbuf = this.currentBuffer
        if (!cbuf) return

        if (cbuf.isDirty()) {
            const width = document.documentElement.style.getPropertyValue('--frame-width-dirty') || '3px'
            document.documentElement.style.setProperty('--frame-width', width)
        } else {
            const width = document.documentElement.style.getPropertyValue('--frame-width-clean') || '1px'
            document.documentElement.style.setProperty('--frame-width', width)
        }
    }
}

export const bufferControl = new BufferControl()

