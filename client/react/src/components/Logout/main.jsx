import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Logout = () => {
  const navigate = useNavigate();
  const handleLogout = async() => {
    const token = Cookies.get('jwt_token')
    const url = 'http://localhost:5000/disconnect-socket'
    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    const response = await fetch(url, options)
    const data= response.json()
    console.log(data.message) 
    Cookies.remove('jwt_token');
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
