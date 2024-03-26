import { html2text, text2html } from './parser.js'
import { bufferControl } from './buffer.js'

const themes = [
    'default',
    'solar',      // light solarized
    'eclipse',    // dark solarized
    'dark',
    'amber-term',
    'green-term',
    'e-ink',
]

const env = {
    path: '',
    dirty: false,
    lastSave: 0,
    autoSave: 20,
    itheme:   0,
    ilayout:  0,
}
window.env = env

function focus() {
    const jed = document.getElementById('jed')
    jed.focus()
}

function switchTheme(itheme) {
    if (itheme === undefined) {
        itheme = (env.itheme || 0) + 1
        if (itheme >= themes.length) itheme = 0
    }

    console.log('theme: ' + themes[itheme])
    document.documentElement.setAttribute('data-theme', themes[itheme])

    env.itheme = itheme
    localStorage.setItem('theme', itheme)
}

function switchLayout(ilayout) {
    if (ilayout === undefined) {
        ilayout = env.ilayout + 1
    }
    if (ilayout > 1) {
        ilayout = 0
    }

    console.log('layout: ' + ilayout)
    const status = document.getElementById('status')
    switch(ilayout) {
        case 0:
            status.style.display = 'block'
            break
        case 1:
            status.style.display = 'none'
            break
    }
    env.ilayout = ilayout
    localStorage.setItem('layout', ilayout)
}

function edit(text, path) {
    const jed = document.getElementById('jed')
    bufferControl.createBuffer({
        jed,
        path,
        text,
        attached:  true,
        readOnly:  false,
        plainText: true,
    })
    //jed.contentEditable = true
    //jed.innerHTML = text2html(text)
    //jed.focus()
    env.path = path
    showStatus(path)
}

function view(text, path) {
    const jed = document.getElementById('jed')
    bufferControl.createBuffer({
        jed,
        path,
        text,
        attached:  true,
        readOnly:  true,
        plainText: true,
    })
    //jed.contentEditable = true
    //jed.innerHTML = text2html(text)
    //jed.focus()
    env.path = path
    showStatus(path)
}

function showHTML(text, path) {
    const jed = document.getElementById('jed')
    //jed.contentEditable = false
    //jed.innerHTML = text
    bufferControl.createBuffer({
        jed,
        path,
        text,
        attached:  false,
        readOnly:  true,
        plainText: false,
    })
    env.path = path
    showStatus(path)
}

function showStatus(msg, timeout) {
    msg = msg || '&nbsp;'
    const status = document.getElementById('status')
    status.innerHTML = msg
}

function openPath(url, path) {
    // try to find in buffers
    if (bufferControl.openBuffer(path)) {
        console.log(`buffered: ${url}`)
        env.path = path
        showStatus(path)
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
                edit(text, path)
                //env.path = path
                //showStatus(path)
            } else if (status === 303) {
                showHTML(text, path)
                //env.path = path
                //showStatus(path)
            } else if (status === 404) {
                // new file
                edit('', path)
            } else {
                showHTML(text, '!error')
                //env.path = ''
                //showStatus('')
            }
        })
}

function help() {
    const path = '.help'
    openPath('man/help.txt', path)
    window.location.hash = path
}

function buffers() {
    const path = '.buffers'
    const ls = bufferControl.listBuffers()
    showHTML(ls, path)
    env.path = path
    showStatus(path)
    window.location.hash = path
}

function list() {
    window.location.hash = ''
    sync()
}

function save(silent) {
    const path = window.location.hash.substring(1)
    const jed = document.getElementById('jed')
    const txt = html2text(jed.innerHTML)

    const url = 'jed/save/' + path
    if (!silent) console.log(`saving: ${url}`)

    fetch(url, {
        method: 'post',
        body: txt,
    }).then(res => {
        if (res.status === 200) {
            env.dirty = false
            env.lastSave = Date.now()
            showStatus(path)
        } else {
            showStatus(`Can't save !${path}`)
        }
        return res.text()

    }) .then(response => {
        //console.log(response)
    })
}

function sync() {
    const path = window.location.hash.substring(1)

    if (path === '.help') help()
    else if (path === '.buffers') buffers()
    else openPath('jed/load/' + path, path)
}

function check() {
    const now = Date.now()
    const passed = now - env.lastSave
    if (env.dirty && passed > env.autoSave * 1000) {
        save(true)
    }
}

window.onhashchange = function() {
    sync()
}

window.onkeydown = function(e) {
    let stop = false

    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch(e.code) {
            case 'F1':      help(); stop = true; break;
            case 'F2':      save(); stop = true; break;
            case 'F3':      list(); stop = true; break;
            case 'F4':      buffers(); stop = true; break;
            case 'F10':     switchTheme();  stop = true; break;
            case 'F11':     switchLayout(); stop = true; break;
            case 'Escape':  focus(); stop = true; break;
        }
    }

    if (e.ctrlKey) {
        switch(e.code) {
            case 'KeyH': help(); stop = true; break;
            case 'KeyS': save(); stop = true; break;
            case 'KeyQ': list(); stop = true; break;
            case 'KeyB': buffers(); stop = true; break;
            case 'KeyM': switchTheme();  stop = true; break;
            case 'KeyL': switchLayout(); stop = true; break;
        }
    }

    if (!env.dirty && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const jed = document.getElementById('jed')
        if (document.activeElement === jed) {
            env.dirty = true
            env.lastSave = Date.now()
            showStatus(`*${env.path}`)
        }
    }

    if (stop) {
        e.preventDefault()
        e.stopPropagation()
    }
}

window.onload = function() {
    sync()

    // determine the theme if stored
    const themeStr = localStorage.getItem('theme')
    if (themeStr) switchTheme(parseInt(themeStr))

    // determine the layout if stored
    const layoutStr = localStorage.getItem('layout')
    if (layoutStr) switchLayout(parseInt(layoutStr))


    const jed = document.getElementById('jed')
    jed.onblur = () => focus() // stay always in focus

    setInterval(check, 1000)
}
