import React from 'react';

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
  return (
    <div className="login-wrap">
      <div className="login-header">
        <img src={logoSrc} alt="MIND" className="logo" />
        <h1>MIND</h1>
        <p>Mental Health Intelligence for Nurturing and Development</p>
      </div>

      <form className="card login-card" onSubmit={onSubmit}>
        <h2>Welcome Back</h2>
        <p className="muted">Admin portal access</p>
        <label>Email</label>
        <input type="email" value={email} onChange={onEmailChange} required />
        <label>Password</label>
        <input type="password" value={password} onChange={onPasswordChange} required />
        <button className="btn primary" type="submit" disabled={loading}>Login</button>
        {!!error && <div className="banner error">{error}</div>}
      </form>
    </div>
  );
}
