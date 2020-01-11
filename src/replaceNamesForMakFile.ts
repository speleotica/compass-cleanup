import { parseCompassMakFile } from '@speleotica/compass/node'
import { CompassMakDirectiveType } from '@speleotica/compass/mak'
import { Map as iMap } from 'immutable'
import * as fs from 'fs-extra'
import * as path from 'path'
import replaceNamesInDatFile from './replaceNamesInDatFile'
import { Task } from './Task'
import * as iconv from 'iconv-lite'

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

  for (const directive of project.directives) {
    if (directive.type === CompassMakDirectiveType.DatFile) {
      if (task.canceled) throw new Error('canceled')
      const datFile = path.resolve(path.dirname(makFile), directive.file)
      task.onProgress({ message: `Writing ${datFile}`, completed, total })
      const original = iconv.decode(await fs.readFile(datFile), 'win1252')
      const transformed = replaceNamesInDatFile(original, replacements)
      await fs.writeFile(datFile + '.tmp', iconv.encode(transformed, 'win1252'))
      completed += (await fs.stat(datFile)).size
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
