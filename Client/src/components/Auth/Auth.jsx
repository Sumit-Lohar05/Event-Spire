import { useEffect, useState } from "react";
import { Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import './Auth.css';

const Auth = ({isOpen, onClose, initialMode = true, onAuthSuccess}) => {
    const [isLogin, setIsLogin] = useState(initialMode);

    // Form Fields
    const [formData, setFormData] = useState({name: '', email: '', password: ''});
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        setIsLogin(initialMode);
        setError('');
        setFormData({name: '', email: '', password: ''});
    }, [initialMode, isOpen])

    // Handle Input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
}

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.email.includes('@')){
            setError('Please enter a valid email address.');
            return;
        }
        if(formData.password.length < 6){
            setError('Password must be atleast 6 characters.');
            return;
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        try {
          const response = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Send name only for registration and email, password for login
            body: JSON.stringify({
              username: formData.name,
              email: formData.email,
              password: formData.password,
            }),
          });
          const data = await response.json();
          if (response.ok) {
            setIsSuccess(true);
            // Success Logic
            setTimeout(() => {
                setIsSuccess(false);
                // If login successful, save user data and token
                if(isLogin){
                  onAuthSuccess(data);
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  onClose();
                } else {
                  // If registration successful,switch to login mode
                  setIsLogin(true);
                  setFormData({...formData, password: ''});
                  setError('Account created! Please verify your email, then sign in.');
                }
                
              }, 2000);
          } else {
            setError(data.message || 'Authentication failed');
          }
        } catch (error) {
          console.error('Error during authentication:', error);
          setError('Could not connect to the server. Please try again later.');
        }
    };

    if(!isOpen) return null;

    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>
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
                <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
                <p>
                  {isLogin ? "Login to manage your tickets" : "Join us to start exploring events"}
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <p className="error-text">{error}</p>}

                {!isLogin && (
                  <div className={`input-group ${error && !formData.name ? "input-error" : ""}`}>
                    <User size={20} />
                    <input name="name" type="text" placeholder="Full Name" onChange={handleChange} required />
                  </div>
                )}

                <div
                  className={`input-group ${error && !formData.email.includes("@") ? "input-error" : ""}`}>
                  <Mail size={20} />
                  <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                </div>

                <div className={`input-group ${error && formData.password.length < 6 ? "input-error" : ""}`}>
                  <Lock size={20} />
                  <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
                </div>

                <button type="submit" className="auth-submit">
                  {isLogin ? "Sign In" : "Sign Up"} <ArrowRight size={18} />
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <span className="toogle-auth" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Sign Up" : "Sign In"}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );    
};

export default Auth;
