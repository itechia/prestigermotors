// Conteúdo padrão das páginas legais. Se o admin criar uma "Página do site"
// com o slug "privacidade" ou "termos", o texto dele substitui este padrão.

function contactBlock(settings) {
  const lines = [];
  if (settings?.address) lines.push(`- **Endereço:** ${settings.address}`);
  if (settings?.phone_number) lines.push(`- **Telefone:** ${settings.phone_number}`);
  if (settings?.whatsapp_number) lines.push(`- **WhatsApp:** ${settings.whatsapp_number}`);
  if (lines.length === 0) {
    lines.push("- Fale com a nossa equipe pelos canais divulgados no rodapé do site.");
  }
  return lines.join("\n");
}

export function privacyMarkdown(settings) {
  const name = settings?.store_name || "a loja";

  return `Esta Política de Privacidade explica como **${name}** coleta, utiliza, armazena e protege os dados pessoais de quem visita este site, em conformidade com a Lei nº 13.709/2018 (LGPD).

## 1. Quem é o controlador dos dados

O controlador dos dados é **${name}**, responsável pelas decisões sobre o tratamento das informações coletadas neste site. Nossos canais de contato:

${contactBlock(settings)}

## 2. Quais dados coletamos

- **Dados que você informa:** nome, telefone/WhatsApp, e-mail, cidade e as informações e fotos do veículo que você envia nos formulários de interesse ou de venda.
- **Dados de navegação:** páginas visitadas, tempo de permanência, origem do acesso, tipo de dispositivo e navegador, coletados por cookies e ferramentas de análise, apenas quando você autoriza no aviso de cookies.
- **Dados técnicos:** endereço IP e registros de acesso, mantidos por questões de segurança.

## 3. Para que usamos os dados

- Responder às suas solicitações de interesse em um veículo e enviar propostas.
- Avaliar o veículo que você deseja vender e retornar com uma oferta.
- Melhorar o catálogo, a navegação e as ofertas exibidas no site.
- Cumprir obrigações legais, regulatórias e fiscais.

Não vendemos os seus dados pessoais. As informações podem ser compartilhadas apenas com prestadores de serviço essenciais à operação (hospedagem, banco de dados, mensageria e ferramentas de atendimento), sempre limitados à finalidade descrita aqui.

## 4. Cookies

Utilizamos cookies necessários (que mantêm o site funcionando, como suas preferências de tema e consentimento) e, mediante autorização, cookies de análise, que nos ajudam a entender como o site é usado. Você pode aceitar ou recusar os cookies opcionais no aviso exibido na primeira visita e alterar a escolha a qualquer momento limpando os dados do site no seu navegador.

## 5. Por quanto tempo guardamos

Mantemos os dados pelo tempo necessário para atender a sua solicitação e cumprir obrigações legais. Depois disso, eles são eliminados ou anonimizados.

## 6. Seus direitos

A LGPD garante a você o direito de confirmar a existência de tratamento, acessar, corrigir, anonimizar, portar ou eliminar seus dados, além de revogar o consentimento. Para exercer qualquer um desses direitos, entre em contato pelos canais indicados no item 1. Respondemos no menor prazo possível.

## 7. Segurança

Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, perda ou destruição, incluindo conexão criptografada (HTTPS) e controle de acesso às informações internas.

## 8. Alterações desta política

Esta política pode ser atualizada para refletir mudanças nos nossos serviços ou na legislação. A data da última atualização é sempre exibida no topo desta página.`;
}

export function termsMarkdown(settings) {
  const name = settings?.store_name || "a loja";

  return `Estes Termos de Uso regulam o acesso e a utilização do site de **${name}**. Ao navegar por este site, você concorda com as condições abaixo.

## 1. Objeto do site

Este site é um catálogo digital de veículos e um canal de contato com a nossa equipe. Ele não realiza vendas online: as negociações são conduzidas presencialmente ou pelos canais de atendimento informados, com contrato próprio.

## 2. Informações dos anúncios

Trabalhamos para manter preços, fotos, quilometragem, ano e opcionais sempre atualizados. Ainda assim, podem ocorrer erros de digitação ou defasagem de informação, e um veículo pode ser vendido antes da atualização do site.

- Os valores anunciados **não constituem proposta vinculante** e podem mudar sem aviso prévio.
- Condições de pagamento, financiamento e troca dependem de análise e aprovação.
- Confirme sempre a disponibilidade e as condições do veículo com a nossa equipe antes de se deslocar.

## 3. Uso adequado

Ao utilizar este site, você se compromete a fornecer informações verdadeiras nos formulários e a não:

- tentar acessar áreas restritas, contas ou sistemas de terceiros;
- copiar, extrair ou reproduzir o conteúdo do catálogo para fins comerciais sem autorização;
- utilizar robôs, raspadores ou qualquer meio automatizado que prejudique o funcionamento do site.

## 4. Formulários e contato

Ao enviar um formulário de interesse ou de venda de veículo, você autoriza a nossa equipe a entrar em contato pelos dados informados, inclusive por WhatsApp, telefone e e-mail. O tratamento desses dados segue a nossa [Política de Privacidade](/privacidade).

## 5. Propriedade intelectual

A marca, o layout, os textos e as fotografias exibidas neste site pertencem a **${name}** ou a seus licenciantes, e não podem ser reproduzidos sem autorização prévia por escrito.

## 6. Links externos

O site pode conter links para páginas de terceiros (redes sociais, financeiras, parceiros). Não temos controle sobre esses conteúdos e não respondemos por eles.

## 7. Limitação de responsabilidade

Empenhamo-nos para manter o site disponível e correto, mas ele é oferecido "no estado em que se encontra". Não respondemos por indisponibilidades temporárias, falhas de conexão do usuário ou decisões tomadas exclusivamente com base nas informações do catálogo, sem confirmação com a nossa equipe.

## 8. Foro e legislação

Estes Termos são regidos pela legislação brasileira, incluindo o Código de Defesa do Consumidor e o Marco Civil da Internet. Fica eleito o foro do domicílio do consumidor para dirimir eventuais controvérsias.

## 9. Contato

${contactBlock(settings)}`;
}
