import { loadJSON, saveRes } from './fs.js'

const STAT_URL = 'workspace/.stat'

class Session {

    constructor() {
        this.started = Date.now()
        this.closed = 0
        this.keyStrokes = 0
        this.words = 0
    }

    keyStroke(e) {
        this.keyStrokes ++
        if (e.key && e.key.length === 1) {
            this.lastLiteral = true
        } else {
            this.lastLiteral = false
        }
        if (e.code === 'Enter' || e.code === 'Space') {
            if (this.lastLiteral) {
                this.words ++
            }
        }
    }

    getKeyStrokes() {
        return this.keyStrokes
    }

    getWords() {
        return this.words
    }

    getLength() {
        let sec = Math.round((Date.now() - this.started) / 1000)
        let h = Math.floor(sec / 3600)
        sec = sec % 3600
        let m = Math.floor(sec / 60)
        sec = sec % 60

        const hh = h? `${h}h ` : ''
        const mm = m? `${m}m ` : ''
        const sc = `${sec}s`

        return `${hh}${mm}${sc}`
    }

}

class Stat {

    constructor() {
        this.activeSession = new Session()
    }

    keyStroke(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return
        this.activeSession.keyStroke(e)
    }

    renderHTML() {
        const as = this.activeSession
        const started = new Date(as.started)
        return [
            `<h3>Session Stat</h3>\n`,
            `<hr>\n`,
            `started: ${started.toString()}\n`,
            `<br>length: ${as.getLength()}\n`,
            `<hr>\n`,
            `words: ${as.getWords()}\n`,
            `<br>keystrokes: ${as.getKeyStrokes()}\n`,
        ].join('')
    }

    renderJSON() {
        return {
           activeSession: this.activeSession,
        }
    }

    restore(rstat) {
        console.log('restoring from')
        console.dir(rstat)
    }

    load() {
        const stat = this
        loadJSON(STAT_URL, {
            onJSON: function(restoredStat) {
                console.log('loaded stat')
                console.dir(restoredStat)
                stat.restore(restoredStat)
            },
            onNotFound: function(path, text) {
                console.log('no existing stat found, creating new')
            },
            onFailure: function(path, text) {
                console.log('unable to load stat')
            },
        })
    }

    save() {
        const json = this.renderJSON()
        const body = JSON.stringify(json, null, 4)
        saveRes(STAT_URL, body, {
            onSuccess: function() {
            },
            onFailure: function() {
            },
        })
    }
}

export const stat = new Stat()
