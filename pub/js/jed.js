import { html2text, text2html } from './parser.js'

const themes = [
    'default',
    'solar',
    'eclipse',
    'dark',
    'amber-term',
    'green-term',
]

const env = {
    path: '',
    dirty: false,
}
window.env = env

function focus() {
    const jed = document.getElementById('jed')
    jed.focus()
}

function mode(itheme) {
    if (itheme === undefined) {
        itheme = (env.itheme || 0) + 1
        if (itheme >= themes.length) itheme = 0
    }

    document.documentElement.setAttribute('data-theme', themes[itheme])

    env.itheme = itheme
    localStorage.setItem('theme', itheme)
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

function save() {
    const path = window.location.hash.substring(1)
    const jed = document.getElementById('jed')
    const txt = html2text(jed.innerHTML)

    const url = 'jed/save/' + path
    console.log(`saving: ${url}`)
    //console.log(txt)

    fetch(url, {
        method: 'post',
        body: txt,
    }).then(res => {
        if (res.status === 200) {
            env.dirty = false
            showStatus('Saved ' + path)
        } else {
            showStatus('Error Saving ' + path)
        }
        return res.text()

    }) .then(response => {
        console.log(response)
    })
}

function sync() {
    const path = window.location.hash.substring(1)

    if (path === '.help') help()
    else editPath('jed/open/' + path, path)
}

window.onload = function() {
    sync()

    // determine the theme
    const theme = localStorage.getItem('theme')
    if (theme) mode(parseInt(theme))

    const jed = document.getElementById('jed')
    jed.onblur = () => focus() // stay always in focus
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
            case 'F10':     mode(); stop = true; break;
            case 'Escape':  focus(); stop = true; break;
        }
    }

    if (e.ctrlKey) {
        switch(e.code) {
            case 'KeyH': help(); stop = true; break;
            case 'KeyS': save(); stop = true; break;
            case 'KeyZ': list(); stop = true; break;
            case 'KeyM': mode(); stop = true; break;
        }
    }

    if (!env.dirty && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const jed = document.getElementById('jed')
        if (document.activeElement === jed) {
            env.dirty = true
            showStatus(env.path)
        }
    }

    if (stop) {
        e.preventDefault()
        e.stopPropagation()
    }
}
