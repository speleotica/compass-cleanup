import * as React from 'react'
import { Theme, Container, Typography } from '@material-ui/core'
import { Link } from 'react-router-dom'
import { WithStyles, createStyles, withStyles } from '@material-ui/styles'
import BigActionButton from './BigActionButton'
import FindReplaceIcon from '@material-ui/icons/FindReplace'

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  })

interface Props extends WithStyles<typeof styles> {}

const ProjectViewLinks = ({ classes }: Props) => (
  <Container maxWidth="sm">
    <BigActionButton
      component={Link}
      to="/correctTeamNames"
      icon={<FindReplaceIcon />}
      title="Correct Team Names"
    />
  </Container>
)

export default withStyles(styles)(ProjectViewLinks)
