import Router from './router/index';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
