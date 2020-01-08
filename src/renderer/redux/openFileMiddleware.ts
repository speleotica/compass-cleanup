import { Middleware, MiddlewareAPI, Dispatch } from 'redux'
import { RootState, RootAction } from '.'
import { OPEN_FILE, setParseProgress, setParseError, CANCEL_OPEN_FILE, Progress } from './loading'
import { throttle } from 'lodash'
import { parseCompassMakAndDatFiles } from '@speleotica/compass/node'
import { setProject } from './project'
import { CompassMakFile } from '@speleotica/compass/mak'

interface Task {
  onProgress(progress: Progress): any
  canceled: boolean
}

let task: Task | null = null

export const openFileMiddleware: Middleware<Dispatch, RootState> = (
  store: MiddlewareAPI<Dispatch, RootState>
) => (next: Dispatch) => (action: RootAction) => {
  const result = next(action)
  switch (action.type) {
    case OPEN_FILE: {
      const file = action.payload

      if (task) task.canceled = true
      const progress: Progress = {}
      const throttledSetProgress = throttle(
        (progress: Progress) => store.dispatch(setParseProgress(progress)),
        30
      )
      task = {
        onProgress: (nextProgress: Progress) => {
          Object.assign(progress, nextProgress)
          throttledSetProgress(progress)
        },
        canceled: false
      }
      parseCompassMakAndDatFiles(file, task).then(
        (data: CompassMakFile) => store.dispatch(setProject({ file, data })),
        (error: Error) => store.dispatch(setParseError(error))
      )
      break
    }
    case CANCEL_OPEN_FILE:
      if (task) task.canceled = true
      break
  }
  return result
}
