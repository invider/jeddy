import env from './env.js'

export function saveBuffer(buffer) {
}

export function loadBuffer(buffer) {

}

export function clearBuffer(buffer) {
    console.log('clearing buffer')
    console.log('workspace: ' + env.common.workspace)
    console.dir(buffer)
}

export default {
    saveBuffer,
    loadBuffer,
    clearBuffer,
}
