import 'semantic-ui-css/semantic.min.css';

import ReactDOM from 'react-dom';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root'),
);
