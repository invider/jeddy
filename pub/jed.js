console.log('hi')

function save() {
    const path = window.location.hash.substring(1)
    const jed = document.getElementById('jed')
    const text = jed.innerHTML

    const url = 'jed/save/' + path
    console.log(`saving: ${url}`)
    console.log(text)

    fetch(url, {
        method: 'post',
        body: text,
    }).then(res => res.text())
    .then(text => {
        console.log('text')
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
            jed.innerHTML = text
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
