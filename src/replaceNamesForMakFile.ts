import { parseCompassMakFile } from '@speleotica/compass/node'
import { CompassMakDirectiveType } from '@speleotica/compass/mak'
import { Map as iMap } from 'immutable'
import * as fs from 'fs-extra'
import * as path from 'path'
import replaceNamesInDatFile from './replaceNamesInDatFile'
import linesOf from './linesOf'
import { Task } from './Task'

export default async function replaceNamesForMakFile(
  makFile: string,
  replacements: iMap<string, string>,
  task: Task
): Promise<void> {
    const project = await parseCompassMakFile(makFile)
    let completed = 0,
        total = 0
    for (const directive of project.directives) {
        if (directive.type === CompassMakDirectiveType.DatFile) {
          const datFile = path.resolve(path.dirname(makFile), directive.file)
          total += (await fs.stat(datFile)).size
      }
    }

    async function* readLines(file: string, encoding: string): AsyncIterable<string> {
        for await (const line of linesOf(file, encoding)) {
          if (task.canceled) throw new Error('canceled')
          yield line
          completed += line.length + 2 // add 2 for \r\n
          task.onProgress({ completed, total })
      }
    }

    for (const directive of project.directives) {
        if (directive.type === CompassMakDirectiveType.DatFile) {
          const datFile = path.resolve(path.dirname(makFile), directive.file)
          task.onProgress({ message: `Writing ${datFile}`, completed, total })
          const outStream = fs.createWriteStream(datFile + '.tmp', 'ASCII')
          for await (const line of replaceNamesInDatFile(readLines(datFile, 'ASCII'), replacements)) {
            outStream.write(line)
            outStream.write('\r\n')
        }
          outStream.end()
      }
    }

    if (task.canceled) throw new Error('canceled')

    for (const directive of project.directives) {
        if (directive.type === CompassMakDirectiveType.DatFile) {
          const datFile = path.resolve(path.dirname(makFile), directive.file)
          await fs.move(datFile + '.tmp', datFile, { overwrite: true })
      }
    }
}
