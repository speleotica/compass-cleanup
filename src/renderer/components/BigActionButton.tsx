import * as React from 'react'
import { Button, Theme, Typography, ButtonProps } from '@material-ui/core'
import { createStyles, withStyles } from '@material-ui/core'

const styles = (theme: Theme) =>
  createStyles({
      root: {
        maxWidth: 200,
        textTransform: 'initial',
        margin: theme.spacing(2)
    },
      label: {
        textAlign: 'center',
        flexDirection: 'column'
    }
  })

type Props = ButtonProps & {
    component?: React.ComponentType<any>
    to?: string
    icon?: React.ReactNode
    title: React.ReactNode
}

const BigActionButton = ({ classes, icon, title, ...props }: Props) => (
  <Button variant="outlined" color="primary" size="large" {...props} classes={classes}>
    {icon}
    <Typography variant="h6">{title}</Typography>
  </Button>
)
export default withStyles(styles)(BigActionButton)
