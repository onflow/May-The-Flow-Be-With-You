/**
 * OpenGraph Image Generator for Elemental Strikers
 * 
 * Prerequisite: You need to install puppeteer first:
 * $ npm install puppeteer
 * 
 * Usage:
 * $ node scripts/generate-og-image.js
 * 
 * This script will:
 * 1. Load the HTML template from public/assets/opengraph-image.html
 * 2. Render it to a PNG file at public/assets/opengraph-image.png
 * 3. This image can then be used for social media sharing
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateOpenGraphImage() {
  console.log('Generating OpenGraph image...');
  
  try {
    // Iniciar Puppeteer con configuración mínima para compatibilidad máxima
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({
      width: 1200,
      height: 630
    });
    
    // Ruta al archivo HTML
    const htmlPath = path.join(__dirname, '..', 'public', 'assets', 'opengraph-image.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Usar setContent en lugar de goto para evitar problemas con rutas de archivo
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Esperar un segundo usando setTimeout con promesa para compatibilidad
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Ruta para la imagen de salida
    const outputPath = path.join(__dirname, '..', 'public', 'assets', 'opengraph-image.png');
    
    // Capturar screenshot con configuración mínima
    await page.screenshot({
      path: outputPath,
      type: 'png'
    });
    
    await browser.close();
    console.log(`OpenGraph image generated at: ${outputPath}`);
  } catch (error) {
    console.error('Error detallado:', error);
    throw error;
  }
}

generateOpenGraphImage()
  .catch(err => {
    console.error('Error generating OpenGraph image:', err);
    process.exit(1);
  }); 