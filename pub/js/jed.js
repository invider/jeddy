import { html2text, text2html } from './parser.js'

const themes = [
    'default',
    'solar',
    'eclipse',
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

function edit(text) {
    const jed = document.getElementById('jed')
    jed.contentEditable = true
    jed.innerHTML = text2html(text)
    jed.focus()
}

function show(text) {
    const jed = document.getElementById('jed')
    jed.contentEditable = false
    jed.innerHTML = text
}

function showStatus(msg, timeout) {
    msg = msg || '&nbsp;'
    const status = document.getElementById('status')
    status.innerHTML = msg
}

function editPath(url, path) {
    console.log(`loading: ${url}`)

    let status = 0
    fetch(url)
        .then(res => {
            status = res.status
            return res.text()
        }).then(text => {
            if (status === 200) {
                edit(text)
                env.path = path
                showStatus(path)
            } else if (status === 303) {
                show(text)
                env.path = path
                showStatus(path)
            } else {
                show(text)
                env.path = ''
                showStatus('')
            }
        })
}

function help() {
    editPath('man/help.txt', '')
    window.location.hash = '.help'
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
    else editPath('jed/load/' + path, path)
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
            case 'F10':     switchTheme();  stop = true; break;
            case 'F11':     switchLayout(); stop = true; break;
            case 'Escape':  focus(); stop = true; break;
        }
    }

    if (e.ctrlKey) {
        switch(e.code) {
            case 'KeyH': help(); stop = true; break;
            case 'KeyS': save(); stop = true; break;
            case 'KeyZ': list(); stop = true; break;
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
