import * as React from 'react'
import { ProjectState } from '../redux/project'
import { Route, Switch } from 'react-router-dom'
import CorrectNamesView from './CorrectNamesView'

type Props = {
    project: ProjectState
}

const ProjectViewRoutes = ({ project }: Props) => (
  <Switch>
    <Route path="/" render={() => <CorrectNamesView project={project} />} />
  </Switch>
)

export default ProjectViewRoutes
