import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Termos de Serviço — ClinicaBot",
};

export default function TermosPage() {
  return (
    <>
      <NavBar />
      <main className="bg-white py-16">
        <article className="mx-auto max-w-4xl px-6">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Termos de Serviço</h1>
          <p className="mb-10 text-sm text-gray-400">Última atualização: abril de 2026</p>

          <div className="space-y-10 text-gray-700 leading-relaxed">

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Identificação do Prestador</h2>
              <p>
                O serviço ClinicaBot é prestado pela <strong>SIAQ Digital</strong>, empresa sediada em
                Viana do Castelo, Portugal (doravante "ClinicaBot", "nós" ou "nosso"). Para efeitos de
                contacto: <a href="mailto:suporte@clinicabot.pt" className="text-[#1D9E75] hover:underline">suporte@clinicabot.pt</a>.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Objeto e Âmbito</h2>
              <p className="mb-3">
                O ClinicaBot é uma plataforma SaaS (Software as a Service) que disponibiliza um assistente
                virtual com inteligência artificial para marcação de consultas, gestão de agendamentos e
                comunicação automática com pacientes, destinada a clínicas e prestadores de saúde em Portugal.
              </p>
              <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
                ⚠️ O ClinicaBot <strong>não presta serviços médicos</strong>. A plataforma é exclusivamente
                uma ferramenta de gestão administrativa. Qualquer informação trocada no chat não constitui
                conselho médico.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Planos e Preços</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Plano</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Preço</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Marcações</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Utilizadores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 font-medium">Pilot</td>
                      <td className="px-4 py-3">Gratuito (30 dias)</td>
                      <td className="px-4 py-3">Até 50/mês</td>
                      <td className="px-4 py-3">1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Starter</td>
                      <td className="px-4 py-3">€149/mês</td>
                      <td className="px-4 py-3">Até 200/mês</td>
                      <td className="px-4 py-3">3</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Clinic</td>
                      <td className="px-4 py-3">€299/mês</td>
                      <td className="px-4 py-3">Ilimitadas</td>
                      <td className="px-4 py-3">Ilimitados</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Enterprise</td>
                      <td className="px-4 py-3">Sob consulta</td>
                      <td className="px-4 py-3">Ilimitadas</td>
                      <td className="px-4 py-3">Ilimitados</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Os preços são em euros e não incluem IVA (23%). O ClinicaBot reserva-se o direito de
                alterar os preços com um pré-aviso de 30 dias.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Período Experimental (Pilot)</h2>
              <p>
                O plano Pilot é gratuito durante 30 dias, sem necessidade de cartão de crédito. Findo o
                período experimental, o serviço é suspenso automaticamente, salvo se o Cliente optar por
                um plano pago. Os dados são mantidos por 30 dias adicionais antes de serem eliminados.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Obrigações do Cliente</h2>
              <ul className="ml-5 list-disc space-y-2">
                <li>Manter as credenciais de acesso em segurança e não as partilhar com terceiros não autorizados.</li>
                <li>Utilizar a plataforma em conformidade com a legislação portuguesa e europeia aplicável, incluindo o RGPD.</li>
                <li>Garantir que os pacientes são informados sobre a utilização de um assistente virtual para marcações.</li>
                <li>Não utilizar o serviço para fins ilícitos, fraudulentos ou que violem direitos de terceiros.</li>
                <li>Manter os dados da clínica (horários, médicos, especialidades) atualizados e corretos.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Obrigações do ClinicaBot</h2>
              <ul className="ml-5 list-disc space-y-2">
                <li>Disponibilizar a plataforma com um nível de serviço (SLA) de 99,5% de uptime mensal.</li>
                <li>Notificar o Cliente com pelo menos 24 horas de antecedência em caso de manutenção programada.</li>
                <li>Tratar os dados pessoais dos pacientes em conformidade com o RGPD e o DPA acordado.</li>
                <li>Manter cópias de segurança diárias dos dados com retenção de 7 dias.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Limitação de Responsabilidade</h2>
              <p className="mb-3">
                A responsabilidade total do ClinicaBot perante o Cliente, seja por incumprimento contratual,
                negligência ou outra causa, fica limitada ao valor dos pagamentos efetuados pelo Cliente nos
                <strong> 12 meses anteriores</strong> ao facto gerador de responsabilidade.
              </p>
              <p>
                O ClinicaBot não é responsável por danos indiretos, lucros cessantes, perda de dados
                (além do previsto na política de cópias de segurança) ou danos decorrentes de força maior,
                incluindo falhas de infraestrutura de terceiros (Supabase, Vercel, Groq, Resend).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Propriedade Intelectual</h2>
              <p>
                O ClinicaBot e todos os seus componentes (software, design, marca, documentação) são
                propriedade exclusiva da SIAQ Digital. O Cliente recebe uma licença não exclusiva,
                intransmissível e revogável para utilizar a plataforma durante a vigência do contrato.
                Os dados inseridos pelo Cliente permanecem propriedade do Cliente.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">9. Rescisão</h2>
              <p className="mb-3">
                O Cliente pode rescindir o contrato a qualquer momento através do painel de gestão ou
                por email. A rescisão produz efeitos no final do período de faturação em curso. Não há
                reembolso de períodos já pagos.
              </p>
              <p>
                O ClinicaBot pode rescindir o contrato imediatamente em caso de violação grave dos
                presentes Termos, incumprimento de pagamento superior a 15 dias, ou utilização ilícita
                da plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">10. Alterações aos Termos</h2>
              <p>
                O ClinicaBot pode alterar estes Termos a qualquer momento, notificando o Cliente por
                email com 30 dias de antecedência. A continuação do uso da plataforma após esse prazo
                constitui aceitação das alterações.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">11. Lei Aplicável e Foro</h2>
              <p>
                Os presentes Termos são regidos pela lei portuguesa. Em caso de litígio, as partes
                elegem o <strong>foro de Viana do Castelo</strong> como competente, com expressa
                renúncia a qualquer outro, sem prejuízo do recurso a meios alternativos de resolução
                de conflitos.
              </p>
            </section>

          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
