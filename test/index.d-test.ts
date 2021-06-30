import { expectType } from 'tsd'
import { arrayWindowed, windowed } from '../src'
import { Transform } from 'stream'

expectType<Transform>(arrayWindowed(4, () => undefined))
expectType<Transform>(arrayWindowed(4, files => files))

expectType<Transform>(windowed(4, () => undefined))
expectType<Transform>(windowed(4, files => files))
