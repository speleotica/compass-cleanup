import { combineReducers } from 'redux'

import { projectReducer, ProjectState } from './project'

export interface RootState {
  project: ProjectState
}

export const rootReducer = combineReducers<RootState | undefined>({
  project: projectReducer
})
