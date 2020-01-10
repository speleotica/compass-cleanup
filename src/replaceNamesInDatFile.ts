import { Map as iMap } from 'immutable'
import { Task } from './Task'

export default async function* replaceNamesInDatFile(
  lines: AsyncIterable<string>,
  replacements: iMap<string, string>
): AsyncIterable<string> {
    let onSurveyTeam = false
    for await (const line of lines) {
        if (onSurveyTeam) {
          onSurveyTeam = false
          const parts = line.trim().split(/\s*[,;]\s*/g)
          let anyReplaced = false
          let anyPartHasComma = false
          for (let i = 0; i < parts.length; i++) {
            const replacement = replacements.get(parts[i])
            if (replacement) {
              anyReplaced = true
              parts[i] = replacement
          }
            anyPartHasComma = /,/.test(parts[i])
        }
          yield anyReplaced ? parts.join(anyPartHasComma ? '; ' : ', ') : line
      } else {
          if (/^SURVEY TEAM:/i.test(line)) {
            onSurveyTeam = true
        }
          yield line
      }
    }
}
