const File = require('vinyl')
const PluginError = require('plugin-error')
const asyncDone = require('async-done')

const through = require('through2')
const isStream = require('is-stream')
const intoStream = require('into-stream')

const PLUGIN_NAME = 'gulp-windowed'

const array = (n, cb) => {
  if (!Number.isInteger(n) || n <= 0) {
    throw new PluginError(PLUGIN_NAME, 'Window size must be a positive integer!')
  }

  if (typeof cb !== 'function') {
    throw new PluginError(PLUGIN_NAME, 'A callback must be provided!')
  }

  let files = []
  let i = 0

  function f (done) {
    asyncDone(done => {
      const result = cb(files, i, done)

      if (File.isVinyl(result) || (Array.isArray(result) && result.every(File.isVinyl)) || isStream.readable(result)) {
        done(null, result)
      } else {
        return result
      }
    }, (err, result) => {
      if (err) {
        this.emit('error', new PluginError(PLUGIN_NAME, err.message))
        done()
      } else {
        if (isStream.readable(result)) {
          result
            .on('data', file => {
              if (File.isVinyl(file)) {
                this.push(file)
              }
            })
            .on('end', done)
        } else {
          if (Array.isArray(result) && result.every(File.isVinyl)) {
            result.forEach(item => this.push(item))
          } else if (File.isVinyl(result)) {
            this.push(result)
          }

          done()
        }
      }
    })
  }

  return through.obj(function (file, enc, done) {
    if (file.isNull()) {
      done()
    } else {
      files.push(file)

      if (files.length === n) {
        f.call(this, () => {
          files = []
          i++
          done()
        })
      } else {
        done()
      }
    }
  }, function (done) {
    if (files.length > 0) {
      f.call(this, () => {
        files = []
        i++
        done()
      })
    } else {
      done()
    }
  })
}

module.exports = (n, cb) => array(n, typeof cb === 'function' ? (files, i, done) => cb(intoStream.obj(files), i, done) : undefined)
module.exports.array = array
