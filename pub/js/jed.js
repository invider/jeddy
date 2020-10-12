import { html2text, text2html } from './parser.js'

function edit(text) {
    const jed = document.getElementById('jed')
    jed.contentEditable = true
    jed.innerHTML = text2html(text)
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
}

window.onhashchange = function() {
    sync()
}

window.onkeydown = function(e) {

    if (e.code === 'F1') {
        help()
        e.preventDefault()
        e.stopPropagation()
    }

    if (e.ctrlKey && e.code === 'KeyS') {
        save()
        e.preventDefault()
        e.stopPropagation()
    }
}
