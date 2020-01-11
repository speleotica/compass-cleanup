import { Map as iMap } from 'immutable'

export default function replaceNamesInDatFile(
  data: string,
  replacements: iMap<string, string>
): string {
  return data.replace(
    /^(SURVEY TEAM:[^\r\n]*(?:\r\n?|\n))([^\r\n]+)/gm,
    (original, header, team) => {
      const parts = team.trim().split(/\s*[,;]\s*/g)
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
      return anyReplaced ? header + parts.join(anyPartHasComma ? '; ' : ', ') : original
    }
  )
}
