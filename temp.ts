import { parseCompassMakAndDatFiles } from '@speleotica/compass/node'
import { CompassMakDirectiveType } from '@speleotica/compass/mak'
import Trie from 'js-levenshtein-trie'
import { capitalize } from 'lodash'

const normalizeName = name => {
  name = name.replace(/\./g, ' ').replace(/\s{2,}/g, ' ')
  return name.toUpperCase() === name ? name.replace(/\S+/g, name => capitalize(name)) : name
}

async function go() {
  const data = await parseCompassMakAndDatFiles(
    '/Users/andy/Google Drive/Lechuguilla Cave/Compass files/Lechuguilla.mak'
  )
  const caves: Map<string, number> = new Map()
  const surveyors: Map<string, number> = new Map()
  const firstInitials = new Trie()
  const fullNames = new Trie()
  for (const directive of data.directives) {
    if (directive.type === CompassMakDirectiveType.DatFile) {
      const { data } = directive
      if (!data) continue
      for (const {
        header: { cave, team }
      } of data.trips) {
        const count = caves.get(cave) || 0
        caves.set(cave, count + 1)
        if (team) {
          for (const surveyor of team.split(/\s*[,;]\s*/g)) {
            const normalized = normalizeName(surveyor)
            fullNames.insert(normalized)
            const firstInitial = normalized.replace(/^(\S)\S+/, '$1')
            if (firstInitial !== normalized) {
              firstInitials.insert(firstInitial).fullName = normalized
            }
            const count = surveyors.get(surveyor) || 0
            surveyors.set(surveyor, count + 1)
          }
        }
      }
    }
  }

  for (const surveyor of [...surveyors.keys()].sort()) {
    const normalized = normalizeName(surveyor)
    const count = surveyors.get(surveyor)
    const firstInitial = normalized.replace(/^(\S)\S+/, '$1')
    let best = normalized
    let bestCount = count
    if (firstInitial === normalized) {
      bestCount = 1
      const similarNames = firstInitials.search(normalized, Math.ceil(normalized.length / 6))
      if (firstInitial === 'M WARSHAWER') {
        console.log(similarNames)
      }
      for (let similarName in similarNames) {
        const {
          node: { fullName }
        } = similarNames[similarName]
        if (fullName[0] !== normalized[0]) continue
        const similarCount = surveyors.get(fullName)
        if (similarCount >= bestCount) {
          best = fullName
          bestCount = similarCount
        }
      }
    } else {
      const similarNames = fullNames.search(normalized, Math.ceil(normalized.length / 8))
      for (let similarName in similarNames) {
        const similarCount = surveyors.get(similarName)
        if (similarCount > bestCount) {
          best = similarName
          bestCount = similarCount
        }
      }
    }
    if (best !== surveyor) {
      console.log(surveyor, count, '👀', best, bestCount)
    } else {
      console.log(surveyor, count, '👍')
    }
  }
  // for (const cave of [...caves.keys()].sort()) {
  //   console.log(cave, caves.get(cave))
  // }
}

go()
