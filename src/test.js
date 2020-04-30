import test from 'ava'
import streamAssert from 'stream-assert'
import getStream from 'get-stream'
import File from 'vinyl'
import through from 'through2'
import { windowed } from '../lib/gulp-windowed'

test(`throws an error when n is not a positive integer`, t => {
  for (const value of [`spaghetti`, 0, undefined, 2.2]) {
    t.throws(() => windowed(value))
  }
})

test(`throws an error when n is a positive integer, but the callback is not a function`, t => {
  for (const value of [-1, 0, 1, 3.4, undefined, null, `spaghetti`]) {
    t.throws(() => windowed(6, value))
  }
})

test(`does not stall as long as the callback is called`, async t => {
  const stream = windowed(4, (files, i, cb) => cb())
  stream.pipe(streamAssert.end(() => t.pass()))

  for (let i = 0; i < 20; i++) {
    stream.write(new File())
  }

  stream.end()
  await getStream(stream)
})

test(`does not ignore non-null files`, async t => {
  let count = 0
  const stream = windowed(4, (files, i, cb) => {
    count++
    cb()
  })

  stream.pipe(
    streamAssert.end(() => {
      t.assert(count % 5 === 0)
    })
  )

  for (let i = 0; i < 20; i++) {
    stream.write(new File({ contents: Buffer.from(`what a great test!`) }))
  }

  stream.end()
  await getStream(stream)
})

test(`should ignore null files`, async t => {
  let count = 0
  const stream = windowed(4, (files, i, cb) => {
    count++
    cb()
  })

  stream.pipe(
    streamAssert.end(() => {
      t.is(count, 0)
    })
  )

  for (let i = 0; i < 20; i++) {
    stream.write(new File())
  }

  stream.end()
  await getStream(stream)
})

test(`should window the specified number of files every time when n is evenly divisible by the written files`, async t => {
  const stream = windowed(4, files => files.pipe(streamAssert.length(4)))

  stream.pipe(streamAssert.length(20)).pipe(streamAssert.end(() => t.pass()))

  for (let i = 0; i < 20; i++) {
    stream.write(new File({ contents: Buffer.from(`what a great test!`) }))
  }

  stream.end()
  await getStream.array(stream)
})

test(`should window the specified number of files all but the last time when n is not evenly divisible by the written files`, async t => {
  let remaining = 20

  const stream = windowed(3, files =>
    files.pipe(streamAssert.length(remaining < 3 ? 2 : 3)).pipe(
      through.obj((file, enc, cb) => {
        remaining--
        cb(null, file)
      })
    )
  )

  stream.pipe(streamAssert.length(20)).pipe(streamAssert.end(() => t.pass()))

  for (let i = 0; i < 20; i++) {
    stream.write(new File({ contents: Buffer.from(`what a great test!`) }))
  }

  stream.end()
  await getStream.array(stream)
})

test(`should keep track of the window number`, async t => {
  let count = 0
  const stream = windowed(4, (files, i, cb) => {
    t.is(i, count)
    count++
    cb()
  })

  stream.pipe(streamAssert.end(() => t.pass()))

  for (let i = 0; i < 20; i++) {
    stream.write(new File({ contents: Buffer.from(`what a great test!`) }))
  }

  stream.end()
  await getStream.array(stream)
})
