import { loadJSON } from './fs.js'

const ENVC_URL   = '/envc'

const defaultEnvc = {
    "debug": true,
    "trace": true,
    "workspace": "default"
}

const env = {
    path: '',
    key: {},
}

function loadEnvc() {
    loadJSON(ENVC_URL, {
        onJSON: function(envc) {
            env.common = envc
        },
        onNotFound: function(path, text) {
            env.common = defaultEnvc
        },
        onFailure: function(path, text) {
            env.common = defaultEnvc
        },
    })
}
env.loadEnvc = loadEnvc

export default env

