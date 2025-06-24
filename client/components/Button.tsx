import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#4F46E5',
        color: 'white',
        border: 'none',
        borderRadius: '0.375rem',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
};

export default Button;
