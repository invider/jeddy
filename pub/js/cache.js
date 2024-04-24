import env from './env.js'
import { bufferControl } from './buffer.js'

function saveBuffer(buffer) {
    if (!env.common) return false // common env must be loaded in order to form workspace-specific id
    if (!buffer) return false
    if (buffer.snapOnly) {
        return saveSnaps()
    }
    if (!buffer.attached) return false
    if (buffer.readOnly) {
        if (env.trace) console.log(`ignoring cache for read-only [${buffer.path}]`)
        return false
    }
    const path = buffer.getPath()
    if (!path || path.startsWith('!')) {
        if (env.trace) console.log(`ignoring save for the special path: [${path}]`)
        return false
    }
    const txt = buffer.getText()

    const id = '@:' + env.common.workspace + ':' + path
    if (env.trace) console.log('caching buffer: ' + id)
    localStorage.setItem(id, txt)
    buffer.markCached()
    return true
}

function saveSnaps() {
    const snaps = bufferControl.getSnaps()
    const list = snaps.map(buf => {
        if (buf) {
            return buf.getText()
        }
    })
    const id = '@:' + env.common.workspace + ':!snaps'

    const data = {
        snaps: list,
    }
    const raw = JSON.stringify(data)

    localStorage.setItem(id, raw)

    snaps.forEach(buf => {
        if (buf) {
            buf.markCached()
        }
    })
    return true
}

function loadBuffer(path) {
    if (!env.common) return // common env must be loaded in order to form workspace-specific id
    // load from cache
    const id = '@:' + env.common.workspace + ':' + path
    const txt = localStorage.getItem(id)
    if (txt) {
        if (env.trace) console.log('loaded from cache: ' + id)
    }
    return txt
}

function loadSnaps() {
    const id = '@:' + env.common.workspace + ':!snaps'
    if (env.trace) console.log('restoring snaps from ' + id)
    const raw = localStorage.getItem(id)
    if (!raw) return false

    const data = JSON.parse(raw)
    if (!data || (typeof data !== 'object') || !data.snaps) return false
    data.snaps.forEach((snap, i) => {
        if (snap) {
            bufferControl.setSnapAt(i, snap)
        }
    })

    return true
}

function clearBuffer(buffer) {
    if (!env.common) return // common env must be loaded in order to form workspace-specific id
    if (!buffer) return
    const path = buffer.getPath()
    if (!path || path.startsWith('!')) return

    const id = '@:' + env.common.workspace + ':' + path
    if (env.trace) console.log('clearing buffer: ' + id)
    localStorage.removeItem(id)
}

export default {
    saveBuffer,
    loadBuffer,
    loadSnaps,
    clearBuffer,
}
