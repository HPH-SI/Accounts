import { Document, Payment } from '@prisma/client'
import { Customer } from '@prisma/client'
import jsPDF from 'jspdf'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sizeOf from 'image-size'

interface LineItem {
  description: string
  quantity: number
  days: number
  unitPrice: number
  amount: number
}

export async function generateDocumentPDF(
  document: Document & { customer: Customer; payments?: Payment[] },
  lineItems: LineItem[]
): Promise<Buffer> {
  const doc = new jsPDF({ compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Document Type + Number on top left
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const docType = document.type === 'PROFORMA' ? 'PROFORMA INVOICE' : document.type
  doc.text(`${docType} - ${document.documentNumber}`, margin, yPos)
  yPos += 8

  // Date below document type
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const docDate = document.issueDate 
    ? new Date(document.issueDate).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    : new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
  doc.text(`Date: ${docDate}`, margin, yPos)
  yPos += 7
  doc.text(`Document #: ${document.documentNumber}`, margin, yPos)
  yPos += 15

  // Logo on right (if available)
  const logoWidth = 70 // Increased width for better visibility
  const logoX = pageWidth - margin - logoWidth
  const logoY = margin
  let logoAdded = false
  
  // Try to load logo from public folder
  const logoExtensions = ['png', 'jpg', 'jpeg', 'gif']
  for (const ext of logoExtensions) {
    const logoPath = join(process.cwd(), 'public', `logo.${ext}`)
    if (existsSync(logoPath)) {
      try {
        const logoData = await readFile(logoPath)
        const logoBase64 = logoData.toString('base64')
        const logoMimeType = ext === 'png' ? 'PNG' : ext === 'jpg' || ext === 'jpeg' ? 'JPEG' : 'GIF'
        
        // Get image dimensions to maintain aspect ratio
        let logoHeight = logoWidth * 0.4 // Default aspect ratio
        try {
          const dimensions = sizeOf(logoPath)
          if (dimensions.width && dimensions.height) {
            // Calculate height maintaining aspect ratio
            const aspectRatio = dimensions.height / dimensions.width
            logoHeight = logoWidth * aspectRatio
          }
        } catch (dimError) {
          // If dimension reading fails, use default aspect ratio
          console.warn('Could not read logo dimensions, using default aspect ratio')
        }
        
        // Add image to PDF with proper aspect ratio
        doc.addImage(
          `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${logoBase64}`,
          logoMimeType,
          logoX,
          logoY,
          logoWidth,
          logoHeight,
          undefined,
          'MEDIUM'
        )
        logoAdded = true
        break
      } catch (error) {
        // Continue to next format if this one fails
        console.error(`Failed to load logo.${ext}:`, error)
        continue
      }
    }
  }
  
  if (!logoAdded) {
    // Show placeholder if no logo found
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('LOGO', logoX, logoY + 10)
    doc.setTextColor(0, 0, 0)
  }

  // From section (Heritage Park Hotel details)
  yPos = margin + 25
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('From:', margin, yPos)
  yPos += 7
  doc.setFont('helvetica', 'normal')
  doc.text('Heritage Park Hotel,', margin, yPos)
  yPos += 6
  doc.text('P.O Box 1598,', margin, yPos)
  yPos += 6
  doc.text('Mendana Avenue,', margin, yPos)
  yPos += 6
  doc.text('Honiara, Solomon Islands', margin, yPos)
  yPos += 8
  doc.text('Ph: +677 45500', margin, yPos)
  yPos += 6
  doc.text('Email: reservations@heritageparkhotel.com.sb', margin, yPos)
  yPos += 15

  // To section (Customer details)
  doc.setFont('helvetica', 'bold')
  doc.text('To:', margin, yPos)
  yPos += 7
  doc.setFont('helvetica', 'normal')
  doc.text(document.customer.name, margin, yPos)
  yPos += 6
  if (document.customer.address) {
    const addressLines = doc.splitTextToSize(document.customer.address, pageWidth - 2 * margin - 60)
    addressLines.forEach((line: string) => {
      doc.text(line, margin, yPos)
      yPos += 6
    })
  } else {
    yPos += 6 // Space for address if not provided
  }
  if (document.customer.phone) {
    doc.text(`Ph: ${document.customer.phone}`, margin, yPos)
    yPos += 6
  } else {
    doc.text('Ph:', margin, yPos)
    yPos += 6
  }
  
  // Get customer emails
  let customerEmails = ''
  try {
    const emails = JSON.parse(document.customer.emails || '[]')
    customerEmails = Array.isArray(emails) ? emails.join(', ') : document.customer.emails
  } catch {
    customerEmails = document.customer.emails || ''
  }
  
  if (customerEmails) {
    doc.text(`Email: ${customerEmails}`, margin, yPos)
  } else {
    doc.text('Email:', margin, yPos)
  }
  yPos += 15

  // Table Header
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const tableStartY = yPos
  const colWidths = {
    qty: 20,
    description: 80,
    days: 20,
    unitPrice: 30,
    total: 30
  }
  
  let xPos = margin
  doc.text('QTY', xPos, yPos)
  xPos += colWidths.qty
  doc.text('DESCRIPTION', xPos, yPos)
  xPos += colWidths.description
  doc.text('DAY', xPos, yPos)
  xPos += colWidths.days
  doc.text('UNIT PRICE', xPos, yPos)
  xPos += colWidths.unitPrice
  doc.text('TOTAL', xPos, yPos)
  
  // Draw line under header
  yPos += 3
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Table rows
  doc.setFont('helvetica', 'normal')
  lineItems.forEach((item) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = margin + 10
    }
    
    xPos = margin
    doc.text(item.quantity.toString(), xPos, yPos)
    xPos += colWidths.qty
    
    // Description (may wrap)
    const descLines = doc.splitTextToSize(item.description, colWidths.description - 5)
    doc.text(descLines[0] || '', xPos, yPos)
    xPos += colWidths.description
    
    doc.text(item.days.toString(), xPos, yPos)
    xPos += colWidths.days
    
    doc.text(`$${item.unitPrice.toFixed(2)}`, xPos, yPos)
    xPos += colWidths.unitPrice
    
    doc.text(`$${item.amount.toFixed(2)}`, xPos, yPos)
    
    // If description wrapped, adjust for next row
    if (descLines.length > 1) {
      yPos += (descLines.length - 1) * 6
    }
    yPos += 6
  })

  yPos += 10

  // Totals
  doc.setFontSize(11)
  const totalsX = pageWidth - margin - 60
  doc.text(`Subtotal: $${document.subtotal.toFixed(2)}`, totalsX, yPos)
  yPos += 7
  if (document.taxAmount > 0) {
    doc.text(`Tax: $${document.taxAmount.toFixed(2)}`, totalsX, yPos)
    yPos += 7
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: $${document.totalAmount.toFixed(2)}`, totalsX, yPos)
  yPos += 15

  // Payment Summary (if invoice)
  if (document.type === 'INVOICE' && document.payments) {
    const totalPaid = document.payments.reduce((sum, p) => sum + p.amount, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Paid: $${totalPaid.toFixed(2)}`, totalsX, yPos)
    yPos += 7
    const outstanding = document.totalAmount - totalPaid
    if (outstanding > 0) {
      doc.text(`Outstanding: $${outstanding.toFixed(2)}`, totalsX, yPos)
    }
    yPos += 10
  }

  // Terms and Notes
  if (document.terms) {
    doc.setFontSize(10)
    doc.text('Terms & Conditions:', margin, yPos)
    yPos += 6
    const termsLines = doc.splitTextToSize(document.terms, pageWidth - 2 * margin)
    doc.text(termsLines, margin, yPos)
    yPos += termsLines.length * 6 + 5
  }

  if (document.notes) {
    doc.setFontSize(10)
    doc.text('Notes:', margin, yPos)
    yPos += 6
    const notesLines = doc.splitTextToSize(document.notes, pageWidth - 2 * margin)
    doc.text(notesLines, margin, yPos)
  }

  return Buffer.from(doc.output('arraybuffer'))
}
