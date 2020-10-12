import { html2text, text2html } from './parser.js'

const themes = [
    'default',
    'solar',
    'eclipse',
    'dark',
]

function focus() {
    const jed = document.getElementById('jed')
    jed.focus()
}

function mode(itheme) {
    if (itheme === undefined) {
        itheme = (window.itheme || 0) + 1
        if (itheme >= themes.length) itheme = 0
    }

    document.documentElement.setAttribute('data-theme', themes[itheme])

    window.itheme = itheme
    localStorage.setItem('itheme', itheme)
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

function editPath(url) {
    console.log(`loading: ${url}`)

    let status = 0
    fetch(url)
        .then(res => {
            status = res.status
            return res.text()
        }).then(text => {
            if (status === 200) {
                edit(text)
            } else {
                show(text)
            }
        })
}

function help() {
    editPath('man/help.txt')
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
    console.log(txt)

    fetch(url, {
        method: 'post',
        body: txt,
    }).then(res => res.text())
    .then(response => {
        console.log(response)
    })
}

function sync() {
    const path = window.location.hash.substring(1)

    if (path === '.help') help()
    else editPath('jed/open/' + path)
}

window.onload = function() {
    sync()
    const theme = localStorage.getItem('itheme')
    if (theme) mode(parseInt(theme))
}

window.onhashchange = function() {
    sync()
}

window.onkeydown = function(e) {
    let stop = false

    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch(e.code) {
            case 'F1':  help(); stop = true; break;
            case 'F2':  save(); stop = true; break;
            case 'F3':  list(); stop = true; break;
            case 'F10': mode(); stop = true; break;
            case 'Escape': focus(); stop = true; break;
        }
    }

    if (e.ctrlKey) {
        switch(e.code) {
            case 'KeyS': save(); stop = true; break;
            case 'KeyZ': mode(); stop = true; break;
        }
    }

    if (stop) {
        e.preventDefault()
        e.stopPropagation()
    }
}
