import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { loginUser, registerUser } from '../store/slices/authSlice';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    orgName: '',
    siteName: '',
    role: 'reporter',
    language: 'en',
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const loginForm = useForm({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const handleLogin = async (data) => {
    try {
      await dispatch(loginUser({ email: data.email, password: data.password })).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by slice
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await dispatch(registerUser(registerForm)).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by slice
    }
  };

  const handleRegisterChange = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', p: 0 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              SiteSafe
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('app.tagline')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {isRegister ? (
            <form onSubmit={handleRegister} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label={t('auth.name')}
                  value={registerForm.name}
                  onChange={(e) => handleRegisterChange('name', e.target.value)}
                  required
                  autoComplete="name"
                  error={!!registerForm.nameError}
                  helperText={registerForm.nameError}
                />
                <TextField
                  fullWidth
                  label={t('auth.email')}
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => handleRegisterChange('email', e.target.value)}
                  required
                  autoComplete="email"
                />
                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={(e) => handleRegisterChange('password', e.target.value)}
                  required
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={t('auth.orgNameRequired')}
                  value={registerForm.orgName}
                  onChange={(e) => handleRegisterChange('orgName', e.target.value)}
                  required
                  autoComplete="organization"
                />
                <TextField
                  fullWidth
                  label="Site Name (optional)"
                  value={registerForm.siteName}
                  onChange={(e) => handleRegisterChange('siteName', e.target.value)}
                  autoComplete="off"
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Role
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    value={registerForm.role}
                    onChange={(e) => handleRegisterChange('role', e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="reporter">{t('roles.reporter')}</option>
                    <option value="safety_officer">{t('roles.safety_officer')}</option>
                    <option value="manager">{t('roles.manager')}</option>
                    <option value="admin">{t('roles.admin')}</option>
                  </TextField>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isLoading ? t('auth.registering') : t('auth.register')}
                </Button>
              </Box>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label={t('auth.email')}
                  type="email"
                  {...loginForm.register('email', {
                    required: t('auth.emailRequired'),
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                  })}
                  error={!!loginForm.formState.errors.email}
                  helperText={loginForm.formState.errors.email?.message}
                  autoComplete="email"
                />
                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  {...loginForm.register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: { value: 8, message: t('auth.passwordMinLength') },
                  })}
                  error={!!loginForm.formState.errors.password}
                  helperText={loginForm.formState.errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="current-password"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...loginForm.register('rememberMe')}
                        color="primary"
                      />
                    }
                    label={t('auth.rememberMe')}
                  />
                  <Link href="#" variant="body2">
                    {t('auth.forgotPassword')}
                  </Link>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isLoading ? t('auth.loggingIn') : t('auth.login')}
                </Button>
              </Box>
            </form>
          )}

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {isRegister ? t('auth.noAccount') : "Don't have an account?"}{' '}
            <Link
              onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); }}
              variant="body2"
              color="primary"
              sx={{ fontWeight: 500 }}
            >
              {isRegister ? t('auth.login') : t('auth.register')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}