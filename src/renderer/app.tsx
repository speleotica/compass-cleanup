import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader'
import { BrowserRouter } from 'react-router-dom'

import Application from './components/Application'
import store from './store'

// Create main element
const mainElement = document.createElement('div')
document.body.appendChild(mainElement)

// Render components
const render = (Component: React.ComponentType<any>) => {
  ReactDOM.render(
    <AppContainer>
      <BrowserRouter>
        <Provider store={store}>
          <Component />
        </Provider>
      </BrowserRouter>
    </AppContainer>,
    mainElement
  )
}

render(Application)
