import 'semantic-ui-css/semantic.min.css';

import { App } from './App';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
