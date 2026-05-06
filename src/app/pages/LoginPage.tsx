import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { authApi } from '../lib/api';
import { normalizeUser } from '../lib/utils';
import logoUnison from '../../styles/logo_unison.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      const userData = normalizeUser(await authApi.login(email, password));

      // Guardamos el usuario en localStorage
      localStorage.setItem('workshop_current_user', JSON.stringify(userData));

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err.response?.data?.message ||
                     err.response?.data?.error ||
                     'Error al conectar con el servidor. Por favor, verifica tus credenciales.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#1E293B] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-2xl border border-white/10 bg-[#111827]/95 backdrop-blur-xl text-white">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-2xl shadow-lg">
              <img 
                src={logoUnison}
                alt="Logo Unison"
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Agenda de Carpintería Unison
          </CardTitle>
          <CardDescription className="text-base text-blue-200">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-100">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/10 border-white/10 text-white placeholder:text-blue-200 focus:border-blue-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-100">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white/10 border-white/10 text-white placeholder:text-blue-200 focus:border-blue-400"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                'Ingresando...'
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Ingresar al Sistema
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
