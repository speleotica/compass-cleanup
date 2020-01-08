import * as React from 'react'
import { ProjectState } from '../redux/project'
import { Route, Switch } from 'react-router-dom'
import CorrectNamesView from './CorrectNamesView'
import ProjectViewLinks from './ProjectViewLinks'

type Props = {
  project: ProjectState
}

const ProjectViewRoutes = ({ project }: Props) => (
  <Switch>
    <Route path="/correctTeamNames" render={() => <CorrectNamesView project={project} />} />
    <Route path="*" component={ProjectViewLinks} />
  </Switch>
)

export default ProjectViewRoutes
