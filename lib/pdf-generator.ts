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
  doc.setTextColor(220, 38, 38)
  const docType = document.type === 'PROFORMA' ? 'PROFORMA INVOICE' : document.type
  doc.text(`${docType} - ${document.documentNumber}`, margin, yPos)
  doc.setTextColor(0, 0, 0)
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
  yPos += 15

  // Logo on right (if available)
  const logoWidth = 48 // Keep clear of the To column
  const logoX = pageWidth - margin - logoWidth
  const logoY = margin
  let logoAdded = false
  let logoHeight = 0
  
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
        logoHeight = logoWidth * 0.4 // Default aspect ratio
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
    logoHeight = 14
  }

  // From/To sections (two columns)
  const columnGap = 10
  const columnWidth = (pageWidth - 2 * margin - columnGap) / 2
  const leftX = margin
  const rightX = margin + columnWidth + columnGap
  const lineHeight = 6

  const columnsTop = Math.max(margin + 25, logoY + logoHeight + 10)
  let leftY = columnsTop
  let rightY = columnsTop

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('From:', leftX, leftY)
  leftY += 7
  doc.setFont('helvetica', 'normal')
  const fromLines = [
    'Heritage Park Hotel,',
    'P.O Box 1598,',
    'Mendana Avenue,',
    'Honiara, Solomon Islands',
    'Ph: +677 45500',
    'Email: reservations@heritageparkhotel.com.sb',
  ]
  fromLines.forEach((line) => {
    doc.text(line, leftX, leftY)
    leftY += lineHeight
  })

  doc.setFont('helvetica', 'bold')
  doc.text('To:', rightX, rightY)
  rightY += 7
  doc.setFont('helvetica', 'normal')
  doc.text(document.customer.name, rightX, rightY)
  rightY += lineHeight

  if (document.customer.address) {
    const addressLines = doc.splitTextToSize(document.customer.address, columnWidth)
    addressLines.forEach((line: string) => {
      doc.text(line, rightX, rightY)
      rightY += lineHeight
    })
  } else {
    rightY += lineHeight
  }

  if (document.customer.phone) {
    doc.text(`Ph: ${document.customer.phone}`, rightX, rightY)
  } else {
    doc.text('Ph:', rightX, rightY)
  }
  rightY += lineHeight

  let customerEmails = ''
  try {
    const emails = JSON.parse(document.customer.emails || '[]')
    customerEmails = Array.isArray(emails) ? emails.join(', ') : document.customer.emails
  } catch {
    customerEmails = document.customer.emails || ''
  }

  const emailLine = customerEmails ? `Email: ${customerEmails}` : 'Email:'
  const emailLines = doc.splitTextToSize(emailLine, columnWidth)
  emailLines.forEach((line: string) => {
    doc.text(line, rightX, rightY)
    rightY += lineHeight
  })

  yPos = Math.max(leftY, rightY) + 10

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
