import env from './env.js'

export function saveBuffer(buffer) {
    if (!env.common) return // common env must be loaded in order to form workspace-specific id
    if (!buffer) return
    if (!buffer.attached) return
    if (buffer.readOnly) {
        if (env.trace) console.log(`ignoring cache for read-only [${buffer.path}]`)
        return
    }
    const path = buffer.getPath()
    if (!path || path.startsWith('!')) {
        if (env.trace) console.log(`ignoring save for the special path: [${path}]`)
        return
    }
    const txt = buffer.getText()

    const id = '@:' + env.common.workspace + ':' + path
    if (env.trace) console.log('caching buffer: ' + id)
    localStorage.setItem(id, txt)
    buffer.markCached()
}

export function loadBuffer(path) {
    if (!env.common) return // common env must be loaded in order to form workspace-specific id
    // load from cache
    const id = '@:' + env.common.workspace + ':' + path
    const txt = localStorage.getItem(id)
    if (txt) {
        if (env.trace) console.log('loaded from cache: ' + id)
    }
    return txt
}

export function clearBuffer(buffer) {
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
    clearBuffer,
}
