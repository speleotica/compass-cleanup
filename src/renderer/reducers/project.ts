import { Reducer } from 'redux'
import { CompassMakFile } from '@speleotica/compass/mak'
import { SET_PROJECT, ProjectAction } from '../actions/projectActions'

export type ProjectState = {
  readonly file: string
  readonly data: CompassMakFile
} | null

export const defaultState: ProjectState = null

export const projectReducer: Reducer<ProjectState, ProjectAction> = (
  state = defaultState,
  action: ProjectAction
) => {
  switch (action.type) {
    case SET_PROJECT:
      return action.payload
    default:
      return state
  }
}
