'use client';

import React, { useState, useActionState } from 'react';
import { login, signup } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, ShieldAlert, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // React 19 useActionState helper
  const [loginState, loginAction, loginPending] = useActionState(login, null);
  const [signupState, signupAction, signupPending] = useActionState(signup, null);

  const isPending = loginPending || signupPending;
  const error = mode === 'login' ? loginState?.error : signupState?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Branding Title */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-md mb-3">
            <Shield className="h-5 w-5 text-emerald-400 fill-emerald-400/10" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">VetControl</h1>
          <p className="text-xs text-neutral-400 mt-1">Plataforma SaaS Veterinaria Multi-inquilino</p>
        </div>

        {/* Auth Card */}
        <Card className="border border-neutral-200/60 bg-white shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-neutral-900">
              {mode === 'login' ? 'Iniciar sesión en VetControl' : 'Registrar tu clínica'}
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              {mode === 'login' 
                ? 'Ingresa tus credenciales para acceder al tablero / panel' 
                : 'Crea una nueva organización de clínica para comenzar'
              }
            </CardDescription>
          </CardHeader>
          
          <form action={mode === 'login' ? loginAction : signupAction}>
            <CardContent className="space-y-3.5">
              {/* Error Callout */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* SignUp extra fields */}
              {mode === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Nombre de la Clínica / Org</label>
                    <Input 
                      name="clinicName" 
                      placeholder="Clínica Veterinaria Centro" 
                      required 
                      className="h-9 text-xs" 
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Nombre Completo</label>
                    <Input 
                      name="fullName" 
                      placeholder="Dr. Elizabeth Blackwell" 
                      required 
                      className="h-9 text-xs" 
                      disabled={isPending}
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Correo Electrónico</label>
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="nombre@clinica.com" 
                  required 
                  className="h-9 text-xs" 
                  disabled={isPending}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-neutral-500">Contraseña</label>
                  {mode === 'login' && (
                    <a href="#" className="text-[10px] text-neutral-400 hover:text-neutral-900 transition-colors">
                      ¿Olvidaste tu contraseña?
                    </a>
                  )}
                </div>
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="h-9 text-xs" 
                  disabled={isPending}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3.5 pt-2 pb-6 px-6">
              <Button 
                type="submit" 
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium h-9 text-xs flex items-center justify-center gap-1.5 rounded-lg transition-colors"
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta de Organización'}
              </Button>

              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors hover:underline mt-1"
                disabled={isPending}
              >
                {mode === 'login' 
                  ? "¿No tienes una cuenta? Registra tu clínica" 
                  : '¿Ya estás registrado? Inicia sesión'
                }
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
