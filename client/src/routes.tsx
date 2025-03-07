import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './Components/Authentification/login.tsx'
import Signup from './Components/Authentification/signup.tsx'


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Routes>
    </Router>
  );
};

export default AppRoutes;
