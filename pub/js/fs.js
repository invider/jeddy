let lastStatus = 0

export function load(url, path, handlers) {
    // load from the jeddy server
    console.log(`loading: ${url}`)
    let status = 0
    fetch(url)
        .then(res => {
            status = res.status
            return res.text()
        }).then(text => {
            if (status === 200) {
                handlers.onSuccess(path, text)
                //action.edit(text, path)
            } else if (status === 303) {
                handlers.onList(path, text)
                //action.showHTML(text, path)
            } else if (status === 404) {
                // new file
                handlers.onSuccess(path, '')
                //action.edit('', path)
            } else {
                handlers.onFailure(path, text)
                //action.showHTML(text, '!error')
            }
        })
}

// TODO move to external service and accept a buffer to save
export function save(buffer, handlers, silent) {
    //const path = window.location.hash.substring(1)
    //const jed = document.getElementById('jed') // TODO get the content from the buffer
    //const txt = html2text(jed.innerHTML)
    if (!buffer) return
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
