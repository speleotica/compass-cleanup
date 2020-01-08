import { Action, ActionCreator } from 'redux'
import { ProjectState } from '../reducers/project'

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
