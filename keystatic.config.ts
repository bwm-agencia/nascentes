import { config, collection, fields } from '@keystatic/core';

// Em produção (painel hospedado) as alterações viram commits no GitHub. Localmente, gravam direto nos arquivos.
const useGithub = import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github';

const check = { validation: { isRequired: true } };

// ---------- Campos de SEO (iguais para pacotes e posts) ----------
const seoFields = {
  palavraChave: fields.text({
    label: 'SEO · Palavra-chave principal',
    description: 'A busca que esta página quer atender. Ex.: pousada romântica em Brotas. Ela deve aparecer no título, na descrição e no começo do texto.',
    validation: { isRequired: true, length: { min: 3, max: 70 } },
  }),
  palavrasSecundarias: fields.array(fields.text({ label: 'Palavra-chave' }), {
    label: 'SEO · Palavras-chave secundárias (opcional)',
    description: 'Variações e termos relacionados. Use no texto de forma natural, sem repetir à força.',
    itemLabel: (p) => p.value,
  }),
  metaTitulo: fields.text({
    label: 'SEO · Título no Google (meta title)',
    description: 'De 30 a 60 caracteres. Comece pela palavra-chave. Evite repetir o nome da pousada se o título ficar longo.',
    validation: { isRequired: true, length: { min: 30, max: 60 } },
  }),
  metaDescricao: fields.text({
    label: 'SEO · Descrição no Google (meta description)',
    description: 'De 120 a 155 caracteres. Inclua a palavra-chave e um motivo para clicar (benefício, preço, chamada para ação).',
    multiline: true,
    validation: { isRequired: true, length: { min: 120, max: 155 } },
  }),
  imagemCompartilhamento: fields.image({
    label: 'SEO · Imagem ao compartilhar (opcional)',
    description: 'Aparece no WhatsApp, Facebook e LinkedIn. Ideal: 1200 x 630. Se vazio, usa a foto principal.',
    directory: 'public/uploads/seo',
    publicPath: '/uploads/seo/',
  }),
  semIndexar: fields.checkbox({
    label: 'SEO · Não aparecer no Google (noindex)',
    description: 'Marque só para páginas que não devem ser encontradas na busca, como pacotes de teste.',
    defaultValue: false,
  }),
};


export default config({
  storage: useGithub
    ? { kind: 'github', repo: { owner: 'bwm-agencia', name: 'nascentes' } }
    : { kind: 'local' },
  ui: { brand: { name: 'Pousada das Nascentes' } },
  collections: {
    pacotes: collection({
      label: 'Pacotes (novos)',
      slugField: 'titulo',
      path: 'src/content/pacotes/*',
      format: { data: 'yaml' },
      columns: ['titulo', 'publicado'],
      schema: {
        titulo: fields.slug({ name: { label: 'Nome do pacote', description: 'Ex.: Pacote Feriado de Natal. Vira o endereço da página.', validation: { isRequired: true } } }),
        publicado: fields.checkbox({ label: 'Publicado no site', description: 'Desmarque para esconder o pacote sem apagá-lo.', defaultValue: true }),
        destaque: fields.checkbox({ label: 'Mostrar em destaque na lista de pacotes', defaultValue: false }),
        ...seoFields,
        fotoHero: fields.image({ label: 'Foto principal', directory: 'public/uploads/pacotes', publicPath: '/uploads/pacotes/', validation: { isRequired: true } }),
        fotoAlt: fields.text({ label: 'SEO · Descrição da foto principal (alt)', description: 'Descreva o que aparece na foto. Se couber, use a palavra-chave.', validation: { isRequired: true, length: { min: 10, max: 125 } } }),
        etiqueta: fields.text({ label: 'Etiqueta acima do título', description: 'Ex.: Fique 3, pague 2 em outubro', ...check }),
        tituloAntes: fields.text({ label: 'Título (parte normal)', description: 'Ex.: Três noites em Brotas,', ...check }),
        tituloDestaque: fields.text({ label: 'Título (parte em destaque, itálico)', description: 'Ex.: pagando duas' }),
        chamada: fields.text({ label: 'Texto de apoio', multiline: true, ...check }),
        precoValor: fields.text({ label: 'Preço (só o número)', description: 'Ex.: 1.070', ...check }),
        precoTermos: fields.text({ label: 'Condição do preço', description: 'Ex.: a partir de, 3 noites para o casal', ...check }),
        validade: fields.text({ label: 'Validade', description: 'Ex.: Outubro de 2026' }),
        mensagemWhatsapp: fields.text({ label: 'Mensagem do WhatsApp', description: 'Texto que já vai escrito quando a pessoa clicar em reservar.', multiline: true, ...check }),
        opcoes: fields.array(
          fields.object({
            nome: fields.text({ label: 'Nome da opção', ...check }),
            subtitulo: fields.text({ label: 'Subtítulo' }),
            valor: fields.text({ label: 'Preço (só o número)', ...check }),
            por: fields.text({ label: 'Condição', description: 'Ex.: 3 noites para o casal' }),
            itens: fields.array(fields.text({ label: 'Item' }), { label: 'O que inclui', itemLabel: (p) => p.value }),
            mensagemWhatsapp: fields.text({ label: 'Mensagem do WhatsApp desta opção', multiline: true }),
          }),
          { label: 'Opções de preço (opcional, até 3)', itemLabel: (p) => p.fields.nome.value || 'Opção', validation: { length: { max: 3 } } },
        ),
        notaOpcoes: fields.text({ label: 'Observação abaixo das opções', multiline: true }),
        inclui: fields.array(
          fields.object({
            titulo: fields.text({ label: 'Título do bloco', description: 'Ex.: Noites 1 e 2', ...check }),
            itens: fields.array(
              fields.object({
                texto: fields.text({ label: 'Item', ...check }),
                detalhe: fields.text({ label: 'Detalhe (opcional)' }),
              }),
              { label: 'Itens', itemLabel: (p) => p.fields.texto.value || 'Item' },
            ),
          }),
          { label: 'O que está incluso', itemLabel: (p) => p.fields.titulo.value || 'Bloco' },
        ),
        resumo: fields.array(
          fields.object({
            rotulo: fields.text({ label: 'Rótulo', ...check }),
            valor: fields.text({ label: 'Valor', ...check }),
          }),
          { label: 'Resumo do pacote (quadro lateral)', itemLabel: (p) => `${p.fields.rotulo.value}: ${p.fields.valor.value}` },
        ),
        faq: fields.array(
          fields.object({
            pergunta: fields.text({ label: 'Pergunta', ...check }),
            resposta: fields.text({ label: 'Resposta', multiline: true, ...check }),
          }),
          { label: 'Perguntas frequentes', itemLabel: (p) => p.fields.pergunta.value || 'Pergunta' },
        ),
        ctaEtiqueta: fields.text({ label: 'Chamada final: etiqueta', description: 'Ex.: Vagas limitadas' }),
        ctaTitulo: fields.text({ label: 'Chamada final: título', ...check }),
        ctaTexto: fields.text({ label: 'Chamada final: texto', multiline: true }),
      },
    }),

    posts: collection({
      label: 'Posts do blog (novos)',
      slugField: 'titulo',
      path: 'src/content/posts/*',
      format: { contentField: 'corpo' },
      columns: ['titulo', 'data', 'categoria'],
      schema: {
        titulo: fields.slug({ name: { label: 'Título do post', validation: { isRequired: true } } }),
        publicado: fields.checkbox({ label: 'Publicado no site', defaultValue: true }),
        data: fields.date({ label: 'Data de publicação', validation: { isRequired: true } }),
        categoria: fields.select({
          label: 'Categoria',
          options: [
            { label: 'Destaques de Brotas', value: 'Destaques de Brotas' },
            { label: 'Gastronomia', value: 'Gastronomia' },
            { label: 'Novidades da Pousada', value: 'Novidades da Pousada' },
            { label: 'Pacotes e Feriados', value: 'Pacotes e Feriados' },
            { label: 'Romance e Lua de Mel', value: 'Romance e Lua de Mel' },
            { label: 'Turismo de Aventura e Ecoturismo', value: 'Turismo de Aventura e Ecoturismo' },
          ],
          defaultValue: 'Destaques de Brotas',
        }),
        ...seoFields,
        resumo: fields.text({ label: 'Resumo do post (aparece no card da lista do blog)', description: 'De 80 a 200 caracteres. Pode ser diferente da descrição do Google.', multiline: true, validation: { isRequired: true, length: { min: 80, max: 200 } } }),
        fotoAlt: fields.text({ label: 'SEO · Descrição da foto de capa (alt)', description: 'Descreva o que aparece na foto. Se couber, use a palavra-chave.', validation: { isRequired: true, length: { min: 10, max: 125 } } }),
        atualizadoEm: fields.date({ label: 'SEO · Última atualização do conteúdo (opcional)', description: 'Atualize ao revisar o post. O Google valoriza conteúdo mantido.' }),
        perguntas: fields.array(
          fields.object({
            pergunta: fields.text({ label: 'Pergunta', validation: { isRequired: true } }),
            resposta: fields.text({ label: 'Resposta', multiline: true, validation: { isRequired: true, length: { min: 40, max: 400 } } }),
          }),
          { label: 'SEO · Perguntas e respostas (opcional)', description: 'Aparecem no fim do post e ajudam a ser citado em respostas do Google e de IAs. Escreva perguntas que o hóspede realmente faz.', itemLabel: (p) => p.fields.pergunta.value || 'Pergunta' },
        ),
        foto: fields.image({ label: 'Foto de capa', directory: 'public/uploads/blog', publicPath: '/uploads/blog/', validation: { isRequired: true } }),
        corpo: fields.document({
          label: 'Texto do post',
          formatting: true,
          dividers: true,
          links: true,
          images: { directory: 'public/uploads/blog', publicPath: '/uploads/blog/' },
        }),
      },
    }),
  },
});
