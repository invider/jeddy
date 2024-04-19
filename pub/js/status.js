import { bufferControl } from './buffer.js'

export function showStatus(msg, timeout) {
    msg = msg || '&nbsp;'
    const status = document.getElementById('status')
    status.innerHTML = msg
}

export function showCurBufferStatus() {
    const cbuf = bufferControl.current()
    if (cbuf) {
        bufferControl.hintDirty()
        showStatus( cbuf.status() )
    }
}

