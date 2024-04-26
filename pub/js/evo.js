import status from './status.js'

let timer = 0
let lastEvo = Date.now()

export function evo() {
    const now = Date.now()
    const dt = (now - lastEvo) / 1000
    timer += dt

    status.evo(dt)

    lastEvo = now
}
