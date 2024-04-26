import { bufferControl } from './buffer.js'

let message = ''
let subMessage = ''
let timer = 0

function sync(msg) {
    const status = document.getElementById('status')
    status.innerHTML = msg
}

export function evo(dt) {
    if (timer <= 0) return
    
    timer -= dt
    if (timer <= 0) {
        sync(message)
    }
}

export function show(msg, timeout) {
    msg = msg || '&nbsp;'

    if (timeout) {
        subMessage = msg
        timer = timeout
        sync(subMessage)
    } else {
        message = msg
        if (timer <= 0) {
            sync(message)
        }
    }
}

export function showCurBuffer() {
    const cbuf = bufferControl.current()
    if (cbuf) {
        bufferControl.hintDirty()
        show( cbuf.status() )
    }
}

export default {
    evo,
    show,
    showCurBuffer,
}
