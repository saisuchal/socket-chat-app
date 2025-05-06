import { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import styles from './Login.module.css';

const apiStatusCodes = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'FAILURE',
  inProgress: 'IN_PROGRESS',
};

class Login extends Component {
  state = {
    username: '',
    password: '',
    apiStatus: apiStatusCodes.initial,
    errorMessageText: '',
  };

  usernameInput = event => {
    this.setState({ username: event.target.value });
  };

  passwordInput = event => {
    this.setState({ password: event.target.value });
  };

  submitLoginForm = async event => {
    event.preventDefault();
    this.setState({ apiStatus: apiStatusCodes.inProgress });

    const { username, password } = this.state;
    const url = 'http://localhost:5000/login';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok) {
        Cookies.set('jwt_token', data.jwt_token, { expires: 7 });
        this.setState({ apiStatus: apiStatusCodes.success, errorMessageText: '' });
      } else {
        this.setState({
          errorMessageText: data.message,
          apiStatus: apiStatusCodes.failure,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      this.setState({
        errorMessageText: 'Something went wrong. Please try again.',
        apiStatus: apiStatusCodes.failure,
      });
    }
  };

  render() {
    const { username, password, errorMessageText } = this.state;
    const token = Cookies.get('jwt_token');

    if (token !== undefined) {
      return <Navigate to="/chat-home" replace />;
    }

    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>Login</h1>
          <form onSubmit={this.submitLoginForm} className={styles.loginForm}>
            <label htmlFor="usernameInput" className={styles.label}>Username</label>
            <input
              id="usernameInput"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={this.usernameInput}
              className={styles.formInput}
              autoComplete="username"
            />

            <label htmlFor="passwordInput" className={styles.label}>Password</label>
            <input
              id="passwordInput"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={this.passwordInput}
              className={styles.formInput}
              autoComplete="current-password"
            />

            <button type="submit" className={styles.loginButton}>Login</button>
            {errorMessageText && <p className={styles.error}>{errorMessageText}</p>}
          </form>

          <p className={styles.loginPrompt}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>Sign Up</Link>
          </p>
        </div>
      </div>
    );
  }
}

export default Login;
