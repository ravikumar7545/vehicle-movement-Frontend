import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Map from './components/Map';

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Map />
    </div>
  );
};

export default App;
