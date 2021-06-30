import { Transform, Readable } from 'stream'
import * as File from 'vinyl'

export const arrayWindowed: (
  n: number,
  cb: (files: Array<File>) => void | File | Array<File> | Readable
) => Transform

export const windowed: (
  n: number,
  cb: (files: Readable) => void | File | Array<File> | Readable
) => Transform
