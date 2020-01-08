import { CompassMakFile, CompassMakDirectiveType } from '@speleotica/compass/mak'
import { CompassTrip } from '@speleotica/compass/dat'
import { capitalize } from 'lodash'
import Trie from './Trie'

export type NameCorrectionStat = {
  original: string
  count: number
  isSuspect?: boolean
  trips: CompassTrip[]
  suggested?: string
}
export type NameCorrectionStats = Map<string, NameCorrectionStat>

type Data = {
  normalized: string
}

const normalizeName = (name: string): string => {
  name = name.replace(/\./g, ' ').replace(/\s{2,}/g, ' ')
  return name.toUpperCase() === name ? name.replace(/\S+/g, name => capitalize(name)) : name
}

export default function buildNameCorrectionStats(data: CompassMakFile): NameCorrectionStats {
  const result: NameCorrectionStats = new Map()
  const firstInitials = new Trie<Data>()
  const fullNames = new Trie<Data>()
  for (const directive of data.directives) {
    if (directive.type === CompassMakDirectiveType.DatFile) {
      const { data } = directive
      if (!data) continue
      for (const trip of data.trips) {
        const {
          header: { team }
        } = trip
        if (team) {
          for (const surveyor of team.split(/\s*[,;]\s*/g)) {
            let stats = result.get(surveyor)
            if (!stats) result.set(surveyor, (stats = { original: surveyor, count: 0, trips: [] }))
            stats.count++
            stats.trips.push(trip)

            const normalized = normalizeName(surveyor)
            fullNames.insert(normalized)
            const firstInitial = normalized.replace(/^(\S)\S+/, '$1')
            if (firstInitial !== normalized) {
              firstInitials.insert(firstInitial).data = { normalized }
            }
          }
        }
      }
    }
  }

  for (const [surveyor, stats] of result.entries()) {
    const normalized = normalizeName(surveyor)
    const { count } = stats

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
          node: { data }
        } = similarNames[similarName]
        if (!data) continue
        const { normalized: fullName } = data
        if (fullName[0] !== normalized[0]) continue
        const similarStats = result.get(fullName)
        if (similarStats != null && similarStats.count >= bestCount) {
          best = fullName
          bestCount = similarStats.count
        }
      }
    } else {
      const similarNames = fullNames.search(normalized, Math.ceil(normalized.length / 8))
      for (let similarName in similarNames) {
        const similarStats = result.get(similarName)
        if (similarStats != null && similarStats.count > bestCount) {
          best = similarName
          bestCount = similarStats.count
        }
      }
    }

    if (best !== surveyor) {
      stats.isSuspect = true
      stats.suggested = best
    } else {
      stats.isSuspect = normalized.split(/\s+/g).length > 2
    }
  }

  return result
}
