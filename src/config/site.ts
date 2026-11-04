// Dados do site em um lugar só. Alterou aqui, mudou em todas as páginas.
export const whatsapp = '5514991797722';
export const whatsappText = 'Olá! Gostaria de consultar valores e disponibilidade.';
export const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsapp}&text=${whatsappText}`;

// ---------- Identidade e SEO ----------
// Domínio final de produção. Em teste/preview pode-se sobrescrever com PUBLIC_SITE_URL.
export const siteUrl = (import.meta.env?.PUBLIC_SITE_URL ?? 'https://www.pousadadasnascentes.com.br').replace(/\/$/, '');
export const siteName = 'Pousada das Nascentes';

export const business = {
  name: 'Pousada das Nascentes',
  street: 'Av. Antonio Mariano do Prado, 260',
  district: 'Patrimônio de São Sebastião da Serra',
  city: 'Brotas',
  state: 'SP',
  zip: '17380-000',
  geo: { latitude: -22.443681, longitude: -48.009451 }, // do mapa da página Localização
  phone: '+551436536133',
  phoneWhatsapp: '+5514991797722',
  sameAs: [
    'https://www.facebook.com/pousadadasnascentesbrotas',
    'https://instagram.com/pousadadasnascentes',
    'https://www.tripadvisor.com.br/Hotel_Review-g793338-d2529742-Reviews-Pousada_das_Nascentes-Brotas_State_of_Sao_Paulo.html',
  ],
  defaultImage: '/fotos-hero/foto-05.webp',
};

export const defaultDescription =
  'Pousada das Nascentes em Brotas-SP: suítes temáticas, café da manhã, experiências a dois e reservas pelo WhatsApp.';

// Descrições para páginas que não têm uma própria.
export const descriptions: Record<string, string> = {
  '/': defaultDescription,
  '/suites': 'Conheça as suítes temáticas da Pousada das Nascentes, em Brotas-SP. Veja fotos e comodidades e reserve pelo WhatsApp.',
  '/pacotes': 'Pacotes e ofertas da Pousada das Nascentes, em Brotas-SP, para feriados e datas especiais. Consulte pelo WhatsApp.',
  '/experiencia': 'Conheça a experiência de se hospedar na Pousada das Nascentes, em Brotas-SP, à beira do rio.',
};

// ---------- Rastreamento / LGPD ----------
export const tracking = {
  gtmId: 'GTM-WCD9MLJ',          // GA4 (G-WL14SVBMC6) e demais tags ficam dentro do GTM
  metaPixelId: '424177358420876', // Pixel carregado direto no código, só após consentimento de marketing
};

// Dados do controlador (política de privacidade). Preencha quando tivermos: aparecem na página só se existirem.
export const controller = {
  razaoSocial: 'GIMENEZ BROTAS LTDA',
  cnpj: '06.342.466/0001-51',
  email: 'falecom@pousadadasnascentes.com.br',
  atualizadoEm: '3 de novembro de 2026',
};
