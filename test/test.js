/* eslint-env mocha */
require('should')
const streamAssert = require('stream-assert')
const File = require('vinyl')
const through = require('through2')
const windowed = require('../index')

describe('gulp-windowed', () => {
  it('should throw an error when n is not a positive integer', () =>
    ['spaghetti', 0, undefined, 2.2].forEach(val =>
      (() => windowed(val)).should.throw('Window size must be a positive integer!')
    )
  )

  it('should throw an error when n is a positive integer, but the callback is not a function', () =>
    [-1, 0, 1, 3.4, undefined, null, 'spaghetti'].forEach(val =>
      (() => windowed(6, val)).should.throw('A callback must be provided!')
    )
  )

  it('should not stall as long as the callback is called', done => {
    const stream = windowed(4, (files, i, cb) => cb())
    stream.pipe(streamAssert.end(done))

    Array(20)
      .fill(undefined)
      .map(() => new File())
      .forEach(file => stream.write(file))
    stream.end()
  })

  it('should not ignore non-null files', done => {
    let count = 0
    const stream = windowed(4, (files, i, cb) => {
      count++
      cb()
    })

    stream.pipe(streamAssert.end(() => {
      count.should.be.exactly(5)
      done()
    }))

    Array(20)
      .fill(undefined)
      .map(() => new File({contents: Buffer.from('what a great test!')}))
      .forEach(file => stream.write(file))
    stream.end()
  })

  it('should ignore null files', done => {
    let count = 0
    const stream = windowed(4, (files, i, cb) => {
      count++
      cb()
    })

    stream.pipe(streamAssert.end(() => {
      count.should.be.exactly(0)
      done()
    }))

    Array(20)
      .fill(undefined)
      .map(() => new File())
      .forEach(file => stream.write(file))
    stream.end()
  })

  it('should window the specified number of files every time when n is evenly divisible by the written files', done => {
    const stream = windowed(4, files => files.pipe(streamAssert.length(4)))

    stream
      .pipe(streamAssert.length(20))
      .pipe(streamAssert.end(done))

    Array(20)
      .fill(undefined)
      .map(() => new File({contents: Buffer.from('what a great test!')}))
      .forEach(file => stream.write(file))
    stream.end()
  })

  it('should window the specified number of files all but the last time when n is not evenly divisible by the written files', done => {
    let remaining = 20

    const stream = windowed(3, files =>
      files
        .pipe(streamAssert.length(remaining < 3 ? 2 : 3))
        .pipe(through.obj((file, enc, cb) => {
          remaining--
          cb(null, file)
        }))
    )

    stream
      .pipe(streamAssert.length(20))
      .pipe(streamAssert.end(done))

    Array(20)
      .fill(undefined)
      .map(() => new File({contents: Buffer.from('what a great test!')}))
      .forEach(file => stream.write(file))
    stream.end()
  })

  it('should keep track of the window number', done => {
    let count = 0
    const stream = windowed(4, (files, i, cb) => {
      i.should.be.exactly(count)
      count++
      cb()
    })

    stream.pipe(streamAssert.end(done))

    Array(20)
      .fill(undefined)
      .map(() => new File({contents: Buffer.from('what a great test!')}))
      .forEach(file => stream.write(file))
    stream.end()
  })
})
