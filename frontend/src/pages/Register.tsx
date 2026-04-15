import React from 'react';
import Navbar from '../components/Navbar';

const Register: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg)' }} className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-8">
        <p style={{ color: 'var(--text)' }}>Register page - handled in Login.tsx</p>
      </div>
    </div>
  );
};

export default Register;
