import { html2text, text2html } from './parser.js'
import { load, loadJSON, save, saveSilent } from './fs.js'
import { bufferControl } from './buffer.js'
import { stat } from './stat.js'
import env from './env.js'
import { config } from './config.js'

const themes = [
    'default',
    'solar',      // light solarized
    'eclipse',    // dark solarized
    'dark',
    'amber-term',
    'green-term',
    'e-ink',
]

const fonts = [
    'PixelOperator',
    'PixelOperatorMono',
    'iAWriterDuospace',
    'LibreBaskerville-Regular',
    'monof55',
    'SHPinscher-Regular',
    'UnderwoodChampion',
]

const layouts = [
    'full',
    'minimal',
]

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

function switchTheme(itheme, noSave) {
    if (itheme === undefined) {
        itheme = (env.config.itheme || 0) + 1
        if (itheme >= themes.length) itheme = 0
    }

    console.log('theme: ' + themes[itheme])
    document.documentElement.setAttribute('data-theme', themes[itheme])

    env.config.itheme = itheme
    //localStorage.setItem('theme', itheme)
    if (!noSave) config.save()
}

function switchFont(font, noSave) {
    let ifont = 0
    if (font) {
        ifont = fonts.indexOf(font)
        if (ifont < 0 || ifont >= fonts.length) ifont = 0
    } else {
        const root = document.documentElement
        const style = getComputedStyle(root)
        const curFont = style.getPropertyValue('--primary-font')

        let prevFont = ''
        if (curFont) prevFont = curFont.replace("'", "").trim()

        ifont = fonts.indexOf(prevFont)
        ifont ++
        if (ifont >= fonts.length) ifont = 0
        font = fonts[ifont]
    }

    const nextFont = fonts[ifont]
    console.log(`font: ${nextFont}(${ifont + 1})`)
    document.documentElement.style.setProperty('--primary-font', nextFont)

    env.config.font = font
    //localStorage.setItem('font', font)
    if (!noSave) config.save()
}

function switchLayout(ilayout, noSave) {
    if (ilayout === undefined) {
        if (env.config.ilayout === undefined) {
            ilayout = 0
        } else {
            ilayout = env.config.ilayout + 1
        }
    }
    if (ilayout >= layouts.length) {
        ilayout = 0
    }

    console.log('layout: ' + layouts[ilayout])
    const status = document.getElementById('status')
    switch(ilayout) {
        case 0:
            status.style.display = 'block'
            break
        case 1:
            status.style.display = 'none'
            break
    }
    env.config.ilayout = ilayout
    if (!noSave) config.save()
}

function applyConfig(cfg, noSave) {
    if (cfg.itheme !== undefined) switchTheme(cfg.itheme, noSave)
    if (cfg.font !== undefined) switchFont(cfg.font, noSave)
    if (cfg.ilayout !== undefined) switchLayout(cfg.ilayout, noSave)
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

function onText(path, text, readOnly) {
    if (readOnly) {
        view(text, path)
    } else {
        edit(text, path)
    }
}

const loadHandlers = {
    onText: onText,
    onRaw: function(path, text, readOnly) {
        showHTML(text, path)
    },
    onNotFound: onText,
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
    const now = Date.now()
    const before = now - ((env.config.autoSave || 20) * 1000)
    bufferControl.dirtyBefore(before).forEach(buf => {
        if (buf.active) {
            const saveThreshold = now - ((env.config.saveKeeper || 3) * 1000) 
            if (buf.isTouchedAfter(saveThreshold)) {
                const hardSaveDeadline = now - ((env.config.hardAutoSave || 60) * 1000)
                if (!buf.isSavedAfter(hardSaveDeadline)) {
                    console.log('saving anyways')
                    saveSilent(buf, saveHandlers)
                } else {
                    console.log('ignore save - touched')
                }
            } else {
                saveSilent(buf, saveHandlers)
            }
        } else {
            saveSilent(buf, saveHandlers)
        }
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
            case 'KeyL': switchLayout();            stop = true; break;
            case 'F10':
            case 'KeyI': switchFont();              stop = true; break;
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

    /*
    // load common env
    loadJSON('/envc', {
        onJSON: function(envc) {
            console.log('loaded common env')
            console.dir(envc)
        },
        onNotFound: function() {
            console.err('common env not found!')
        },
        onFailure: function(url, message, e) {
            console.err('unable to load common env: ' + message)
        },
    })
    */
    env.loadEnvc()

    // load the config
    config.load((config) => {
        env.config = config
        applyConfig(env.config, true)
    })


    /*
    // determine the theme if stored
    const themeStr = localStorage.getItem('theme')
    if (themeStr) switchTheme(parseInt(themeStr))

    // determine the font if stored
    const font = localStorage.getItem('font')
    if (font) switchFont(font)

    // determine the layout if stored
    const layoutStr = localStorage.getItem('layout')
    if (layoutStr) switchLayout(parseInt(layoutStr))
    */

    sync()

    setInterval(dirtyCheck, 1000)
}
