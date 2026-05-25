import React from 'react';
import Navbar from '../components/Navbar';

const Register: React.FC = () => {
  const backgroundImageStyle = {
    backgroundImage: 'var(--auth-page-background)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  } as const;

  return (
    <div style={{ minHeight: '100vh', ...backgroundImageStyle }} className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-8">
        <p style={{ color: 'var(--text)' }}>Register page - handled in Login.tsx</p>
      </div>
    </div>
  );
};

export default Register;
