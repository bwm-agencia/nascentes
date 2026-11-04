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


// ---------- Redirecionamento ao despublicar (pacotes e posts) ----------
const redirecionar = (colecao: 'pacotes' | 'posts') =>
  fields.conditional(
    fields.select({
      label: 'Ao despublicar, redirecionar para',
      description: 'Vale quando "Publicado no site" está desmarcado. Cria um redirecionamento 301 para quem tem o link antigo. Evite a página inicial (o Google pode ignorar).',
      options: [
        { label: 'Nenhum (erro 404)', value: 'nenhum' },
        { label: 'Lista de pacotes', value: '/pacotes' },
        { label: 'Suítes', value: '/suites' },
        { label: 'Blog', value: '/blog' },
        { label: 'Página inicial', value: '/' },
        { label: colecao === 'pacotes' ? 'Outro pacote' : 'Outro post', value: 'outro' },
      ],
      defaultValue: 'nenhum',
    }),
    {
      nenhum: fields.empty(),
      '/pacotes': fields.empty(),
      '/suites': fields.empty(),
      '/blog': fields.empty(),
      '/': fields.empty(),
      outro: fields.relationship({
        label: colecao === 'pacotes' ? 'Qual pacote?' : 'Qual post?',
        description: 'Escolha uma página que esteja publicada.',
        collection: colecao,
      }),
    },
  );

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
        destaqueTopo: fields.checkbox({ label: 'Fixar no topo da lista, em destaque grande', description: 'O pacote aparece acima dos demais, em um cartão largo com selo. Use para feriados e campanhas da vez. Vale para vários, mas funciona melhor com um ou dois.', defaultValue: false }),
        temaNatal: fields.checkbox({ label: 'Decoração de Natal no topo da página', description: 'Acrescenta pisca-pisca, brilho dourado e flocos suaves sobre a foto principal. Desmarque depois do Natal ou deixe desmarcado em outros pacotes.', defaultValue: false }),
        temaReveillon: fields.checkbox({ label: 'Fogos de artifício no topo da página', description: 'Acrescenta céu noturno e fogos animados sobre a foto principal. Use no pacote de Réveillon e desmarque depois da virada.', defaultValue: false }),
        redirecionar: redirecionar('pacotes'),
        mostrarNaHome: fields.checkbox({ label: 'Mostrar na página inicial', description: 'A página inicial mostra até 3 pacotes marcados, na ordem da lista. A chamada usa a foto, a etiqueta e os itens do card da lista.', defaultValue: false }),
        ...seoFields,
        fotoHero: fields.image({ label: 'Foto principal', directory: 'public/uploads/pacotes', publicPath: '/uploads/pacotes/', validation: { isRequired: true } }),
        fotoAlt: fields.text({ label: 'SEO · Descrição da foto principal (alt)', description: 'Descreva o que aparece na foto. Se couber, use a palavra-chave.', validation: { isRequired: true, length: { min: 10, max: 125 } } }),
        fotoFoco: fields.integer({ label: 'Enquadramento da foto principal', description: '0 = topo da foto, 100 = base da foto. Padrão: 55.', defaultValue: 55, validation: { min: 0, max: 100 } }),
        cardFoto: fields.image({ label: 'Foto no card da lista de pacotes (opcional)', description: 'Se vazio, usa a foto principal.', directory: 'public/uploads/pacotes', publicPath: '/uploads/pacotes/' }),
        cardEtiqueta: fields.text({ label: 'Etiqueta no card da lista (opcional)', description: 'Se vazio, usa a etiqueta acima do título.', validation: { length: { max: 40 } } }),
        cardItens: fields.array(fields.text({ label: 'Item' }), { label: 'Itens no card da lista (opcional, até 9)', description: 'Se vazio, usa os itens do primeiro bloco de "O que está incluso".', itemLabel: (p) => p.value, validation: { length: { max: 9 } } }),
        ordem: fields.integer({ label: 'Ordem na lista de pacotes', description: 'Número menor aparece primeiro. Vazio = vai para o fim da lista.' }),
        etiqueta: fields.text({ label: 'Etiqueta acima do título (ex.: nome do pacote)', description: 'Até 40 caracteres, para não quebrar linha no celular. Não é título (não conta como H1). Ex.: Pacote Feriado de Natal', validation: { isRequired: true, length: { max: 40 } } }),
        tituloAntes: fields.text({ label: 'Título (parte normal) · vira o H1', description: 'Junto com a parte em destaque forma o título principal da página (H1). Ex.: Três noites em Brotas,', ...check }),
        tituloDestaque: fields.text({ label: 'Título (parte em destaque, itálico) · vira o H1', description: 'Continuação do H1, em itálico. Ex.: pagando duas' }),
        chamada: fields.text({ label: 'Texto de apoio', multiline: true, ...check }),
        dias: fields.array(
          fields.object({
            semana: fields.text({ label: 'Dia da semana', description: 'Ex.: Sex' }),
            dia: fields.text({ label: 'Dia', description: 'Ex.: 20' }),
            mes: fields.text({ label: 'Mês', description: 'Ex.: nov' }),
            feriado: fields.checkbox({ label: 'É feriado', defaultValue: false }),
          }),
          { label: 'Calendário dos dias (opcional, para pacotes de feriado)', itemLabel: (p) => `${p.fields.semana.value} ${p.fields.dia.value}/${p.fields.mes.value}` },
        ),
        precoValor: fields.text({ label: 'Preço (só o número)', description: 'Ex.: 1.070', ...check }),
        precoTermos: fields.text({ label: 'Condição do preço', description: 'Ex.: a partir de, 3 noites para o casal', ...check }),
        validade: fields.text({ label: 'Validade', description: 'Ex.: Outubro de 2026' }),
        precoResumo: fields.text({ label: 'Condição do preço no quadro de resumo (opcional)', description: 'Se vazio, repete a condição do preço acima.' }),
        mensagemWhatsapp: fields.text({ label: 'Mensagem do WhatsApp', description: 'Texto que já vai escrito quando a pessoa clicar em reservar.', multiline: true, ...check }),
        opcoes: fields.array(
          fields.object({
            nome: fields.text({ label: 'Nome da opção · vira H3', description: 'Subtítulo (H3) dentro da seção de preços.', ...check }),
            subtitulo: fields.text({ label: 'Subtítulo' }),
            valor: fields.text({ label: 'Preço (só o número)', ...check }),
            por: fields.text({ label: 'Condição', description: 'Ex.: 3 noites para o casal' }),
            itens: fields.array(fields.text({ label: 'Item' }), { label: 'O que inclui', itemLabel: (p) => p.value }),
            mensagemWhatsapp: fields.text({ label: 'Mensagem do WhatsApp desta opção', multiline: true }),
          }),
          { label: 'Opções de preço (opcional, até 4)', itemLabel: (p) => p.fields.nome.value || 'Opção', validation: { length: { max: 4 } } },
        ),
        opcoesEtiqueta: fields.text({ label: 'Opções de preço: etiqueta da seção (opcional)', description: 'Ex.: Escolham a suíte' }),
        opcoesTitulo: fields.text({ label: 'Opções de preço: título da seção (opcional)', description: 'Vira H2. Ex.: Duas formas de aproveitar a oferta' }),
        opcoesTexto: fields.text({ label: 'Opções de preço: texto da seção (opcional)', multiline: true }),
        notaOpcoes: fields.text({ label: 'Observação abaixo das opções', multiline: true }),
        inclui: fields.array(
          fields.object({
            titulo: fields.text({ label: 'Título do bloco · vira H3', description: 'Subtítulo (H3) dentro da seção fixa "O que vocês vão ter" (H2). Ex.: Noites 1 e 2', ...check }),
            itens: fields.array(
              fields.object({
                texto: fields.text({ label: 'Item', ...check }),
                detalhe: fields.text({ label: 'Detalhe (opcional)' }),
              }),
              { label: 'Itens', itemLabel: (p) => p.fields.texto.value || 'Item' },
            ),
          }),
          { label: 'O que está incluso (seção H2 "O que vocês vão ter", cada bloco é um H3)', itemLabel: (p) => p.fields.titulo.value || 'Bloco' },
        ),
        incluiTitulo: fields.text({ label: 'O que está incluso: título da seção (opcional) · vira H2', description: 'Se vazio, usa "O que vocês vão ter".' }),
        incluiTexto: fields.text({ label: 'O que está incluso: texto da seção (opcional)', multiline: true }),
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
          { label: 'Perguntas frequentes (seção H2 fixa "Antes de reservar"; as perguntas não são títulos)', itemLabel: (p) => p.fields.pergunta.value || 'Pergunta' },
        ),
        manifesto: fields.object(
          {
            etiqueta: fields.text({ label: 'Etiqueta', description: 'Ex.: Por que este pacote existe' }),
            titulo: fields.text({ label: 'Título · vira H2' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
            agenda: fields.array(
              fields.object({ hora: fields.text({ label: 'Hora ou dia', description: 'Ex.: 7h00' }), tarefa: fields.text({ label: 'O que acontece' }) }),
              { label: 'Agenda riscada (opcional)', itemLabel: (p) => `${p.fields.hora.value} ${p.fields.tarefa.value}` },
            ),
            viradaFrase: fields.text({ label: 'Frase de virada', multiline: true }),
            viradaDestaque: fields.text({ label: 'Frase de virada: parte em destaque' }),
            viradaTexto: fields.text({ label: 'Texto depois da virada', multiline: true }),
          },
          { label: 'Seção de texto com agenda riscada (opcional)', description: 'Fica no começo da página. Deixe o título vazio para não mostrar.' },
        ),
        manifestoFinal: fields.object(
          {
            etiqueta: fields.text({ label: 'Etiqueta' }),
            frase: fields.text({ label: 'Frase principal', description: 'Ela abre a seção; use o campo de destaque para a continuação.', multiline: true }),
            destaque: fields.text({ label: 'Frase principal: parte em destaque' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
          },
          { label: 'Seção de frase de destaque, depois do que está incluso (opcional)', description: 'Deixe a frase vazia para não mostrar.' },
        ),
        passos: fields.object(
          {
            etiqueta: fields.text({ label: 'Etiqueta', description: 'Ex.: Como funciona' }),
            titulo: fields.text({ label: 'Título · vira H2' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
            itens: fields.array(
              fields.object({ titulo: fields.text({ label: 'Título do passo · vira H3' }), texto: fields.text({ label: 'Texto', multiline: true }) }),
              { label: 'Passos', itemLabel: (p) => p.fields.titulo.value || 'Passo' },
            ),
            regras: fields.array(fields.text({ label: 'Regra' }), { label: 'Regras (faixa abaixo dos passos)', itemLabel: (p) => p.value }),
          },
          { label: 'Seção "Como funciona" em passos (opcional)', description: 'Fica antes do "O que está incluso". Deixe o título vazio para não mostrar.' },
        ),
        comparar: fields.object(
          {
            etiqueta: fields.text({ label: 'Etiqueta', description: 'Ex.: Querem massagem para os dois?' }),
            titulo: fields.text({ label: 'Título · vira H2', description: 'Ex.: Conheçam a Escapada a dois' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
            pacote: fields.relationship({ label: 'Pacote indicado', collection: 'pacotes' }),
          },
          { label: 'Caixa "Conheça outro pacote" (opcional)', description: 'Fica depois dos extras. Deixe o título vazio para não mostrar.' },
        ),
        suitesFiltro: fields.select({
          label: 'Suítes mostradas na vitrine',
          options: [
            { label: 'Todas as 18 suítes (com filtro)', value: 'todas' },
            { label: 'Só as suítes com hidromassagem', value: 'hidro' },
          ],
          defaultValue: 'todas',
        }),
        suitesTitulo: fields.text({ label: 'Vitrine de suítes: título (opcional) · vira H2', description: 'Se vazio, usa "18 suítes, cada uma com clima próprio".' }),
        suitesTexto: fields.text({ label: 'Vitrine de suítes: texto (opcional)', multiline: true }),
        legendaCafe: fields.text({ label: 'Legenda da foto do café da manhã (opcional)', description: 'Ex.: Servido nas duas manhãs' }),
        brotas: fields.object(
          {
            etiqueta: fields.text({ label: 'Etiqueta', description: 'Ex.: Brotas fica aqui do lado' }),
            titulo: fields.text({ label: 'Título · vira H2', description: 'Ex.: Para quando, e se, der vontade' }),
            texto: fields.text({ label: 'Texto antes da lista de passeios', multiline: true, description: 'A lista dos passeios próximos (Recanto das Cachoeiras, 3 Quedas etc.) aparece sozinha depois deste texto.' }),
            citacao: fields.text({ label: 'Frase de destaque (opcional)', multiline: true }),
            foto: fields.image({ label: 'Foto', directory: 'public/uploads/pacotes', publicPath: '/uploads/pacotes/' }),
            fotoAlt: fields.text({ label: 'Descrição da foto (alt)' }),
          },
          { label: 'Seção "Brotas" (opcional)', description: 'Deixe o título vazio para não mostrar a seção.' },
        ),
        extras: fields.object(
          {
            titulo: fields.text({ label: 'Título · vira H2', description: 'Ex.: Torne a noite ainda mais especial' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
            itens: fields.multiselect({
              label: 'Extras mostrados',
              options: [
                { label: 'Ambientação romântica', value: 'ambientacao' },
                { label: 'Fondue na suíte', value: 'fondue' },
                { label: 'Massagem com pedras quentes', value: 'massagem' },
              ],
              defaultValue: [],
            }),
          },
          { label: 'Seção "Para ir além" (extras)', description: 'Deixe o título vazio para não mostrar a seção.' },
        ),
        ctaEtiqueta: fields.text({ label: 'Chamada final: etiqueta', description: 'Ex.: Vagas limitadas' }),
        ctaTitulo: fields.text({ label: 'Chamada final: título · vira H2', description: 'Título (H2) do bloco final de reserva.', ...check }),
        ctaDestaque: fields.text({ label: 'Chamada final: segunda linha em destaque (opcional)', description: 'Aparece abaixo do título, em cor de destaque, e faz parte do H2.' }),
        ctaFoto: fields.image({ label: 'Chamada final: foto (opcional)', description: 'Se vazio, usa a foto principal.', directory: 'public/uploads/pacotes', publicPath: '/uploads/pacotes/' }),
        ctaTexto: fields.text({ label: 'Chamada final: texto', multiline: true }),
      },
    }),

    posts: collection({
      label: 'Guia de Brotas · posts (novos)',
      slugField: 'titulo',
      path: 'src/content/posts/*',
      format: { contentField: 'corpo' },
      columns: ['titulo', 'data', 'categoria'],
      schema: {
        titulo: fields.slug({ name: { label: 'Título do post · vira o H1', description: 'É o título principal da página (H1). Só existe um por página. Use a palavra-chave principal.', validation: { isRequired: true } } }),
        publicado: fields.checkbox({ label: 'Publicado no site', defaultValue: true }),
        redirecionar: redirecionar('posts'),
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
          label: 'Texto do post · use H2 para seções e H3 para subdivisões',
          description: 'O H1 é o título do post e não pode ser repetido aqui. O editor só oferece H2, H3 e H4. Não pule níveis: depois do H2 vem H3.',
          formatting: { headingLevels: [2, 3, 4], inlineMarks: true, listTypes: true, blockTypes: { blockquote: true }, softBreaks: true },
          dividers: true,
          links: true,
          images: { directory: 'public/uploads/blog', publicPath: '/uploads/blog/' },
        }),
      },
    }),
  },
});
