import { combineReducers } from 'redux'

import { projectReducer, ProjectState, ProjectAction } from './project'
import { viewStateReducer, ViewState } from './views'

export type RootAction = ProjectAction

export interface RootState {
    readonly project: ProjectState
    readonly views: ViewState
}

export const rootReducer = combineReducers<RootState>({
    project: projectReducer,
    views: viewStateReducer
})
