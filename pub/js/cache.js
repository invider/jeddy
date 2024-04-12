import env from './env.js'

export function saveBuffer(buffer) {
    const id = env.common.workspace + ':' + buffer.path
    console.log('caching buffer: ' + id)
    console.dir(buffer)

    buffer.markCached()
}

export function loadBuffer(path) {
    // load from cache
    const id = env.common.workspace + ':' + path
    console.log('loading buffer: ' + id)
}

export function clearBuffer(buffer) {
    const id = env.common.workspace + ':' + buffer.path
    console.log('clearing buffer: ' + id)
    console.dir(buffer)
}

export default {
    saveBuffer,
    loadBuffer,
    clearBuffer,
}
