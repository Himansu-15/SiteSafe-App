import { store } from '../store';
import { loginUser, logoutUser, clearError } from '../store/slices/authSlice';

describe('authSlice', () => {
  beforeEach(() => {
    store.dispatch({ type: 'auth/clearError' });
  });

  it('has correct initial state', () => {
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clears error', () => {
    store.dispatch(clearError());
    const state = store.getState().auth;
    expect(state.error).toBeNull();
  });
});