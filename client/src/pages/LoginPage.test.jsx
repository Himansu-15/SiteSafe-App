import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { store } from '../store';
import { LoginPage } from '../pages/LoginPage';

const renderWithProviders = (component) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form by default', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('SiteSafe')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('switches to register form when clicking register link', () => {
    renderWithProviders(<LoginPage />);
    
    fireEvent.click(screen.getByRole('link', { name: /register/i }));
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('shows validation errors for empty login form', () => {
    renderWithProviders(<LoginPage />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('shows validation errors for empty register form', () => {
    renderWithProviders(<LoginPage />);
    
    fireEvent.click(screen.getByRole('link', { name: /register/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Organization name is required')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderWithProviders(<LoginPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(screen.getByRole('button', { name: /visibility/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});