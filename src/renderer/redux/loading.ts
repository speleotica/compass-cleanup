import { ActionCreator } from 'redux'
import { ProjectAction, SET_PROJECT } from './project'
import { Reducer } from 'react'

export const OPEN_FILE = 'OPEN_FILE'

export type OpenFileAction = {
  type: 'OPEN_FILE'
  payload: string
}

export const openFile: ActionCreator<OpenFileAction> = (file: string) => ({
  type: OPEN_FILE,
  payload: file
})

export const CANCEL_OPEN_FILE = 'CANCEL_OPEN_FILE'

export type CancelOpenFileAction = {
  type: 'CANCEL_OPEN_FILE'
}

export const cancelOpenFile: ActionCreator<CancelOpenFileAction> = () => ({
  type: CANCEL_OPEN_FILE
})

export const SET_PARSE_PROGRESS = 'SET_PARSE_PROGRESS'

export type Progress = {
  message?: string
  completed?: number
  total?: number
}

export type SetParseProgressAction = {
  type: 'SET_PARSE_PROGRESS'
  payload: Progress
}

export const setParseProgress: ActionCreator<SetParseProgressAction> = (progress: Progress) => ({
  type: SET_PARSE_PROGRESS,
  payload: progress
})

export const SET_PARSE_ERROR = 'SET_PARSE_ERROR'

export type SetParseErrorAction = {
  type: 'SET_PARSE_ERROR'
  error: true
  payload: Error
}
export const setParseError: ActionCreator<SetParseErrorAction> = (error: Error) => ({
  type: SET_PARSE_ERROR,
  error: true,
  payload: error
})

export type LoadingAction =
  | OpenFileAction
  | CancelOpenFileAction
  | SetParseErrorAction
  | SetParseProgressAction

export type LoadingState = {
  readonly file: string | null
  readonly error: Error | null
  readonly progress: Progress
} | null

const initState: LoadingState = null

export const loadingReducer: Reducer<LoadingState, LoadingAction | ProjectAction> = (
  state = initState,
  action: LoadingAction | ProjectAction
) => {
  switch (action.type) {
    case OPEN_FILE:
      return { file: action.payload, error: null, progress: {} }
    case SET_PARSE_PROGRESS:
      return state ? { ...state, progress: { ...state.progress, ...action.payload } } : null
    case SET_PARSE_ERROR:
      return state ? { ...state, error: action.payload } : null
    case CANCEL_OPEN_FILE:
    case SET_PROJECT:
      return null
    default:
      return state
  }
}
