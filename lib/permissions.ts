export function canCreateDocument(role: string): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canEditDocument(role: string): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canDeleteDocument(role: string): boolean {
  return role === 'ADMIN'
}

export function canRecordPayment(role: string): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canSendEmail(role: string): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canViewReports(role: string): boolean {
  return true // All roles can view
}

export function canManageUsers(role: string): boolean {
  return role === 'ADMIN'
}

export function requiresApproval(role: string, documentType: string): boolean {
  // Staff users need approval for invoices (configurable)
  return role === 'STAFF' && documentType === 'INVOICE'
}

