export interface AuthUser {
  id: number | string;
  username: string;
  email: string;
  nombre: string;
  roles: string[];
  es_admin_central: boolean;
  permisos: string[];
}

export interface AuthTokens { access: string; refresh: string }
export interface LoginResponse extends AuthTokens { user: AuthUser }
export interface RegistroEstudianteData {
  nombre: string;
  username: string;
  email: string;
  password: string;
  password_confirm?: string;
}
