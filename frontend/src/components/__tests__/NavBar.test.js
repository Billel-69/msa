import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import NavBar from '../NavBar';

// Mock the AuthContext
const mockAuthContext = {
  user: {
    id: 1,
    username: 'testuser',
    user_type: 'student'
  },
  logout: jest.fn()
};

const MockAuthProvider = ({ children, value = mockAuthContext }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const renderWithRouter = (component, authValue) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('NavBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation links when user is authenticated', () => {
    renderWithRouter(<NavBar />, mockAuthContext);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Mondes')).toBeInTheDocument();
    expect(screen.getByText('Fragments')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
  });

  it('shows login link when user is not authenticated', () => {
    const unauthenticatedContext = {
      user: null,
      logout: jest.fn()
    };

    renderWithRouter(<NavBar />, unauthenticatedContext);

    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.queryByText('Profil')).not.toBeInTheDocument();
  });

  it('displays username when authenticated', () => {
    renderWithRouter(<NavBar />, mockAuthContext);

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    renderWithRouter(<NavBar />, mockAuthContext);

    const logoutButton = screen.getByText('Déconnexion');
    fireEvent.click(logoutButton);

    expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
  });

  it('shows admin link for admin users', () => {
    const adminContext = {
      user: {
        id: 1,
        username: 'admin',
        user_type: 'admin'
      },
      logout: jest.fn()
    };

    renderWithRouter(<NavBar />, adminContext);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('does not show admin link for regular users', () => {
    renderWithRouter(<NavBar />, mockAuthContext);

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});