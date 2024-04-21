import { loadJSON, saveRes } from './fs.js'
import env from './env.js'

const STAT_URL = 'workspace/.stat'

class Session {

    constructor(st) {
        this.started = Date.now()
        this.lastTouch = 0
        this.time = 0
        this.keyStrokes = 0
        this.words = 0

        if (st) this.restore(st)

        if (!this.id) {
            const startedDate = new Date(this.started)
            const year = startedDate.getUTCFullYear()
            const month = startedDate.getUTCMonth() + 1
            const day = startedDate.getUTCDate()
            const smonth = month.toString().padStart(2, '0')
            const sday = day.toString().padStart(2, '0')

            this.id = 'S' + year + '-' + smonth + '-' + sday
        }
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

        // determine timespan
        const now = Date.now()
        const span = (now - this.lastTouch) / 1000
        if (span < (env.config.sessionPause || 180)) {
            // got another active span
            this.time += span
        }
        this.lastTouch = now
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

    snapshot() {
        return {
            id:         this.id,
            started:    this.started,
            time:       Math.floor(this.time),
            keyStrokes: this.keyStrokes,
            words:      this.words,
        }
    }

    restore(st) {
        if (st.id) this.id = st.id
        if (st.started) this.started = st.started
        if (st.time) this.time = st.time
        if (st.keyStrokes) this.keyStrokes = st.keyStrokes
        if (st.words) this.words = st.words
    }
}

class Stat {

    constructor() {
        this.sessions = []
        this.sessionCatalog = {}

        this.globalSession = new Session({
            id: 'GXXXX-XX-XX',
        })
        this.activeSession = new Session()
        this.addSession(this.activeSession)
    }

    addSession(session) {
        if (!session || !session.id) return
        this.removeSession(session)
        this.sessionCatalog[session.id] = session
        this.sessions.push(session)
    }

    removeSession(session) {
        if (!session || !session.id) return
        const id = session.id
        const at = this.indexById(id)
        if (at >= 0) {
            this.sessions.splice(at, 1)
        }
        if (this.sessionCatalog[id]) {
            delete this.sessionCatalog[id]
        }
    }

    indexById(id) {
        if (!id) return -1
        for (let i = 0; i < this.sessions.length; i++) {
            const session = this.sessions[i]
            if (session.id === id) return i
        }
        return -1
    }

    sessionExists(id) {
        if (!id) return false
        if (this.sessionCatalog[id]) return true
        return false
    }

    keyStroke(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return
        this.activeSession.keyStroke(e)
        this.globalSession.keyStroke(e)
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

    snapshot() {
        const snap = {
            globalSession: this.globalSession,
            sessions: [],
        }
        this.sessions.forEach(session => {
            snap.sessions.push(session.snapshot())
        })
        return snap
    }

    restore(rstat) {
        if (env.trace) {
            console.log('restoring stat from the working dir:')
            console.dir(rstat)
        }

        if (rstat.globalSession) {
            this.globalSession = new Session(rstat.globalSession)
        }
        if (rstat.sessions) {
            const stat = this
            rstat.sessions.forEach(rsession => {
                stat.addSession( new Session(rsession) )
            })
        }
        if (this.sessionExists(this.activeSession.id)) {
            // replace current active session with a restored one
            if (env.trace) console.log(`restoring active session [${this.activeSession.id}]`)
            this.activeSession = this.sessionCatalog[this.activeSession.id]
        }
    }

    load() {
        const stat = this
        loadJSON(STAT_URL, {
            onJSON: function(restoredStat) {
                stat.restore(restoredStat)
            },
            onNotFound: function(path, text) {
                console.log('no existing stat found, creating new')
            },
            onFailure: function(path, text) {
                console.log('unable to load stat')
                console.log(text)
            },
        })
    }

    save() {
        const body = JSON.stringify(this.snapshot(), null, 4)
        saveRes(STAT_URL, body, {
            onSuccess: function() {
            },
            onFailure: function() {
            },
        })
    }
}

export const stat = new Stat()
