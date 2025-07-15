import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import { AuthProvider } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock the useRouter hook from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders the login form correctly', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    // Check for the main title and description
    expect(screen.getByText('Synapse+')).toBeInTheDocument();
    expect(screen.getByText('Acesse sua conta para gerenciar a plataforma')).toBeInTheDocument();
    
    // Check for form labels and inputs
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    
    // Check for the submit button
    const loginButton = screen.getByRole('button', { name: /entrar/i });
    expect(loginButton).toBeInTheDocument();
    
    // Check for the link for users without an account
    expect(screen.getByText(/Não tem uma conta\?/)).toBeInTheDocument();
  });
});
