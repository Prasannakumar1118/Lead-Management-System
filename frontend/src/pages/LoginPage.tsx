import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  getApiErrorMessage,
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
} from '../services/api';
import { Sparkles, ArrowRight, Server, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // API Endpoint configuration & health check state
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(getApiBaseUrl());
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [healthMessage, setHealthMessage] = useState('Checking backend connection...');

  const checkHealth = async (urlToCheck?: string) => {
    setHealthStatus('checking');
    setHealthMessage('Checking connection...');
    const targetUrl = urlToCheck || getApiBaseUrl();
    const cleanUrl = targetUrl.replace(/\/+$/, '');
    const healthUrl = cleanUrl.endsWith('/api/v1')
      ? `${cleanUrl.slice(0, -7)}/health`
      : `${cleanUrl}/health`;

    try {
      const res = await fetch(healthUrl, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
      });
      if (res.ok) {
        setHealthStatus('healthy');
        setHealthMessage('Backend Online & Connected');
      } else {
        setHealthStatus('error');
        setHealthMessage(`Server returned HTTP ${res.status}`);
      }
    } catch {
      setHealthStatus('error');
      setHealthMessage('Unable to reach backend server');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back to LeadFlow!');
      navigate('/');
    } catch (err) {
      toast.error(getApiErrorMessage(err), 'Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSaveApiUrl = () => {
    if (!inputUrl.trim()) return;
    setApiBaseUrl(inputUrl.trim());
    setApiUrl(getApiBaseUrl());
    setIsEditingUrl(false);
    toast.success('API Endpoint updated!');
    checkHealth(inputUrl.trim());
  };

  const handleResetApiUrl = () => {
    resetApiBaseUrl();
    setApiUrl(getApiBaseUrl());
    setInputUrl(getApiBaseUrl());
    setIsEditingUrl(false);
    toast.info('API Endpoint reset to default.');
    checkHealth();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100 mx-auto mb-3">
          LF
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to LeadFlow
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Swan Digital Solutions Lead Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@swandigital.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Demo account quick login helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>One-Click Demo Evaluator Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('demo@swandigital.com', 'DemoPassword123!')}
                className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-xs"
              >
                <span className="font-semibold text-slate-900 block truncate">Demo Sales Rep</span>
                <span className="text-[10px] text-slate-500 block truncate">demo@swandigital.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@swandigital.com', 'AdminPassword123!')}
                className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-xs"
              >
                <span className="font-semibold text-purple-900 block truncate">Admin Executive</span>
                <span className="text-[10px] text-slate-500 block truncate">admin@swandigital.com</span>
              </button>
            </div>
          </div>

          {/* API Server Endpoint Status & Configuration */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    healthStatus === 'healthy'
                      ? 'bg-emerald-500'
                      : healthStatus === 'checking'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-slate-500 truncate text-[11px]">
                  Server:{' '}
                  <span className="text-slate-700 font-semibold font-mono" title={apiUrl}>
                    {apiUrl.replace(/^https?:\/\//, '')}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] shrink-0 ml-2"
              >
                {isEditingUrl ? 'Close' : 'Configure'}
              </button>
            </div>

            {isEditingUrl && (
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <p className="text-slate-600 font-medium text-[11px]">
                  Connect to your active backend server API:
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://your-backend.com/api/v1"
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <Button size="sm" type="button" onClick={handleSaveApiUrl}>
                    Save
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-[10px] font-medium flex items-center gap-1 ${
                      healthStatus === 'healthy'
                        ? 'text-emerald-600'
                        : healthStatus === 'checking'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {healthStatus === 'healthy' ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                    )}
                    {healthMessage}
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => checkHealth(inputUrl)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline inline-flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Test
                    </button>
                    <button
                      type="button"
                      onClick={handleResetApiUrl}
                      className="text-[10px] text-slate-500 hover:text-rose-600 underline"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
