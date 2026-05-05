import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  FileText, 
  User,
  Menu,
  X,
  Users as UsersIcon,
} from 'lucide-react';
import logoUnison from '../../styles/logo_unison.png';
import { Button } from './ui/button';
import { useState } from 'react';
import { getCurrentUser } from '../lib/storage';
import { getRoleLabel } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  if (!user) {
    navigate('/');
    return null;
  }

  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Servicios', href: '/services', icon: ClipboardList },
    { name: 'Equipos y Utensilios', href: '/equipment', icon: Wrench },
    { name: 'Reportes', href: '/reports', icon: FileText },
    { name: 'Técnicos', href: '/technicians', icon: User },
    ...(user?.role === 'admin' ? [{ name: 'Usuarios', href: '/users', icon: UsersIcon }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/services') {
      return location.pathname.startsWith('/services');
    }
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-sidebar text-sidebar-foreground
        shadow-2xl z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-3 group no-hover">
             <div>
                <img src={logoUnison} alt="Logo Unison" className="h-15 w-15 object-contain" />
              </div>
              <div>
                <span className="font-bold text-white text-lg block leading-none">Agenda de Carpintería Unison</span>
                <span className="text-blue-300 text-xs">Sistema de Gestión</span>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-300 to-blue-500 p-2.5 rounded-full shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-blue-300">
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 p-4 space-y-2 ${user.role === 'admin' ? 'overflow-y-auto pr-2 scrollbar-thin' : 'overflow-hidden'}`}>
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium cursor-pointer
                    transition-all duration-200

                    ${active 
                      ? 'active bg-white text-blue-900 shadow-lg shadow-blue-900/20 cursor-pointer' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Profile Link */}
          <div className="p-4 border-t border-sidebar-border">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium cursor-pointer
                transition-all duration-200

                ${location.pathname === '/profile'
                  ? 'bg-white text-blue-900 shadow-lg pointer-events-none'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <User className="h-5 w-5" />
              <span>Mi Perfil</span>
            </Link>
          </div>

          {/* Footer */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar-accent">
              <p className="text-xs text-blue-300 text-center">
                Agenda de Carpintería Unison
              </p>
            </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar for mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-blue-50"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-1.5 rounded-lg shadow">
                <img src={logoUnison} alt="Logo Unison" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-bold text-gray-900">Agenda de Carpintería Unison</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
