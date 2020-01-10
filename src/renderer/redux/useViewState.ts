import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '.'
import { setViewState } from './views'

const useViewState = (view: string) => <T>(
  property: string,
  init: (() => T) | T
): [T, (value: T) => void] => {
    const dispatch = useDispatch()
    const hasValue = useSelector((state: RootState) => state.views.hasIn([view, property]))
    let value = useSelector((state: RootState) => state.views.getIn([view, property]))
    if (!hasValue) value = init instanceof Function ? init() : init
    const setValue = React.useCallback(
    (value: T) => dispatch(setViewState([view, property], value)),
    [dispatch, property]
  )
    React.useEffect(() => {
        if (!hasValue) setValue(value)
    }, [])
    return [value, setValue]
}

export default useViewState
