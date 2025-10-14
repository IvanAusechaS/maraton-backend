/**
 * Script de prueba para verificar el envío de emails con SendGrid
 * Ejecutar con: node test-sendgrid.js
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function testSendGrid() {
  console.log('🧪 Probando envío de email con SendGrid...\n');

  try {
    // Verificar que la API key esté configurada
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('❌ SENDGRID_API_KEY no está configurada en .env');
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('❌ SENDGRID_FROM_EMAIL no está configurada en .env');
    }

    console.log('✅ API Key encontrada');
    console.log('📧 Email remitente:', process.env.SENDGRID_FROM_EMAIL);
    
    // Configurar SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Preparar email de prueba
    const msg = {
      to: process.env.SENDGRID_FROM_EMAIL, // Enviar a ti mismo para probar
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: '🧪 Test de SendGrid - Maraton Backend',
      text: `Este es un email de prueba enviado desde Maraton Backend usando SendGrid API.
      
Fecha: ${new Date().toLocaleString()}
Estado: ✅ SendGrid configurado correctamente

SendGrid Free Tier:
- 100 emails por día
- No requiere dominio propio
- Perfecto para proyectos académicos`,
      html: `
        <h2>¡Email de prueba!</h2>
        <p>Este es un email de prueba enviado desde <strong>Maraton Backend</strong> usando SendGrid API.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Estado:</strong> ✅ SendGrid configurado correctamente</p>
        <hr>
        <h3>SendGrid Free Tier:</h3>
        <ul>
          <li>✅ 100 emails por día</li>
          <li>✅ No requiere dominio propio</li>
          <li>✅ Perfecto para proyectos académicos</li>
        </ul>
      `,
    };

    console.log('\n📤 Enviando email de prueba...');
    
    // Enviar email
    await sgMail.send(msg);

    console.log('\n✅ ¡Email enviado exitosamente!');
    console.log('💡 Revisa tu bandeja de entrada:', process.env.SENDGRID_FROM_EMAIL);
    
  } catch (error) {
    console.error('\n❌ Error al enviar email:');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status:', error.response.statusCode);
      console.error('Body:', error.response.body);
    }
    process.exit(1);
  }
}

testSendGrid();
