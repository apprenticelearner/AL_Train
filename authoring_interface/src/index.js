import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AuthoringInterface from './authoring_interface';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthoringInterface />
  </React.StrictMode>
);

export default AuthoringInterface
