import {Component} from 'react'
import {Redirect} from 'react-router-dom'
import Cookies from 'js-cookie'
import './index.css'

class Login extends Component {
  state = {username: '', password: '', fetchSuccess: true, errorMessageText: ''}

  usernameInput = event => {
    const {value} = event.target
    this.setState({username: value})
  }

  passwordInput = event => {
    const {value} = event.target
    this.setState({password: value})
  }

  tokenCamelCase = data => data.jwt_token

  fetchData = async () => {
    const {username, password} = this.state
    const url = 'https://apis.ccbp.in/login'
    const options = {
      method: 'POST',
      body: JSON.stringify({username, password}),
    }
    const response = await fetch(url, options)
    if (response.status === 200) {
      const data = await response.json()
      const jwtToken = this.tokenCamelCase(data)
      Cookies.set('jwt_token', jwtToken, {expires: 7})
      const {history} = this.props
      this.setState({fetchSuccess: true})
      history.replace('/')
    } else if (response.status === 401) {
      this.setState({
        fetchSuccess: false,
        errorMessageText: `username and password didn't match`,
      })
    } else {
      this.setState({fetchSuccess: false, errorMessageText: 'invalid username'})
    }
  }

  submitForm = event => {
    event.preventDefault()
    const {username, password} = this.state
    if (username === '' || password === '') {
      this.setState({
        fetchSuccess: false,
        errorMessageText: 'Username or password is invalid',
      })
    } else {
      this.fetchData()
    }
  }

  render() {
    const {username, password, fetchSuccess, errorMessageText} = this.state
    const token = Cookies.get('jwt_token')
    if (token !== undefined) {
      return <Redirect to="/" />
    }
    return (
      <div className="home">
        <div className="login-div">
          <div className="logo-div">
            <img
              className="logo"
              src="https://assets.ccbp.in/frontend/react-js/logo-img.png"
              alt="website logo"
            />
          </div>
          <form className="input-form" onSubmit={this.submitForm}>
            <div className="flex-col">
              <label className="input-label" htmlFor="usernameInput">
                USERNAME
              </label>
              <input
                placeholder="Username"
                type="text"
                id="usernameInput"
                value={username}
                onChange={this.usernameInput}
                className="cred-input"
              />
              <label className="input-label" htmlFor="passwordInput">
                PASSWORD
              </label>
              <input
                placeholder="Password"
                type="password"
                id="passwordInput"
                value={password}
                onChange={this.passwordInput}
                className="cred-input"
              />
            </div>
            <button className="login-button" type="submit">
              Login
            </button>
            <p
              className={
                fetchSuccess === false ? 'error-message' : 'hide-error-message'
              }
            >
              {errorMessageText}
            </p>
          </form>
        </div>
      </div>
    )
  }
}

export default Login