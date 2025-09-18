// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import CreateCustomer from './pages/CreateCustomer';
import CustomerDetails from './pages/CustomerDetails';
import UpdateCustomer from './pages/UpdateAddress';
import MultipleAddresses from './pages/MultipleAddresses';
import SingleAddress from './pages/SingleAddress';
import UpdateAddress from './pages/UpdateAddress';
import './styles/App.css';
import './styles/responsive.css';

function App() {
  return (
    <Router>
      <div className="app">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateCustomer />} />
          <Route path="/customer/:id" element={<CustomerDetails />} />
          <Route path="/update/:id" element={<UpdateCustomer />} />
          <Route path="/customer/:customerId/address/:addressId/edit" element={<UpdateAddress />} />
          <Route path="/multiple-addresses" element={<MultipleAddresses />} />
          <Route path="/single-address" element={<SingleAddress />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;