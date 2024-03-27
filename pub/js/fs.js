let lastStatus = 0

export function load(url, path, handlers, readOnly) {
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
                handlers.onText(path, '', readOnly)
            } else {
                handlers.onFailure(path, text)
            }
        })
}

// TODO move to external service and accept a buffer to save
export function save(buffer, handlers, silent) {
    //const path = window.location.hash.substring(1)
    //const jed = document.getElementById('jed') // TODO get the content from the buffer
    //const txt = html2text(jed.innerHTML)
    if (!buffer) return
    if (!buffer.attached) return
    if (buffer.readOnly) {
        if (!silent) console.log(`ignoring save for read-only [${buffer.path}]`)
        return
    }
    const path = buffer.getPath()
    const txt = buffer.getText()

    const url = 'jed/save/' + path
    if (!silent) console.log(`saving: ${url}`)

    fetch(url, {
        method: 'post',
        body: txt,
    }).then(res => {
        if (res.status === 200) {
            if (handlers && handlers.onSuccess) {
                handlers.onSuccess()
            }
            /*
            const buf = bufferControl.current()
            buf.markSaved()
            action.showStatus(path)
            */
        } else {
            if (handlers && handlers.onFailure) {
                handlers.onFailure()
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
}
