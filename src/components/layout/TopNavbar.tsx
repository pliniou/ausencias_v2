import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Plane, Moon, Sun, Waves, TreePine, ShieldCheck, LogOut, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { useTheme, validThemes, type Theme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const navigation = [
    { name: 'Início', href: '/', icon: LayoutDashboard },
    { name: 'Calendário', href: '/calendario', icon: CalendarDays },
    { name: 'Afastamentos', href: '/afastamentos', icon: Plane },
];

const themeConfig: Record<Theme, { label: string; icon: React.ElementType; color: string }> = {
    dark: { label: 'Escuro', icon: Moon, color: 'text-slate-400' },
    light: { label: 'Claro', icon: Sun, color: 'text-amber-500' },
    ocean: { label: 'Oceano', icon: Waves, color: 'text-sky-400' },
    forest: { label: 'Floresta', icon: TreePine, color: 'text-emerald-500' },
};

export function TopNavbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const { sectorName } = useConfig();

    const handleLogout = () => {
        logout();
        toast.success('Logout realizado com sucesso!');
        navigate('/login');
    };

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        toast.success(`Tema alterado para ${themeConfig[newTheme].label}`);
    };

    const CurrentThemeIcon = themeConfig[theme]?.icon || Moon;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4">
                <div className="flex h-14 items-center justify-between">

                    {/* Left Section - Logo & Branding */}
                    <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0">
                        <Logo
                            variant="horizontal"
                            className="h-8 w-auto object-contain"
                        />
                        <div className="hidden sm:flex flex-col justify-center leading-none">
                            <span className="text-xs font-bold tracking-tight text-foreground">
                                Sistema de Gestão de Ausências
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                                Setor: {sectorName}
                            </span>
                        </div>
                    </Link>

                    {/* Center Section - Navigation */}
                    <nav className="flex items-center gap-0.5 bg-muted/50 rounded-full p-1 mx-4">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <item.icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                                    <span className="hidden md:inline">{item.name}</span>
                                </Link>
                            );
                        })}
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                                    location.pathname === '/admin'
                                        ? 'bg-background text-amber-600 shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">Admin</span>
                            </Link>
                        )}
                    </nav>

                    {/* Right Section - User & Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* User Badge */}
                        {user && (
                            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-muted/50 rounded-full mr-1">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary uppercase">
                                        {user.username.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-xs font-medium">{user.username}</span>
                                    <span className="text-[10px] text-muted-foreground capitalize">{user.role}</span>
                                </div>
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                    <CurrentThemeIcon className={cn("h-4 w-4", themeConfig[theme]?.color)} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                                    <Palette className="h-3.5 w-3.5" />
                                    Tema
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {validThemes.map((t) => {
                                    const config = themeConfig[t];
                                    const Icon = config.icon;
                                    return (
                                        <DropdownMenuItem
                                            key={t}
                                            onClick={() => handleThemeChange(t)}
                                            className="flex items-center justify-between cursor-pointer text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className={cn("h-3.5 w-3.5", config.color)} />
                                                <span>{config.label}</span>
                                            </div>
                                            {theme === t && <Check className="h-3.5 w-3.5 text-primary" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Logout Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            title="Sair"
                            className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
