import { html2text, text2html } from './parser.js'
import { load, save, saveSilent } from './fs.js'
import { bufferControl } from './buffer.js'
import { stat } from './stat.js'

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
    key: {},
}
window.env = env

function focus() {
    const jed = document.getElementById('jed')
    jed.focus()
}

function onChange() {
    const jed = document.getElementById('jed')
    if (document.activeElement !== jed) return

    const buf = bufferControl.current()
    if (!buf) return

    buf.touch()
    showCurBufferStatus()
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
    showCurBufferStatus()
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
    showCurBufferStatus()
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
    showCurBufferStatus()
}

function showStatus(msg, timeout) {
    msg = msg || '&nbsp;'
    const status = document.getElementById('status')
    status.innerHTML = msg
}

function showCurBufferStatus() {
    const cbuf = bufferControl.current()
    if (cbuf) {
        bufferControl.hintDirty()
        showStatus( cbuf.status() )
    }
}

const saveHandlers = {
    onSuccess: function(buffer) {
        buffer.markSaved()
        if (buffer.active) showCurBufferStatus()
    },
    onFailure: function(buffer) {
        if (buffer.active) showStatus(`Can't save [${buffer.title()}]`)
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
        showCurBufferStatus()
        return
    }

    load(url, path, loadHandlers, readOnly)
}

function showHelp() {
    const path = '!help'
    openPath('man/help.txt', path, true)
    //window.location.hash = path
}

function showBuffers() {
    const path = '!buffers'
    const htmlList = bufferControl.htmlList()
    showHTML(htmlList, path)
    env.path = path
    showCurBufferStatus()
    window.location.hash = path
}

function showStat() {
    const path = '!stat'
    const html = stat.renderHTML()
    showHTML(html, path)
    env.path = path
    showCurBufferStatus()
    window.location.hash = path
}

function list() {
    window.location.hash = ''
    sync()
}

function sync() {
    const path = window.location.hash.substring(1)
    const curBuffer = bufferControl.current()
    if (curBuffer && curBuffer.path === path) return // already selected

    if (path.startsWith('!')) {
        switch(path) {
            case '!help':
                showHelp()
                break
            case '!buffers':
                showBuffers()
                break
            case '!stat':
                showStat()
                break
        }
    } else {
        openPath('workspace/' + path, path)
    }
}

function dirtyCheck() {
    const before = Date.now() - (env.autoSave * 1000)
    bufferControl.dirtyBefore(before).forEach(buf => {
        saveSilent(buf, saveHandlers)
    })
}

window.onhashchange = function() {
    sync()
}

window.onkeydown = function(e) {
    const buf = bufferControl.current()
    let stop = false

    // control flags
    switch(e.code) {
        case 'ControlLeft':  env.key.lctrl = true; break;
        case 'ControlRight': env.key.rctrl = true; break;
        case 'AltLeft':      env.key.lalt  = true; break;
        case 'AltRight':     env.key.ralt  = true; break;
        case 'MetaLeft':     env.key.lmeta = true; break;
        case 'MetaRight':    env.key.rmeta = true; break;
    }

    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch(e.code) {
            case 'F1':      showHelp();                 stop = true; break;
            case 'F2':      save(buf, saveHandlers);    stop = true; break;
            case 'F3':      list();                     stop = true; break;
            case 'F4':      showBuffers();              stop = true; break;
            case 'F9':      showStat();                 stop = true; break;
            case 'F10':     switchTheme();              stop = true; break;
            case 'F11':     switchLayout();             stop = true; break;
            case 'Escape':  focus();                    stop = true; break;
        }
    }

    if (e.ctrlKey) {
        switch(e.code) {
            case 'Backquote': list();               stop = true; break;
            case 'KeyH': showHelp();                stop = true; break;
            case 'KeyS': save(buf, saveHandlers);   stop = true; break;
            case 'KeyQ': list();                    stop = true; break;
            case 'KeyB': buffers();                 stop = true; break;
            case 'KeyM': switchTheme();             stop = true; break;
            case 'KeyN':                            stop = true; break; // prevent new tab
            case 'KeyL': switchLayout();            stop = true; break;
            case 'Backslash': showStat();           stop = true; break;
            case 'Digit0': showBuffers();           stop = true; break;
        }
    }

    if (env.key.lctrl) {
        switch(e.code) {
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

    if (env.key.rctrl) {
        switch(e.code) {
            case 'Digit1': bufferControl.snapAt(0); stop = true; break;
            case 'Digit2': bufferControl.snapAt(1); stop = true; break;
            case 'Digit3': bufferControl.snapAt(2); stop = true; break;
            case 'Digit4': bufferControl.snapAt(3); stop = true; break;
            case 'Digit5': bufferControl.snapAt(4); stop = true; break;
            case 'Digit6': bufferControl.snapAt(5); stop = true; break;
            case 'Digit7': bufferControl.snapAt(6); stop = true; break;
            case 'Digit8': bufferControl.snapAt(7); stop = true; break;
            case 'Digit9': bufferControl.snapAt(8); stop = true; break;
        }
    }


    if (stop) {
        e.preventDefault()
        e.stopPropagation()
    } else {
        stat.keyStroke(e)
    }
}

window.onkeyup = function(e) {
    // control flags
    switch(e.code) {
        case 'ControlLeft':  env.key.lctrl = false; break;
        case 'ControlRight': env.key.rctrl = false; break;
        case 'AltLeft':      env.key.lalt  = false; break;
        case 'AltRight':     env.key.ralt  = false; break;
        case 'MetaLeft':     env.key.lmeta = false; break;
        case 'MetaRight':    env.key.rmeta = false; break;
    }
}

window.onload = function() {
    const jed = document.getElementById('jed')
    jed.onblur = () => focus() // stay always in focus
    jed.oncut    = onChange
    jed.onpaste  = onChange
    jed.ondelete = onChange
    jed.mouseup  = onChange
    jed.onkeyup  = function(e) {
        // no change escape cases
        if (e.ctrlKey || e.metaKey || e.altKey) return
        switch(e.code) {
            case 'F1': case 'F2': case 'F3': case 'F4': case 'F5': case 'F6':
            case 'F7': case 'F8': case 'F9': case 'F10': case 'F11': case 'F12': case 'F13':
            case 'ArrowUp': case 'ArrowLeft': case 'ArrowDown': case 'ArrowRight':
            case 'Home': case 'End': case 'PageUp': case 'PageDown':
            case 'CapsLock': case 'ScrollLock': case 'NumLock':
            case 'ShiftLeft': case 'ShiftRight':
            case 'ControlLeft': case 'ControlRight': case 'AltLeft': case 'AltRight':
            case 'MetaLeft': case 'MetaRight': case 'ContextMenu':
            case 'Insert': case 'Pause':
            case 'Escape':
                return
        }
        onChange()
    }
    bufferControl.bind(jed)

    // determine the theme if stored
    const themeStr = localStorage.getItem('theme')
    if (themeStr) switchTheme(parseInt(themeStr))

    // determine the layout if stored
    const layoutStr = localStorage.getItem('layout')
    if (layoutStr) switchLayout(parseInt(layoutStr))

    sync()

    setInterval(dirtyCheck, 1000)
}
