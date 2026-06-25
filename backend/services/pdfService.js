/**
 * ============================================
 * SERVICIO DE GENERACIÓN DE PDFs
 * ============================================
 * Este servicio contiene la lógica para generar facturas en PDF.
 * Usa la librería 'pdfkit' para crear PDFs programáticamente.
 * El PDF se crea en memoria y se envía al cliente o se guarda en disco.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Crea el directorio de facturas si no existe
 */
const ensureFacturasDir = () => {
  const facturasDir = path.join(__dirname, '../facturas');
  if (!fs.existsSync(facturasDir)) {
    fs.mkdirSync(facturasDir, { recursive: true });
  }
  return facturasDir;
};

/**
 * Genera una factura en PDF
 * @param {Object} factura - Objeto con los datos de la factura
 * @param {number} factura.id - ID de la factura
 * @param {string} factura.numeroFactura - Número de factura (ej: FAC-2026-00001)
 * @param {Date} factura.fechaEmision - Fecha de emisión
 * @param {string} factura.clienteNombre - Nombre del cliente
 * @param {string} factura.clienteEmail - Email del cliente
 * @param {string} factura.clienteDocumento - Cédula o NIT del cliente
 * @param {string} factura.direccionEnvio - Dirección de envío
 * @param {string} factura.telefonoEnvio - Teléfono de contacto
 * @param {number} factura.subtotal - Subtotal
 * @param {number} factura.impuesto - Impuesto (IVA)
 * @param {number} factura.total - Total a pagar
 * @param {string} factura.metodoPago - Método de pago
 * @param {Array} factura.detalles - Array de productos en la factura
 * @param {boolean} saveToFile - Si es true, guarda el PDF en disco
 * @returns {Promise<Buffer|string>} Buffer del PDF o ruta del archivo
 */
const generarFacturaPDF = (factura, saveToFile = true) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'letter',
        margin: 40
      });

      // Configurar destino del PDF
      const facturasDir = ensureFacturasDir();
      const nombreArchivo = `factura-${factura.numeroFactura.replace(/\//g, '-')}.pdf`;
      const rutaPDF = path.join(facturasDir, nombreArchivo);
      
      let buffers = [];
      let stream = null;

      if (saveToFile) {
        stream = fs.createWriteStream(rutaPDF);
        doc.pipe(stream);
      } else {
        // Si no se guarda en archivo, guardar en buffer
        doc.on('data', (chunk) => buffers.push(chunk));
      }

      // ==========================================
      // ENCABEZADO Y DATOS DE LA EMPRESA
      // ==========================================
      doc.fontSize(20).font('Helvetica-Bold').text('FACTURA', { align: 'center' });
      doc.moveDown(0.3);
      
      // Nombre de la empresa
      doc.fontSize(16).text('GAVAT', { align: 'center' });
      doc.fontSize(10).text('Ventanas, Puertas y Productos de Construcción', { align: 'center' });
      doc.fontSize(9).text('Cali, Colombia', { align: 'center' });
      doc.moveDown(0.5);

      // Línea separadora
      doc.strokeColor('#000000').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // ==========================================
      // INFORMACIÓN DE LA FACTURA
      // ==========================================
      doc.fontSize(10).font('Helvetica-Bold').text('DATOS DE LA FACTURA', { underline: true });
      doc.font('Helvetica');
      doc.fontSize(9);
      
      const leftCol = 40;
      const rightCol = 350;
      const currentY = doc.y;

      // Columna izquierda
      doc.text(`Número: ${factura.numeroFactura}`, leftCol, currentY);
      doc.text(`Fecha: ${new Date(factura.fechaEmision).toLocaleDateString('es-CO')}`, leftCol, doc.y);
      
      // Columna derecha
      doc.text(`Referencia: ${factura.numeroFactura}`, rightCol, currentY);
      doc.text(`Estado: ${factura.estado ? factura.estado.toUpperCase() : 'EMITIDA'}`, rightCol, doc.y);

      doc.moveDown(1);

      // ==========================================
      // INFORMACIÓN DEL CLIENTE
      // ==========================================
      doc.font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE', { underline: true });
      doc.font('Helvetica').fontSize(9);
      
      doc.text(`Nombre: ${factura.clienteNombre}`);
      doc.text(`Email: ${factura.clienteEmail}`);
      if (factura.clienteDocumento) {
        doc.text(`Documento: ${factura.clienteDocumento}`);
      }
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').fontSize(9).text('DIRECCIÓN DE ENVÍO');
      doc.font('Helvetica').fontSize(9);
      doc.text(factura.direccionEnvio);
      doc.text(`Teléfono: ${factura.telefonoEnvio}`);
      doc.moveDown(1);

      // ==========================================
      // TABLA DE DETALLES/PRODUCTOS
      // ==========================================
      const tableTop = doc.y;
      const col1 = 40;      // Producto
      const col2 = 300;     // Cantidad
      const col3 = 380;     // Precio Unit.
      const col4 = 480;     // Subtotal
      const rowHeight = 20;

      // Encabezados de tabla
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('DESCRIPCIÓN', col1, tableTop);
      doc.text('CANTIDAD', col2, tableTop);
      doc.text('PRECIO UNIT.', col3, tableTop);
      doc.text('SUBTOTAL', col4, tableTop);

      // Línea separadora de tabla
      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Datos de productos
      doc.font('Helvetica').fontSize(8);
      let currentRowY = tableTop + 20;

      if (factura.detalles && Array.isArray(factura.detalles)) {
        factura.detalles.forEach((detalle) => {
          const producto = detalle.nombre || detalle.productoNombre || 'Producto';
          const cantidad = detalle.cantidad || 1;
          const precio = parseFloat(detalle.precioUnitario || detalle.precio || 0).toFixed(2);
          const subtotal = (cantidad * precio).toFixed(2);

          doc.text(producto, col1, currentRowY, { width: 260, ellipsis: true });
          doc.text(cantidad.toString(), col2, currentRowY);
          doc.text(`$${parseFloat(precio).toLocaleString('es-CO')}`, col3, currentRowY);
          doc.text(`$${parseFloat(subtotal).toLocaleString('es-CO')}`, col4, currentRowY);

          currentRowY += rowHeight;
        });
      }

      // Línea final de tabla
      doc.moveTo(col1, currentRowY).lineTo(550, currentRowY).stroke();
      currentRowY += 15;

      // ==========================================
      // TOTALES
      // ==========================================
      doc.font('Helvetica-Bold').fontSize(9);
      
      const subtotal = parseFloat(factura.subtotal).toFixed(2);
      const impuesto = parseFloat(factura.impuesto).toFixed(2);
      const total = parseFloat(factura.total).toFixed(2);

      doc.text('SUBTOTAL:', 380, currentRowY);
      doc.text(`$${parseFloat(subtotal).toLocaleString('es-CO')}`, 480, currentRowY);
      currentRowY += 20;

      doc.text('IVA (19%):', 380, currentRowY);
      doc.text(`$${parseFloat(impuesto).toLocaleString('es-CO')}`, 480, currentRowY);
      currentRowY += 20;

      // Línea separadora antes del total
      doc.moveTo(380, currentRowY - 5).lineTo(550, currentRowY - 5).stroke();

      doc.fontSize(11).text('TOTAL A PAGAR:', 380, currentRowY);
      doc.fontSize(12).text(`$${parseFloat(total).toLocaleString('es-CO')}`, 480, currentRowY);

      // ==========================================
      // INFORMACIÓN DE PAGO
      // ==========================================
      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(9).text('MÉTODO DE PAGO');
      doc.font('Helvetica').fontSize(8);
      doc.text(`${factura.metodoPago ? factura.metodoPago.toUpperCase() : 'NO ESPECIFICADO'}`);

      if (factura.referenciaPago) {
        doc.text(`Referencia: ${factura.referenciaPago}`);
      }

      // ==========================================
      // PIE DE PÁGINA
      // ==========================================
      doc.moveDown(1.5);
      doc.fontSize(8).fillColor('#666666');
      doc.text('Gracias por su compra', { align: 'center' });
      doc.text('Esta factura es válida como comprobante de pago', { align: 'center' });
      doc.text('Para consultas contacte a: info@gavat.com', { align: 'center' });

      // Número de página
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
          .fillColor('#999999')
          .text(`Página ${i + 1} de ${pages}`, 40, 750, { align: 'right' });
      }

      // Finalizar documento
      doc.end();

      if (saveToFile) {
        stream.on('finish', () => {
          resolve(rutaPDF);
        });
        stream.on('error', (err) => {
          reject(err);
        });
      } else {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
      }

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Obtiene la ruta del archivo PDF de una factura
 * @param {string} numeroFactura - Número de factura
 * @returns {string} Ruta del archivo PDF
 */
const obtenerRutaFactura = (numeroFactura) => {
  const facturasDir = ensureFacturasDir();
  const nombreArchivo = `factura-${numeroFactura.replace(/\//g, '-')}.pdf`;
  return path.join(facturasDir, nombreArchivo);
};

/**
 * Verifica si existe un PDF de factura
 * @param {string} numeroFactura - Número de factura
 * @returns {boolean} True si el archivo existe
 */
const existeFacturaPDF = (numeroFactura) => {
  const rutaPDF = obtenerRutaFactura(numeroFactura);
  return fs.existsSync(rutaPDF);
};

/**
 * Obtiene el contenido del PDF en buffer
 * @param {string} numeroFactura - Número de factura
 * @returns {Promise<Buffer>} Buffer del PDF
 */
const obtenerBufferFactura = (numeroFactura) => {
  return new Promise((resolve, reject) => {
    const rutaPDF = obtenerRutaFactura(numeroFactura);
    fs.readFile(rutaPDF, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

module.exports = {
  generarFacturaPDF,
  obtenerRutaFactura,
  existeFacturaPDF,
  obtenerBufferFactura,
  ensureFacturasDir
};
