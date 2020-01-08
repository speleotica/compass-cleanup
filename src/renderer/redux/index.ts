import { combineReducers } from 'redux'

import { projectReducer, ProjectState, ProjectAction } from './project'
import { loadingReducer, LoadingState, LoadingAction } from './loading'

export type RootAction = ProjectAction | LoadingAction

export interface RootState {
  readonly loading: LoadingState
  readonly project: ProjectState
}

export const rootReducer = combineReducers<RootState>({
  project: projectReducer,
  loading: loadingReducer as any
})
