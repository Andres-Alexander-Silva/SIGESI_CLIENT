import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './AdminRoute';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: useAuthMock,
}));

function renderWithRole(activeRole: string | null) {
  useAuthMock.mockReturnValue({ activeRole });
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<div>Contenido administrativo</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminRoute', () => {
  it('renderiza el contenido protegido cuando el rol activo es administrador', () => {
    renderWithRole('administrador');
    expect(screen.getByText('Contenido administrativo')).toBeInTheDocument();
  });

  it('bloquea el acceso y muestra un mensaje cuando el rol activo no es administrador', () => {
    renderWithRole('estudiante');
    expect(screen.queryByText('Contenido administrativo')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
  });

  it('bloquea el acceso cuando no hay rol activo seleccionado', () => {
    renderWithRole(null);
    expect(screen.queryByText('Contenido administrativo')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
  });
});
