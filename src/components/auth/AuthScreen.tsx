'use client';

import React, { useState } from 'react';
import { Globe, ShieldCheck, Mail, Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignIn(auth, email, password)
      .catch((error: any) => {
        setIsLoading(false);
        let message = "No se pudo iniciar sesión. Verifica tus credenciales.";
        if (error.code === 'auth/invalid-credential') {
          message = "Email o contraseña incorrectos. Por favor, inténtalo de nuevo.";
        }
        toast({
          variant: "destructive",
          title: "Error de acceso",
          description: message,
        });
      });
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    initiateAnonymousSignIn(auth)
      .catch(() => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error de acceso",
          description: "No se pudo iniciar sesión como invitado.",
        });
      });
  };

  return (
    <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Fondo Decorativo */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#54BBDA]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7381C0]/5 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-[450px] bg-[#0c0d0f]/80 backdrop-blur-2xl border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
        <CardHeader className="pt-12 pb-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7381C0] to-[#54BBDA] flex items-center justify-center shadow-[0_0_30px_rgba(84,187,218,0.3)]">
            <Globe className="text-[#0a0a0c]" size={32} />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Acceso GlobalPulse</CardTitle>
            <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Terminal de Vigilancia Epidemiológica</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Email de Operador</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <Input 
                  type="email" 
                  placeholder="operador@biosurv.es" 
                  className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-12 text-sm focus:ring-[#54BBDA]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-12 text-sm focus:ring-[#54BBDA]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest rounded-2xl text-xs transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Sincronizando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-[#0c0d0f] px-4 text-white/20">Acceso Alternativo</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGuestLogin}
            className="w-full h-14 border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest rounded-2xl text-xs"
            disabled={isLoading}
          >
            <UserPlus size={16} className="mr-2" /> Entrar como Invitado
          </Button>
        </CardContent>

        <CardFooter className="pb-12 pt-6 flex flex-col gap-4 items-center">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#54BBDA]/5 border border-[#54BBDA]/10 rounded-full">
            <ShieldCheck size={12} className="text-[#54BBDA]" />
            <span className="text-[9px] font-bold text-[#54BBDA] uppercase tracking-tighter">Conexión Encriptada TLS 1.3</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
