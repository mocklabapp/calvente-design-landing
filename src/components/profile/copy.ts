import type { Locale } from '@/i18n/locales';

// Approved profile copy ("tal cual" from the prototype); English is translated.
export interface ProfileCopy {
  name: string;
  label: string;
  bio: readonly string[];
  portraitLabel: string;
  portraitPending: string;
}

export const profileCopy: Record<Locale, ProfileCopy> = {
  es: {
    name: 'Juanma Calvente',
    label: 'Artesano carpintero · Sevilla, 1983',
    bio: [
      'Trabaja la madera desde joven y convierte esa afición en oficio estudiando ebanistería. Gana varios premios en concursos nacionales de diseño de mobiliario.',
      'En 2003 ELISAVA lo admite en su posgrado de mueble contemporáneo, que no llega a cursar por motivos personales. Se forma entonces por su cuenta en Madrid.',
      'En 2005 vuelve a Sevilla y abre su propio taller de mobiliario artesano. Desde entonces trabaja estrechamente con estudios de arquitectura y diseño como Baum Arquitectura, Pablo Baruc o Kresta Design, y también con constructoras y promotoras. Destaca su reciente colaboración con el hotel Thomson 5* de Sevilla.',
      'Junto al trabajo por encargo desarrolla colecciones propias como Ensamble e Itera, esta última codiseñada con el arquitecto Pablo Baruc. Itera recibió un accésit en la categoría Diseño Arquitectónico de los Premios COAS Arquitectura & Sociedad 2025.',
      'Durante años el taller ha tenido una doble lectura: Madera y Vidrio, dedicada a la carpintería para la arquitectura, y Calvente, centrada en el mobiliario. En 2026 unificamos ambas marcas bajo Calvente Design, con la misma filosofía, para concentrar el esfuerzo y ofrecer a nuestros clientes la mejor imagen y el mejor servicio.',
    ],
    portraitLabel: 'Retrato pendiente',
    portraitPending: 'FOTO PENDIENTE',
  },
  en: {
    name: 'Juanma Calvente',
    label: 'Craftsman carpenter · Seville, 1983',
    bio: [
      'He has worked with wood since he was young and turned that hobby into a trade by studying cabinetmaking. He has won several national furniture design awards.',
      'In 2003 ELISAVA accepted him for its postgraduate course in contemporary furniture, which personal reasons kept him from taking. He then trained on his own in Madrid.',
      'In 2005 he returned to Seville and opened his own handmade furniture workshop. Since then he has worked closely with architecture and design studios such as Baum Arquitectura, Pablo Baruc and Kresta Design, as well as with builders and developers. A recent highlight is his work for the five-star Hotel Thomson in Seville.',
      'Alongside commissioned work he develops his own collections, such as Ensamble and Itera, the latter co-designed with architect Pablo Baruc. Itera received an Honourable Mention in the Architectural Design category of the 2025 COAS Architecture & Society Awards.',
      'For years the workshop has had two faces: Madera y Vidrio, devoted to architectural joinery, and Calvente, focused on furniture. In 2026 we brought both brands together under Calvente Design, with the same philosophy, to focus our efforts and give our clients the best image and service.',
    ],
    portraitLabel: 'Portrait pending',
    portraitPending: 'PHOTO PENDING',
  },
};
