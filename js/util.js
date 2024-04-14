module.exports = {

    joinPath: function(base, path) {
        if (!base && !path) return ''
        if (!base) return path
        if (!path) return base

        if (base.endsWith('/')) return base + path
        else return base + '/' + path
    },

    validatePath: function(path) {
        return !path || !path.includes('..')
    },

    parentPath: function(path) {
        if (!path) return ''
        const at = path.lastIndexOf('/')
        if (at < 0) return '' // parent is root
        return path.substring(0, at)
    },
}
