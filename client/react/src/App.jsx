import {Routes, Route} from "react-router-dom";
import Register from './components/Register/main.jsx';
import Login from './components/Login/main.jsx';
import TestHome from './components/TestHome/main.jsx';

const App = () =>
  <Routes>
    <Route path="/chat-home" element={<TestHome/>} />
    <Route exact path="/login" element={<Login/>} />
    <Route path="/register" element={<Register/>} />
  </Routes>
export default App;