import { html2md, md2html } from './parser.js'

function save() {
    const path = window.location.hash.substring(1)
    const jed = document.getElementById('jed')
    const txt = html2md(jed.innerHTML)

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

    const url = 'jed/open/' + path
    console.log(`loading: ${url}`)

    fetch(url)
        .then(res => res.text())
        .then(text => {
            const jed = document.getElementById('jed')
            jed.innerHTML = md2html(text)
        })
}

window.onload = function() {
    sync()
}

window.onhashchange = function() {
    sync()
}

window.onkeydown = function(e) {
    if (e.ctrlKey && e.code === 'KeyS') {
        save()
        e.preventDefault()
        e.stopPropagation()
    }
}
