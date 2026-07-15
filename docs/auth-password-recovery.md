# Recuperação de senha

Checklist de configuração externa:

1. Configurar o SMTP transacional do Brevo em **Supabase > Authentication > SMTP Settings**.
2. Definir a **Site URL** como o domínio de produção da Locartech.
3. Adicionar `https://DOMINIO-DA-LOCARTECH/redefinir-senha` às **Redirect URLs** permitidas.
4. Revisar o template de e-mail de recuperação de senha no Supabase.
5. Testar o envio do link com uma conta real.
6. Abrir o link recebido, definir uma senha com ao menos 8 caracteres e confirmar o novo login.

O frontend não envia e-mails diretamente e não utiliza credenciais do Brevo.
