import Router from './router/index';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AccessibilityWidget from './components/AccessibilityWidget';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router />
        <AccessibilityWidget />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
