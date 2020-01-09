import { hot } from 'react-hot-loader/root'
import * as React from 'react'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import InputIcon from '@material-ui/icons/Input'
import { remote } from 'electron'
const { dialog } = remote
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../redux'
import 'react-virtualized/styles.css'
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
  Container
} from '@material-ui/core'
import path from 'path'
import { WithStyles, createStyles } from '@material-ui/styles'
import ProjectViewRoutes from './ProjectViewRoutes'
import BigActionButton from './BigActionButton'
import { openFile, cancelOpenFile, Progress } from '../redux/loading'

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
    }
  })

interface Props extends WithStyles<typeof styles> {}

const Application = ({ classes }: Props) => {
  const dispatch = useDispatch()
  const handleOpenClick = React.useCallback(async () => {
    const filePaths = await dialog.showOpenDialog({
      title: 'Select Compass Project',
      filters: [{ name: 'Compass Project File (*.mak)', extensions: ['mak'] }]
    })
    if (!filePaths) return
    const [file] = filePaths
    dispatch(openFile(file))
  }, [dispatch])

  const loading = useSelector((state: RootState) => state.loading)
  const project = useSelector((state: RootState) => state.project)

  const { message, completed, total } = loading ? loading.progress : ({} as Progress)
  const parseError = loading ? loading.error : null
  const [showErrorDialog, setShowErrorDialog] = React.useState(parseError != null)
  React.useEffect(() => {
    setShowErrorDialog(parseError != null)
  }, [parseError, setShowErrorDialog])

  return (
    <div className={classes.root}>
      <AppBar position="static" color="primary" className={classes.appBar}>
        <Toolbar>
          <Tooltip title="Open Project">
            <IconButton
              edge="start"
              color="inherit"
              className={classes.openButton}
              onClick={handleOpenClick}
            >
              <InputIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" className={classes.title}>
            {project ? path.basename(project.file) : undefined}
          </Typography>
        </Toolbar>
      </AppBar>
      <div className={classes.content}>
        {project ? (
          <ProjectViewRoutes project={project} />
        ) : (
          <Container maxWidth="sm">
            <BigActionButton
              icon={<InputIcon />}
              title="Open a Project to Begin"
              onClick={handleOpenClick}
            />
          </Container>
        )}
      </div>
      <Dialog open={showErrorDialog} aria-labelled-by="parse-error-dialog-title">
        <DialogTitle id="parse-error-dialog-title">Failed to Open Project</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{parseError && parseError.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="primary" onClick={() => setShowErrorDialog(false)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={loading != null} aria-labelled-by="progress-dialog-title">
        <DialogTitle id="progress-dialog-title">Opening Project</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{message}</Typography>
          <LinearProgress
            variant="determinate"
            value={
              loading != null && completed != null && total != null ? (completed / total) * 100 : 0
            }
          />
          <DialogActions>
            <Button variant="text" color="primary" onClick={() => dispatch(cancelOpenFile())}>
              Cancel
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default hot(withStyles(styles)(Application))
