import React from 'react';

interface WelcomeProps {
  name: string;
}

const Welcome: React.FC<WelcomeProps> = ({ name }) => (
  <div style={{ marginTop: '1rem' }}>
    <h2>Welcome, {name}!</h2>
  </div>
);

export default Welcome;
