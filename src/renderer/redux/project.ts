import { Reducer } from 'redux'
import { CompassMakFile } from '@speleotica/compass/mak'
import { Action, ActionCreator } from 'redux'

export const SET_PROJECT = 'SET_PROJECT'

export interface SetProjectAction extends Action {
  type: 'SET_PROJECT'
  payload: ProjectState
}

export const setProject: ActionCreator<SetProjectAction> = (payload: ProjectState) => ({
  type: SET_PROJECT,
  payload
})

export type ProjectAction = SetProjectAction

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
