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
}
