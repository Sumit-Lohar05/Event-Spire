import { useState } from "react";
import { Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import './Auth.css';
import { apiFetch, ApiError } from "../../utils/api";

const Auth = ({isOpen, onClose, initialMode = true, onAuthSuccess}) => {
    const resetToken = new URLSearchParams(window.location.search).get('resetToken') || '';
    const [view, setView] = useState(() => resetToken ? 'reset' : initialMode ? 'login' : 'register');
    const [formData, setFormData] = useState({name: '', email: '', password: '', confirmPassword: ''});
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLogin = view === 'login';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(previous => ({ ...previous, [name]: value }));
        setError('');
        setNotice('');
    };

    const handleClose = () => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('resetToken')) {
        url.searchParams.delete('resetToken');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }
      onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setNotice('');

        if (view !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (view === 'reset') {
            if (formData.password.length < 8 || formData.password.length > 128) {
                setError('Password must be between 8 and 128 characters.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        } else if (view === 'login' && formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        } else if (view === 'register' && (formData.password.length < 8 || formData.password.length > 128)) {
            setError('Password must be between 8 and 128 characters.');
            return;
        }

        const endpoint = view === 'forgot'
            ? '/api/auth/forgot-password'
            : view === 'reset'
                ? '/api/auth/reset-password'
                : isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = view === 'forgot'
            ? { email: formData.email }
            : view === 'reset'
                ? { token: resetToken, password: formData.password }
                : { username: formData.name, email: formData.email, password: formData.password };

        setIsSubmitting(true);
        try {
          const data = await apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
          });
          if (view === 'forgot') {
            setNotice('If an account exists for that email, a password reset link will be sent.');
          } else if (view === 'reset') {
            const url = new URL(window.location.href);
            url.searchParams.delete('resetToken');
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
            setView('login');
            setFormData(previous => ({ ...previous, password: '', confirmPassword: '' }));
            setNotice(data.message || 'Password updated. You can now sign in.');
          } else if (data) {
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                if (isLogin) {
                    onAuthSuccess(data);
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    onClose();
                } else {
                    setView('login');
                    setFormData(previous => ({ ...previous, password: '' }));
                    setNotice('Account created! Please verify your email, then sign in.');
                }
            }, 2000);
          }
        } catch (error) {
          console.error('Error during authentication:', error);
          setError(error instanceof ApiError
            ? error.message
            : 'Could not connect to the server. Please try again later.');
        } finally {
          setIsSubmitting(false);
        }
    };

    if(!isOpen) return null;

    return (
      <div className="auth-overlay" onClick={handleClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={handleClose} aria-label="Close authentication dialog">
            &times;
          </button>

          {isSuccess ? (
            <div className="success-message">
              <Check size={48} color="#10b981" />
              <h2>{isLogin ? "Login Successful!" : "Account Created!"}</h2>
              <p>Welcome to EventSpire. Redirecting...</p>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h2>{view === 'reset' ? 'Choose a new password' : view === 'forgot' ? 'Reset your password' : isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p>
                  {view === 'reset'
                    ? 'Enter a new password for your account.'
                    : view === 'forgot'
                        ? 'Enter your email and we will send a reset link if an account matches.'
                        : isLogin ? 'Login to manage your tickets' : 'Join us to start exploring events'}
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <p className="error-text">{error}</p>}
                {notice && <p className="auth-notice" role="status">{notice}</p>}

                {view === 'register' && (
                  <div className={`input-group ${error && !formData.name ? "input-error" : ""}`}>
                    <User size={20} />
                    <input name="name" type="text" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                  </div>
                )}

                {view !== 'reset' && (
                  <div className="input-group">
                    <Mail size={20} />
                    <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                  </div>
                )}

                {view !== 'forgot' && (
                  <div className="input-group">
                    <Lock size={20} />
                    <input name="password" type="password" placeholder={view === 'reset' ? 'New password' : 'Password'} value={formData.password} onChange={handleChange} autoComplete={view === 'reset' ? 'new-password' : isLogin ? 'current-password' : 'new-password'} required />
                  </div>
                )}

                {view === 'reset' && (
                  <div className="input-group">
                    <Lock size={20} />
                    <input name="confirmPassword" type="password" placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
                  </div>
                )}

                <button type="submit" className="auth-submit">
                  {isSubmitting ? 'Please wait...' : view === 'forgot' ? 'Send reset link' : view === 'reset' ? 'Update password' : isLogin ? 'Sign In' : 'Sign Up'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="auth-footer">
                {view === 'login' && <button type="button" className="auth-text-button forgot-password" onClick={() => { setView('forgot'); setError(''); setNotice(''); }}>Forgot password?</button>}
                <p>
                  {view === 'forgot' || view === 'reset' ? 'Remembered your password?' : isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button type="button" className="toogle-auth" onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>
                    {view === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );    
};

export default Auth;
