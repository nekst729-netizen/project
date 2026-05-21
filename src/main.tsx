import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../spreadsheet-app/src/app/store';
import App from '../../spreadsheet-app/src/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
