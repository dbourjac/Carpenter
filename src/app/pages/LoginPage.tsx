import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Settings, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { login } from '../lib/storage';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        navigate('/dashboard');
      } else {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-2xl border-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-2xl shadow-lg">
              <Settings className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sistema de Gestión de Taller</CardTitle>
          <CardDescription className="text-base">
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
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" 
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

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
            <p className="text-blue-900 font-medium mb-2">Credenciales de prueba:</p>
            <div className="space-y-1 text-blue-700">
              <p><strong>Admin:</strong> admin@workshop.com</p>
              <p><strong>Jefe de Taller:</strong> carlos@workshop.com</p>
              <p><strong>Contraseña:</strong> password123</p>
              <p className="text-xs text-blue-600 mt-2">
                💡 El Admin puede registrar nuevos jefes de taller en la sección "Usuarios" del menú.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
