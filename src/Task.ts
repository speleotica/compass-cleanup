export type Progress = {
    message?: string
    completed?: number
    total?: number
}
export interface Task {
    onProgress(progress: Progress): any
    canceled: boolean
}
