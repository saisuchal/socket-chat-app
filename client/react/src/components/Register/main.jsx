import {Component} from 'react'
import {Navigate, Link} from 'react-router-dom'
import styles from './Register.module.css';

const apiStatusCodes = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'FAILURE',
  inProgress: 'IN_PROGRESS',
}

class Register extends Component {
  state = {username: '', password: '', name:'', apiStatus: apiStatusCodes.initial, errorMessageText: ''}

  usernameInput = event => {
    const {value} = event.target
    this.setState({username: value})
  }

  passwordInput = event => {
    const {value} = event.target
    this.setState({password: value})
  }

  nameInput = event => {
    const {value} = event.target
    this.setState({name: value})
  }

  submitRegistrationForm = async (event) => {
    event.preventDefault()
    this.setState({apiStatus: apiStatusCodes.inProgress})
    const {username, password, name} = this.state
    const url = 'http://localhost:5000/register'
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({username, password, name}),
    }
    const response = await fetch(url, options)
    if (response.ok) {
      const data = await response.json()
      const {message}=data
      this.setState({apiStatus: apiStatusCodes.success, errorMessageText: message})
    } else{
      const data = await response.json()
      const {message} = data
      this.setState({
        errorMessageText: message,
        apiStatus: apiStatusCodes.failure,
      })
    }
  }

  render() {
    const {username, password, name, errorMessageText} = this.state
    return (
      <div className={styles.registerWrapper}>
        <div className={styles.registerBox}>
          <h1 className={styles.title}>User Registration</h1>
          <form className={styles.registerForm} onSubmit={this.submitRegistrationForm}>
            <label className={styles.label} htmlFor="nameInput">
                NAME
              </label>
              <input
                placeholder="Name"
                type="text"
                id="nameInput"
                value={name}
                onChange={this.nameInput}
                className={styles.formInput}
              />
              <label className={styles.label} htmlFor="usernameInput">
                USERNAME
              </label>
              <input
                placeholder="Username"
                type="text"
                id="usernameInput"
                value={username}
                onChange={this.usernameInput}
                className={styles.formInput}
                autoComplete='username'
              />
              <label className={styles.label} htmlFor="passwordInput">
                PASSWORD
              </label>
              <input
                placeholder="Password"
                type="password"
                id="passwordInput"
                value={password}
                onChange={this.passwordInput}
                className={styles.formInput}
                autoComplete='current-password'
              />
            <button className={styles.registerButton} type="submit">
              Sign Up
            </button>
            <p>
              {errorMessageText}
            </p>
            <p className={styles.loginPrompt}>Already have an account? {' '} <Link to="/login" className={styles.link}>Login</Link></p>
          </form>
        </div>
      </div>
    )
  }
}

export default Register