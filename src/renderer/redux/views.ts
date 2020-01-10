import { Reducer } from 'redux'
import { Action, ActionCreator } from 'redux'
import { Map as iMap } from 'immutable'

export const SET_VIEW_STATE = 'SET_VIEW_STATE'

export interface SetViewStateAction extends Action {
    type: 'SET_VIEW_STATE'
    meta: { path: Array<string | number> }
    payload: any
}

export const setViewState: ActionCreator<SetViewStateAction> = (
  path: Array<string | number>,
  payload: any
) => ({
    type: SET_VIEW_STATE,
    meta: { path },
    payload
})

export type ViewStateAction = SetViewStateAction

export type ViewState = iMap<string, any>

export const defaultState: ViewState = iMap()

export const viewStateReducer: Reducer<ViewState, ViewStateAction> = (
  state = defaultState,
  action: ViewStateAction
) => {
    switch (action.type) {
        case SET_VIEW_STATE:
            return state.setIn(action.meta.path, action.payload)
        default:
            return state
    }
}
