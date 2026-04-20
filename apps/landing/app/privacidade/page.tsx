import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Política de Privacidade — ClinicaBot",
};

export default function PrivacidadePage() {
  return (
    <>
      <NavBar />
      <main className="bg-white py-16">
        <article className="mx-auto max-w-4xl px-6">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Política de Privacidade</h1>
          <p className="mb-10 text-sm text-gray-400">Última atualização: abril de 2026</p>

          <div className="space-y-10 text-gray-700 leading-relaxed">

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Responsável pelo Tratamento</h2>
              <p>
                O responsável pelo tratamento dos dados pessoais é a <strong>SIAQ Digital</strong>,
                sediada em Viana do Castelo, Portugal. Contacto do encarregado de proteção de dados:
                <a href="mailto:privacidade@clinicabot.pt" className="text-[#1D9E75] hover:underline ml-1">privacidade@clinicabot.pt</a>.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Dados Recolhidos</h2>
              <p className="mb-4">A plataforma recolhe os seguintes dados pessoais dos pacientes das clínicas clientes:</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Dado</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Finalidade</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Base Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3">Nome completo</td>
                      <td className="px-4 py-3">Identificação na marcação</td>
                      <td className="px-4 py-3">Execução do contrato</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Endereço de email</td>
                      <td className="px-4 py-3">Confirmações e lembretes</td>
                      <td className="px-4 py-3">Execução do contrato</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Número de telefone</td>
                      <td className="px-4 py-3">Contacto da clínica</td>
                      <td className="px-4 py-3">Interesse legítimo</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Especialidade médica</td>
                      <td className="px-4 py-3">Encaminhamento para médico</td>
                      <td className="px-4 py-3">Execução do contrato</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Seguro de saúde</td>
                      <td className="px-4 py-3">Registo na marcação</td>
                      <td className="px-4 py-3">Consentimento</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Histórico de conversas</td>
                      <td className="px-4 py-3">Melhoria do serviço, suporte</td>
                      <td className="px-4 py-3">Interesse legítimo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Prazos de Retenção</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Tipo de dado</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Prazo de retenção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3">Dados de marcações</td>
                      <td className="px-4 py-3">12 meses após a consulta</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Conversas do chatbot</td>
                      <td className="px-4 py-3">12 meses após a conversa</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Logs de sistema</td>
                      <td className="px-4 py-3">90 dias</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Dados de faturação</td>
                      <td className="px-4 py-3">10 anos (obrigação legal)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Dados após rescisão</td>
                      <td className="px-4 py-3">30 dias, depois eliminados</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Subcontratantes (Subprocessadores)</h2>
              <p className="mb-4">
                O ClinicaBot recorre aos seguintes subcontratantes para a prestação do serviço,
                com os quais foram celebrados os contratos exigidos pelo RGPD:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Subcontratante</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Função</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Localização</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Garantia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 font-medium">Supabase</td>
                      <td className="px-4 py-3">Base de dados (PostgreSQL)</td>
                      <td className="px-4 py-3">UE (Frankfurt)</td>
                      <td className="px-4 py-3">RGPD nativo</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Vercel</td>
                      <td className="px-4 py-3">Hosting da aplicação</td>
                      <td className="px-4 py-3">EUA / UE</td>
                      <td className="px-4 py-3">SCCs</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Groq</td>
                      <td className="px-4 py-3">Processamento de IA (LLM)</td>
                      <td className="px-4 py-3">EUA</td>
                      <td className="px-4 py-3">SCCs + DPA</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Resend</td>
                      <td className="px-4 py-3">Envio de emails</td>
                      <td className="px-4 py-3">EUA</td>
                      <td className="px-4 py-3">SCCs + DPA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-gray-500">SCCs = Cláusulas Contratuais Padrão da Comissão Europeia.</p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Cookies e Rastreamento</h2>
              <p>
                O ClinicaBot <strong>não utiliza cookies de rastreamento ou publicidade</strong>.
                São utilizados apenas cookies estritamente necessários para o funcionamento da sessão
                autenticada no painel de gestão. Não são partilhados dados com plataformas de publicidade.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Direitos dos Titulares</h2>
              <p className="mb-3">
                Nos termos do RGPD (Regulamento (UE) 2016/679), os titulares dos dados têm os seguintes direitos:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm">
                <li><strong>Acesso</strong> — obter confirmação sobre se os seus dados são tratados e aceder a uma cópia.</li>
                <li><strong>Retificação</strong> — corrigir dados inexatos ou incompletos.</li>
                <li><strong>Apagamento</strong> ("direito a ser esquecido") — solicitar a eliminação dos dados.</li>
                <li><strong>Limitação</strong> — restringir o tratamento em determinadas circunstâncias.</li>
                <li><strong>Portabilidade</strong> — receber os dados em formato estruturado e legível por máquina.</li>
                <li><strong>Oposição</strong> — opor-se ao tratamento com base no interesse legítimo.</li>
              </ul>
              <p className="mt-4">
                Para exercer estes direitos, contactar:{" "}
                <a href="mailto:privacidade@clinicabot.pt" className="text-[#1D9E75] hover:underline">
                  privacidade@clinicabot.pt
                </a>. Responderemos no prazo de 30 dias.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Reclamações</h2>
              <p>
                Se considerar que o tratamento dos seus dados viola o RGPD, tem o direito de apresentar
                reclamação à autoridade de controlo competente em Portugal:{" "}
                <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong>,{" "}
                <a
                  href="https://www.cnpd.pt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1D9E75] hover:underline"
                >
                  www.cnpd.pt
                </a>.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Alterações a Esta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Quando o fizermos,
                notificaremos os Clientes por email e atualizaremos a data no topo desta página.
                Recomendamos a consulta regular desta página.
              </p>
            </section>

          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
