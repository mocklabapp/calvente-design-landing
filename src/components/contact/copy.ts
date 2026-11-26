import type { Locale } from '@/i18n/locales';

// Contact copy. The title comes from the page registry; the rest is approved prototype
// text, with English translated. Email, phone, address and hours come from `site`.
export interface ContactCopy {
  email: string;
  phone: string;
  workshop: string;
  hours: string;
  name: string;
  studio: string;
  subject: string;
  message: string;
  subjects: readonly string[];
  send: string;
  toast: string;
}

export const contactCopy: Record<Locale, ContactCopy> = {
  es: {
    email: 'Email',
    phone: 'Teléfono',
    workshop: 'Taller',
    hours: 'Horario',
    name: 'Nombre',
    studio: 'Estudio o empresa',
    subject: 'Motivo',
    message: 'Mensaje',
    subjects: ['Proyecto de obra', 'Pieza a medida', 'Colecciones', 'Otro'],
    send: 'Enviar',
    toast: 'Mensaje de ejemplo: en la web real llegará al email del taller.',
  },
  en: {
    email: 'Email',
    phone: 'Phone',
    workshop: 'Workshop',
    hours: 'Hours',
    name: 'Name',
    studio: 'Studio or company',
    subject: 'Subject',
    message: 'Message',
    subjects: ['Building project', 'Made-to-measure piece', 'Collections', 'Other'],
    send: 'Send',
    toast: 'Sample message: on the live site it will reach the workshop’s email.',
  },
};
