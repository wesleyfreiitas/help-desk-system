export function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // If it has country code 55 and then 10 or 11 digits
  if (digits.length === 13 && digits.startsWith('55')) {
    const local = digits.substring(2);
    return formatPhone(local);
  }
  
  if (digits.length === 12 && digits.startsWith('55')) {
    const local = digits.substring(2);
    return formatPhone(local);
  }

  return phone; 
}

export function toUpper(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.trim().toUpperCase();
}

export function formatDocument(doc: string | null | undefined): string | null {
  if (!doc) return null;
  const digits = doc.replace(/\D/g, '');
  
  if (digits.length === 11) {
    // CPF: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (digits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return doc;
}
