import { hot } from 'react-hot-loader/root'
import * as React from 'react'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import { remote } from 'electron'
const { dialog } = remote
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  Typography,
  DialogActions,
  Button,
  Theme,
  withStyles,
  Container,
  Menu,
  MenuItem
} from '@material-ui/core'
import * as path from 'path'
import { WithStyles, createStyles } from '@material-ui/styles'
import ProjectViewRoutes from './ProjectViewRoutes'
import BigActionButton from './BigActionButton'
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks'
import { Progress, Task } from '../../Task'
import { WithProgressContext } from './WithProgressContext'
import { throttle } from 'lodash'
import { setProject } from '../redux/project'
import { parseCompassMakAndDatFiles } from '@speleotica/compass/node'
import { RootState } from '../redux'

const styles = (theme: Theme) =>
  createStyles({
    root: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column'
    },
    appBar: {
      flex: '0 0 auto'
    },
    openButton: {
      marginRight: theme.spacing(2)
    },
    title: {
      flexGrow: 1
    },
    content: {
      flex: '1 1 auto',
      position: 'relative'
    },
    options: {
      margin: theme.spacing(1)
    },
    columnHeader: {
      fontFamily: theme.typography.h6.fontFamily,
      textTransform: 'initial'
    },
    countColumn: {
      textAlign: 'right',
      marginRight: theme.spacing(3)
    },
    tableRow: {
      fontFamily: 'monospace',
      fontWeight: 'bold'
    },
    tableRowOdd: {
      backgroundColor: theme.palette.grey[100]
    },
    initActions: {
      display: 'flex',
      justifyContent: 'center'
    }
  })

interface Props extends WithStyles<typeof styles> {}

const Application = ({ classes }: Props) => {
  const dispatch = useDispatch()
  const project = useSelector((state: RootState) => state.project)
  const menuPopupState = usePopupState({
    variant: 'popover',
    popupId: 'menu'
  })

  const [task, setTask] = React.useState<Task | null>(null)
  const [taskError, setTaskError] = React.useState<Error | null>(null)
  const [taskProgress, setTaskProgress] = React.useReducer(
    (state: Progress, action: Progress | 'reset') =>
      action === 'reset' ? {} : { ...state, ...action },
    {}
  )
  const withProgress = React.useCallback(
    async function withProgress<R>(perform: (task: Task) => Promise<R>): Promise<R> {
      const progress = {}
      const throttledSetProgress = throttle(setTaskProgress, 250)
      const task = {
        onProgress: (newProgress: Progress) => {
          Object.assign(progress, newProgress)
          throttledSetProgress(progress)
        },
        canceled: false
      }
      setTaskError(null)
      setTaskProgress('reset')
      setTask(task)
      try {
        return await perform(task)
      } catch (error) {
        if (error.message !== 'canceled') setTaskError(error)
        throw error
      } finally {
        throttledSetProgress.cancel()
        setTaskProgress('reset')
        setTask(null)
      }
    },
    [setTask, setTaskError, setTaskProgress]
  )
  const handleCloseErrorDialog = React.useCallback(() => {
    setTaskError(null)
  }, [setTaskError])
  const handleCancelTask = React.useCallback(() => {
    if (task) task.canceled = true
  }, [task])
  const handleOpenClick = React.useCallback(async () => {
    menuPopupState.close()
    const filePaths = await dialog.showOpenDialog({
      title: 'Select Compass Project',
      filters: [{ name: 'Compass Project File (*.mak)', extensions: ['mak'] }]
    })
    if (!filePaths) return
    const [file] = filePaths
    const data = await withProgress((task: Task) => parseCompassMakAndDatFiles(file, task))
    dispatch(setProject({ file, data }))
  }, [dispatch, menuPopupState, withProgress])

  return (
    <WithProgressContext.Provider value={withProgress}>
      <div className={classes.root}>
        <AppBar position="static" color="primary" className={classes.appBar}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              className={classes.openButton}
              {...bindTrigger(menuPopupState)}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              {...bindMenu(menuPopupState)}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={handleOpenClick}>Open Compass Project...</MenuItem>
            </Menu>
            <Typography variant="h6" className={classes.title}>
              {project ? path.basename(project.file) : undefined}
            </Typography>
          </Toolbar>
        </AppBar>
        <div className={classes.content}>
          {project ? (
            <ProjectViewRoutes project={project} />
          ) : (
            <Container maxWidth="sm" className={classes.initActions}>
              <BigActionButton title="Open a Compass Project to Begin" onClick={handleOpenClick} />
            </Container>
          )}
        </div>
        <Dialog open={taskError != null} aria-labelled-by="error-dialog-title">
          <DialogTitle id="error-dialog-title">Error</DialogTitle>
          <DialogContent>
            <Typography variant="body1">{taskError && taskError.message}</Typography>
            <DialogActions>
              <Button variant="text" color="primary" onClick={handleCloseErrorDialog}>
                OK
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
        <Dialog open={task != null} aria-labelled-by="progress-dialog-title">
          <DialogContent>
            <Typography variant="body1">{taskProgress.message}</Typography>
            <LinearProgress
              variant="determinate"
              value={
                taskProgress.completed != null && taskProgress.total != null
                  ? (taskProgress.completed / taskProgress.total) * 100
                  : 0
              }
            />
            <DialogActions>
              <Button variant="text" color="primary" onClick={handleCancelTask}>
                Cancel
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </div>
    </WithProgressContext.Provider>
  )
}
export default hot(withStyles(styles)(Application))
