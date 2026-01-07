import { prisma } from './prisma'
import { DocumentType } from '@prisma/client'

export async function generateDocumentNumber(type: DocumentType): Promise<string> {
  const year = new Date().getFullYear()
  
  // Get prefix from settings or use defaults
  const prefixMap: Record<DocumentType, string> = {
    QUOTATION: process.env.QUOTATION_PREFIX || 'QUO',
    PROFORMA: process.env.PROFORMA_PREFIX || 'PI',
    INVOICE: process.env.INVOICE_PREFIX || 'INV',
  }
  
  const prefix = prefixMap[type]
  
  // Find the highest number for this year and type
  const lastDoc = await prisma.document.findFirst({
    where: {
      type,
      documentNumber: {
        startsWith: `${prefix}-${year}-`,
      },
    },
    orderBy: {
      documentNumber: 'desc',
    },
  })
  
  let nextNumber = 1
  
  if (lastDoc) {
    // Extract number from format: PREFIX-YEAR-NUMBER
    const parts = lastDoc.documentNumber.split('-')
    const lastNumber = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }
  
  // Format: PREFIX-YEAR-XXX (e.g., INV-2025-001)
  return `${prefix}-${year}-${String(nextNumber).padStart(3, '0')}`
}

