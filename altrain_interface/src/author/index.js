import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AuthoringInterface from './author';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthoringInterface />
    <script src="http://localhost:35729/livereload.js"></script>
  </React.StrictMode>
);

export default AuthoringInterface
