import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export function generateReceiptPDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [92, 44, 22]; // #5C2C16 (brand chocolate)
  const accentColor: [number, number, number] = [142, 74, 35]; // #8E4A23 (brand caramel)
  const goldColor: [number, number, number] = [212, 175, 55]; // #D4AF37 (gold/honey)
  const bgCream: [number, number, number] = [253, 248, 240]; // #FDF8F0

  // Top Decorative Header Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(...goldColor);
  doc.rect(0, 32, 210, 2, 'F');

  // Header Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MUFFINNS SWEETS & BAKERS', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(245, 230, 210);
  doc.text('Artisanal Bakery & Traditional Pakistani Sweets', 14, 22);

  doc.setFontSize(8);
  doc.text('Model Town Branch, Bahawalpur | Tel: +92 300 1234567 | Order Receipt', 14, 27);

  // Invoice & Receipt Title Block
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`OFFICIAL INVOICE #${order.id}`, 14, 43);

  // Status Badge box
  const statusText = order.status.toUpperCase();
  doc.setFontSize(8);
  doc.setFillColor(...(order.status === 'Completed' ? [220, 245, 230] as [number, number, number] : [254, 243, 199] as [number, number, number]));
  doc.rect(155, 38, 41, 7, 'F');
  doc.setDrawColor(...accentColor);
  doc.rect(155, 38, 41, 7, 'S');
  doc.setTextColor(...(order.status === 'Completed' ? [20, 100, 50] as [number, number, number] : [140, 70, 20] as [number, number, number]));
  doc.text(`STATUS: ${statusText}`, 158, 42.5);

  // Metadata Grid (2 Columns)
  doc.setFillColor(...bgCream);
  doc.roundedRect(14, 48, 182, 32, 3, 3, 'F');
  doc.setDrawColor(230, 215, 195);
  doc.roundedRect(14, 48, 182, 32, 3, 3, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', 18, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName || 'Valued Guest', 50, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('WhatsApp Phone:', 18, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerPhone || 'N/A', 50, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Address:', 18, 69);
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(order.customerAddress || 'Store Pickup', 60);
  doc.text(addressLines, 50, 69);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', 118, 55);
  doc.setFont('helvetica', 'normal');
  const orderDate = new Date(order.createdAt).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  doc.text(orderDate, 142, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Mode:', 118, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentMethod, 142, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Ref:', 118, 69);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentReference || 'Direct Bakery Order', 142, 69);

  // Itemized Order Table using jspdf-autotable
  const tableRows = order.items.map((it, idx) => [
    (idx + 1).toString(),
    it.name + (it.notes ? `\nNote: "${it.notes}"` : ''),
    it.size || '-',
    it.quantity.toString(),
    `Rs. ${it.price.toLocaleString()}`,
    `Rs. ${(it.price * it.quantity).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Item Description', 'Size / Option', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [40, 25, 15],
      fontSize: 8.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [250, 245, 238]
    },
    margin: { left: 14, right: 14 }
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Totals Box (Right aligned)
  doc.setFillColor(...bgCream);
  doc.roundedRect(120, finalY, 76, 30, 3, 3, 'F');
  doc.setDrawColor(220, 200, 180);
  doc.roundedRect(120, finalY, 76, 30, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 125, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs. ${order.totalAmount.toLocaleString()}`, 188, finalY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Charge:', 125, finalY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text('FREE', 188, finalY + 13, { align: 'right' });

  // Divider line inside totals box
  doc.setDrawColor(200, 170, 140);
  doc.line(125, finalY + 17, 191, finalY + 17);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('Grand Total:', 125, finalY + 24);
  doc.text(`Rs. ${order.totalAmount.toLocaleString()}`, 188, finalY + 24, { align: 'right' });

  // Left Note Box
  doc.setFontSize(8);
  doc.setTextColor(100, 80, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('Terms & Bakery Policies:', 14, finalY + 6);
  doc.text('• All baked goods & sweets are prepared fresh daily.', 14, finalY + 11);
  doc.text('• Please verify your order items upon delivery.', 14, finalY + 16);
  doc.text('• For custom cake changes, notify us 2 hours in advance.', 14, finalY + 21);

  // Footer
  const footerY = Math.max(finalY + 45, 270);

  doc.setDrawColor(...goldColor);
  doc.line(14, footerY - 5, 196, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('Thank you for ordering with Muffinns Sweets & Bakers!', 105, footerY, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(130, 110, 90);
  doc.text('Freshness, Tradition & Quality in Every Bite • www.muffinns.pk', 105, footerY + 5, { align: 'center' });

  // Save PDF file
  const fileName = `Muffinns_Receipt_${order.id}.pdf`;
  doc.save(fileName);
}
