# Correo de autenticacion de AgendaMe

## Que componente envia cada correo

Supabase Auth genera confirmaciones, recuperaciones, invitaciones, OTP y cambios
de correo. Para entregarlos necesita un servidor SMTP:

- El SMTP predeterminado compartido de Supabase es solo para desarrollo. Tiene
  limites muy bajos y normalmente solo entrega a miembros autorizados del
  proyecto.
- Custom SMTP significa que Supabase sigue enviando el correo, pero lo entrega
  mediante Gmail, Resend, Brevo u otro proveedor configurado por el propietario.
- Vercel aloja la aplicacion, pero no ofrece buzones ni SMTP.

## Piloto gratuito con Gmail

Una cuenta Gmail separada es suficiente para las primeras pruebas con negocios.
No usar el Gmail personal del propietario.

Direcciones sugeridas, sujetas a disponibilidad:

- `agendame.cuentas@gmail.com`
- `agendame.notificaciones@gmail.com`
- `soporte.agendameapp@gmail.com`

### Preparar Gmail

1. Crear la cuenta y completar sus opciones de recuperacion.
2. Activar la verificacion en dos pasos de Google.
3. Abrir `Cuenta de Google > Seguridad > Contrasenas de aplicaciones`.
4. Crear una contrasena llamada `Supabase AgendaMe`.
5. Guardarla temporalmente hasta completar Supabase. No colocarla en `.env`,
   documentacion, capturas ni Git.

Si Google no muestra Contrasenas de aplicaciones, revisar que la verificacion
en dos pasos este activa y que la cuenta no use Proteccion avanzada.

### Configurar Supabase

En el proyecto correcto abrir `Authentication > SMTP Settings` y activar Custom
SMTP con estos valores:

- Sender name: `AgendaMe`
- Sender email: la direccion Gmail completa
- Host: `smtp.gmail.com`
- Port: `465`
- Username: la direccion Gmail completa
- Password: la contrasena de aplicacion de 16 caracteres

Si el panel solicita tipo de seguridad, usar SSL/TLS con el puerto 465. Como
alternativa se puede probar STARTTLS con el puerto 587.

Al guardar, abrir `Authentication > Rate Limits`. Supabase aplica inicialmente
un limite conservador a los correos enviados con Custom SMTP. Mantenerlo bajo
durante el piloto y aumentarlo solo despues de revisar entregas y rebotes.

## URLs y plantillas

1. En `Authentication > URL Configuration`, configurar `Site URL` con el HTTPS
   del deployment que recibira a los usuarios.
2. Agregar localhost solamente a Redirect URLs de desarrollo.
3. En `Authentication > Email Templates > Confirm sign up`, usar:
   - Subject: `Confirma tu cuenta en AgendaMe`
   - Body: `docs/email-templates/confirm-signup.html`
4. Revisar tambien Recovery, Invite, Magic Link y Change Email.

La plantilla de confirmacion usa `{{ .ConfirmationURL }}`, variable oficial de
Supabase. Nunca construir manualmente tokens de confirmacion en el frontend.

## Prueba manual obligatoria

- Crear cuentas de prueba con Gmail y Outlook.
- Confirmar que el remitente visible sea AgendaMe.
- Confirmar que el boton abra el dominio configurado y no localhost.
- Probar confirmacion, recuperacion, invitacion y cambio de correo.
- Verificar enlace vencido, enlace reutilizado y reenvio demasiado rapido.
- Revisar `Authentication > Logs` si Supabase acepta el envio pero no llega.
- Confirmar que la respuesta al correo llegue a una bandeja atendida o que el
  mensaje indique claramente que no recibe respuestas.

## Paso posterior con dominio propio

Cuando AgendaMe tenga dominio, migrar el envio de autenticacion a un proveedor
transaccional y verificar SPF, DKIM y DMARC. Estructura recomendada:

- `cuentas@auth.tu-dominio.com` para autenticacion.
- `soporte@tu-dominio.com` como bandeja humana.
- Un subdominio distinto para marketing, si se agrega en el futuro.

El cambio no requiere reescribir los flujos de Supabase Auth: se reemplazan las
credenciales de Custom SMTP y el remitente desde el panel.
