import { loadJSON, saveRes } from './fs.js'

const CONFIG_URL = 'workspace/.jeddy'

let activeConfig = {
    autoBuf:  5,
    autoSave: 20,
    saveKeeper: 5,
    saveAnyways: 60,
    itheme: 0,
    ilayer: 0,
}

function load(onConfig) {

    loadJSON(CONFIG_URL, {
        onJSON: function(cfg) {
            console.log('loaded config')
            console.dir(cfg)
            activeConfig = cfg
            onConfig(cfg)
        },
        onNotFound: function(text) {
            console.log('using default config:\n' + JSON.stringify(activeConfig, null, 4))
            onConfig(activeConfig)
        },
        onFailure: function(path, text) {
            onConfig(activeConfig)
        },
    })
}

function save() {
    const body = JSON.stringify(activeConfig, null, 4)
    saveRes(CONFIG_URL, body, {
        onSuccess: function() {
        },
        onFailure: function() {
        },
    })
}

export const config = {
    load,
    save,
}
