import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from '@/components/ui/Logo';

const schema = z.object({
    username: z.string().min(2, "Usuário muito curto"),
    password: z.string().min(4, "Senha muito curta"),
});

const Login = () => {
    const { login, checkSystemStatus } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        const check = async () => {
            const status = await checkSystemStatus();
            if (!status.initialized) {
                navigate('/setup');
            }
        };
        check();
    }, [checkSystemStatus, navigate]);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof schema>) => {
        try {
            setError('');
            await login(data.username, data.password);
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Ocorreu um erro";
            setError(message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 flex-col gap-8 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

            {/* Logo */}
            <Logo variant="central" className="h-28 animate-slide-down z-10" />

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-2xl animate-slide-up border-2 relative z-10 backdrop-blur-sm bg-card/95">
                <CardHeader className="space-y-3 pb-6">
                    <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Bem-vindo
                    </CardTitle>
                    <CardDescription className="text-center text-base">
                        Sistema de Gestão de Ausências
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold">Usuário</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Digite seu usuário"
                                                {...field}
                                                className="h-11 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold">Senha</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Digite sua senha"
                                                {...field}
                                                className="h-11 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-slide-down">
                                    <p className="text-sm text-destructive text-center font-medium">{error}</p>
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] font-semibold text-base"
                            >
                                Entrar
                            </Button>
                        </form>
                    </Form>
                </CardContent>

            </Card>
        </div>
    );
};

export default Login;
