import React from 'react';
import Navbar from '../components/Navbar';

const Register: React.FC = () => {
  const backgroundImageStyle = {
    backgroundImage:
      "linear-gradient(180deg, rgba(10, 10, 12, 0.78) 0%, rgba(10, 10, 12, 0.9) 100%), url('https://images.unsplash.com/photo-1517840901100-8179e982acb7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
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
