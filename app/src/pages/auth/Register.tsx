import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Register() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    tipo: 'propietario_residente',
    conjuntoId: '',
    unidad: '',
    bloque: '',
    consentimientoDatos: false,
    aceptaTerminos: false
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  const validateStep1 = () => {
    return formData.nombres && formData.apellidos && formData.email && formData.telefono;
  };

  const validateStep2 = () => {
    return formData.password && formData.password === formData.confirmPassword && formData.password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aceptaTerminos || !formData.consentimientoDatos) {
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        tipo: formData.tipo as any,
        conjuntoId: formData.conjuntoId,
        unidad: formData.unidad,
        torre: formData.bloque
      });
      setStep(3); // Éxito
    } catch (error) {
      // Error manejado en el store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administración</h1>
              <p className="text-sm text-muted-foreground">Conjunta</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 3 ? '¡Registro Exitoso!' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 && 'Información personal'}
              {step === 2 && 'Configura tu contraseña'}
              {step === 3 && 'Tu cuenta ha sido creada correctamente'}
            </CardDescription>
          </CardHeader>

          {step === 3 ? (
            <CardContent className="space-y-4 text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-muted-foreground">
                Ahora puedes iniciar sesión con tu correo y contraseña
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Ir al Inicio de Sesión
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombres">Nombres *</Label>
                        <Input
                          id="nombres"
                          placeholder="Juan"
                          value={formData.nombres}
                          onChange={(e) => handleChange('nombres', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos *</Label>
                        <Input
                          id="apellidos"
                          placeholder="Pérez"
                          value={formData.apellidos}
                          onChange={(e) => handleChange('apellidos', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        type="tel"
                        placeholder="3001234567"
                        value={formData.telefono}
                        onChange={(e) => handleChange('telefono', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Usuario *</Label>
                      <Select 
                        value={formData.tipo} 
                        onValueChange={(value) => handleChange('tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="propietario_residente">Propietario Residente</SelectItem>
                          <SelectItem value="arrendatario">Arrendatario</SelectItem>
                          <SelectItem value="propietario_no_residente">Propietario No Residente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloque">Bloque No.</Label>
                        <Input
                          id="bloque"
                          placeholder="Ej: Bloque 1"
                          value={formData.bloque}
                          onChange={(e) => handleChange('bloque', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unidad">No. Casa *</Label>
                        <Input
                          id="unidad"
                          placeholder="Ej: 101"
                          value={formData.unidad}
                          onChange={(e) => handleChange('unidad', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mínimo 6 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        required
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-destructive">
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="consentimiento" 
                          checked={formData.consentimientoDatos}
                          onCheckedChange={(checked) => handleChange('consentimientoDatos', checked as boolean)}
                        />
                        <Label htmlFor="consentimiento" className="text-sm font-normal leading-tight">
                          Doy mi consentimiento informado para el tratamiento de mis datos personales 
                          conforme a la Ley 1581 de 2012 (Habeas Data)
                        </Label>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="terminos" 
                          checked={formData.aceptaTerminos}
                          onCheckedChange={(checked) => handleChange('aceptaTerminos', checked as boolean)}
                        />
                        <Label htmlFor="terminos" className="text-sm font-normal leading-tight">
                          Acepto los términos y condiciones y la política de privacidad
                        </Label>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                {step === 1 ? (
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={() => setStep(2)}
                    disabled={!validateStep1()}
                  >
                    Continuar
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Atrás
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={!validateStep2() || !formData.aceptaTerminos || !formData.consentimientoDatos || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        'Crear Cuenta'
                      )}
                    </Button>
                  </div>
                )}

                <p className="text-sm text-center text-muted-foreground">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2024 Administración Conjunta. Todos los derechos reservados.
          <br />
          Cumplimos con la Ley 675 de 2001 y Ley 1581 de 2012
        </p>
      </div>
    </div>
  );
}


