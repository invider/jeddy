import { html2text, text2html } from './parser.js'
import { bufferControl } from './buffer.js'
import { load, save } from './fs.js'

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
    const buf = bufferControl.create({
        jed,
        path,
        text,
        attached:  true,
        readOnly:  false,
        plainText: true,
    })
    env.path = path
    showStatus( buf.status() )
}

function view(text, path) {
    const jed = document.getElementById('jed')
    const buf = bufferControl.create({
        jed,
        path,
        text,
        attached:  true,
        readOnly:  true,
        plainText: true,
    })
    env.path = path
    showStatus( buf.status() )
}

function showHTML(text, path) {
    const jed = document.getElementById('jed')
    const buf = bufferControl.create({
        jed,
        path,
        text,
        attached:  false,
        readOnly:  true,
        plainText: false,
    })
    env.path = path
    showStatus( buf.status() )
}

function showStatus(msg, timeout) {
    msg = msg || '&nbsp;'
    const status = document.getElementById('status')
    status.innerHTML = msg
}

const saveHandlers = {
    onSuccess: function() {
        const buf = bufferControl.current()
        buf.markSaved()
        showStatus( buf.status() )
    },
    onFailure: function() {
        showStatus(`Can't save !${path}`)
    },
}

const loadHandlers = {
    onText: function(path, text, readOnly) {
        if (readOnly) {
            view(text, path)
        } else {
            edit(text, path)
        }
    },
    onRaw: function(path, text, readOnly) {
        showHTML(text, path)
    },
    onFailure: function(path, text) {
        showHTML(text, path)
    }
}

function openPath(url, path, readOnly) {
    // try to find in buffers
    if (bufferControl.open(path)) {
        console.log(`buffered: ${url}`)
        env.path = path
        showStatus(path)
        return
    }

    load(url, path, loadHandlers, readOnly)
}

function help() {
    const path = '.help'
    openPath('man/help.txt', path, true)
    window.location.hash = path
}

function buffers() {
    const path = '.buffers'
    const ls = bufferControl.list()
    showHTML(ls, path)
    env.path = path
    showStatus(path)
    window.location.hash = path
}

function list() {
    window.location.hash = ''
    sync()
}

function sync() {
    const path = window.location.hash.substring(1)

    if (path === '.help') help()
    else if (path === '.buffers') buffers()
    else openPath('jed/load/' + path, path)
}

function check() {
    const now = Date.now()
    const buf = bufferControl.current()
    if (!buf) return

    const passed = now - buf.getLastSave()
    if (buf.isDirty() && passed > env.autoSave * 1000) {
        save(buf, saveHandlers, true)
    }
}

window.onhashchange = function() {
    sync()
}

window.onkeydown = function(e) {
    const buf = bufferControl.current()
    let stop = false

    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch(e.code) {
            case 'F1':      help(); stop = true; break;
            case 'F2':      save(buf, saveHandlers); stop = true; break;
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
            case 'KeyS': save(buf, saveHandlers); stop = true; break;
            case 'KeyQ': list(); stop = true; break;
            case 'KeyB': buffers(); stop = true; break;
            case 'KeyM': switchTheme();  stop = true; break;
            case 'KeyL': switchLayout(); stop = true; break;

            case 'Digit1': bufferControl.activateAt(0); stop = true; break;
            case 'Digit2': bufferControl.activateAt(1); stop = true; break;
            case 'Digit3': bufferControl.activateAt(2); stop = true; break;
            case 'Digit4': bufferControl.activateAt(3); stop = true; break;
            case 'Digit5': bufferControl.activateAt(4); stop = true; break;
            case 'Digit6': bufferControl.activateAt(5); stop = true; break;
            case 'Digit7': bufferControl.activateAt(6); stop = true; break;
            case 'Digit8': bufferControl.activateAt(7); stop = true; break;
            case 'Digit9': bufferControl.activateAt(8); stop = true; break;
        }
    }

    if (buf && !buf.isDirty() && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const jed = document.getElementById('jed')
        if (document.activeElement === jed) {
            // the movement inside the jed element
            buf.touch()
            showStatus( buf.status() )
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
