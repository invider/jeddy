let lastStatus = 0

import cache from './cache.js'
import { stat } from './stat.js'
import env from './env.js'

export function load(url, path, handlers, readOnly) {
    // try to get from cache
    const cachedText = cache.loadBuffer(path)
    if (cachedText) {
        console.log('restoring: ' + path)
        handlers.onText(path, cachedText, readOnly, true)
        return
    }

    // load from the jeddy server
    console.log(`loading: ${url}`)
    let status = 0
    fetch(url)
        .then(res => {
            status = res.status
            return res.text()
        }).then(text => {
            if (status === 200) {
                // 200 OK - got a file content
                handlers.onText(path, text, readOnly)
            } else if (status === 303) {
                // 303 See Other - got a directory listing
                handlers.onRaw(path, text, readOnly)
            } else if (status === 404) {
                // 404 Not Found - a new file to create
                handlers.onNotFound(path, '', readOnly)
            } else {
                console.error(text)
                handlers.onFailure(path, text)
            }
        })
}

export function save(buffer, handlers, silent) {
    if (!buffer) return
    if (!buffer.attached) return
    if (buffer.readOnly) {
        if (!silent) console.log(`ignoring save for read-only [${buffer.path}]`)
        return
    }
    const path = buffer.getPath()
    if (!path || path.startsWith('!')) {
        if (!silent) console.log(`ignoring save for the special path: [${path}]`)
        return
    }
    if (env.debug) console.dir(buffer)

    const txt = buffer.getText()

    const url = 'workspace/' + path
    if (!silent) console.log(`saving: ${url}`)

    fetch(url, {
        method: 'post',
        body: txt,
    }).then(res => {
        if (res.status === 200) {
            cache.clearBuffer(buffer)
            buffer.markCached()
            if (handlers && handlers.onSuccess) {
                handlers.onSuccess(buffer)
            }
            /*
            const buf = bufferControl.current()
            buf.markSaved()
            action.showStatus(path)
            */
        } else {
            if (handlers && handlers.onFailure) {
                handlers.onFailure(buffer)
            }
            //action.showStatus(`Can't save !${path}`)
        }
        lastStatus = res.status
        return res.text()

    }).then(response => {
        if (lastStatus !== 200) {
            console.error(`#${lastStatus}: ${response}`)
        }
    })

    stat.save()
}

export function saveSilent(buffer, handlers) {
    return save(buffer, handlers, true)
}

export function loadRes(url, handlers) {
    // load a resource
    console.log(`loading: ${url}`)

    let status = 0
    fetch(url)
        .then(res => {
            status = res.status
            return res.text()
        }).then(text => {
            if (status === 200) {
                // 200 OK
                handlers.onText(text)
            } else if (status === 404) {
                // 404 Not Found
                handlers.onNotFound('')
            } else {
                handlers.onFailure(text)
            }
        })
}

export function loadJSON(url, handlers) {
    loadRes(url, {
        onText: function(text) {
            try {
                const json = JSON.parse(text)
                handlers.onJSON(json)
            } catch (e) {
                console.error(e)
                handlers.onFailure(url, e.toString(), e)
            }
        },
        onNotFound: handlers.onNotFound,
        onFailure: handlers.onFailure,
    })
}

export function saveRes(url, text, handlers) {
    let lastStatus = 0

    fetch(url, {
        method: 'post',
        body: text,
    }).then(res => {
        if (res.status === 200) {
            if (handlers && handlers.onSuccess) {
                handlers.onSuccess(res)
            }
        } else {
            console.error(res)
            if (handlers && handlers.onFailure) {
                handlers.onFailure(res)
            }
        }
        lastStatus = res.status
        return res.text()

    }).then(response => {
        if (lastStatus !== 200) {
            console.error(`#${lastStatus}: ${response}`)
        }
    })
}
