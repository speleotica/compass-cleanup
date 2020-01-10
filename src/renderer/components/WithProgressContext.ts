import * as React from 'react'
import { Task } from '../../Task'

type WithProgress<R> = (perform: (task: Task) => Promise<R>) => Promise<R>

export const WithProgressContext = React.createContext<WithProgress<any>>(
  (perform: (task: Task) => Promise<any>) =>
    perform({
        onProgress() {},
        canceled: true
    })
)

export const useWithProgress = () => React.useContext(WithProgressContext)
