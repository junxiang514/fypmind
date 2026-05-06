import React, { useState } from 'react';
import bg from '../../../assets/websidebackground.jpg';

export default function AdminLoginPage({
  logoSrc,
  onSubmit,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  loading,
  error,
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div
      className="login-wrap"
      style={{
        ['--login-bg']: `url(${bg})`,
      }}
    >
      <div className="card login-card">
        <div className="login-header">
          <img src={logoSrc} alt="MIND" className="logo" />
          <h1>MIND</h1>
          <p>Mental Health Intelligence for Nurturing and Development</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <h2>Welcome Back</h2>
          <p className="muted">Portal access</p>
          <label>Email</label>
          <input type="email" value={email} onChange={onEmailChange} required />
          <label>Password</label>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={onPasswordChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.8 20.8 0 0 1 5.06-5.94" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button className="btn primary" type="submit" disabled={loading}>Login</button>
          {!!error && <div className="banner error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
