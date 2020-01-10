import * as fs from 'fs'
import * as readline from 'readline'
import { PassThrough } from 'stream'

export default function linesOf(file: string, encoding: string): AsyncIterable<string> {
    const rl = readline.createInterface(fs.createReadStream(file, encoding))
    if (rl[Symbol.asyncIterator]) {
        return rl
    }
    const output = new PassThrough({ objectMode: true })
    rl.on('line', (line: string) => {
        output.write(line)
    })
    rl.on('close', () => {
        output.end()
    })
    return output
}
