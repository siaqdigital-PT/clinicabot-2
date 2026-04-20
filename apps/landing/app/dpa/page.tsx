import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Acordo de Processamento de Dados — ClinicaBot",
};

export default function DpaPage() {
  return (
    <>
      <NavBar />
      <main className="bg-white py-16">
        <article className="mx-auto max-w-4xl px-6">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Acordo de Processamento de Dados</h1>
          <p className="mb-2 text-sm text-gray-400">Data Processing Agreement (DPA)</p>
          <p className="mb-10 text-sm text-gray-400">Última atualização: abril de 2026</p>

          <div className="space-y-10 text-gray-700 leading-relaxed">

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Partes e Definições</h2>
              <p className="mb-3">
                O presente Acordo de Processamento de Dados ("DPA") é celebrado entre:
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong>Responsável pelo Tratamento ("Controller")</strong>: a clínica ou prestador
                  de saúde que subscreveu o serviço ClinicaBot ("Cliente").
                </li>
                <li>
                  <strong>Subcontratante ("Processor")</strong>: SIAQ Digital, prestadora do serviço
                  ClinicaBot.
                </li>
              </ul>
              <p className="mt-3">
                Este DPA faz parte integrante dos Termos de Serviço e prevalece sobre eles em
                matéria de proteção de dados. Os termos não definidos aqui têm o significado
                atribuído no RGPD (Regulamento (UE) 2016/679).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Objeto do Tratamento</h2>
              <p className="mb-3">
                O ClinicaBot trata dados pessoais em nome do Cliente para os seguintes fins:
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Receção e gestão de pedidos de marcação de consultas via chatbot.</li>
                <li>Envio de confirmações e lembretes de consulta por email.</li>
                <li>Armazenamento do histórico de conversas para suporte e melhoria do serviço.</li>
                <li>Geração de relatórios e estatísticas de utilização para o Cliente.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Obrigações do Subcontratante</h2>
              <p className="mb-3">O ClinicaBot compromete-se a:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Tratar os dados pessoais apenas segundo as instruções documentadas do Controller.</li>
                <li>Garantir que as pessoas autorizadas a tratar os dados assumiram obrigações de confidencialidade.</li>
                <li>Implementar medidas técnicas e organizativas adequadas (artigo 32.º do RGPD).</li>
                <li>Respeitar as condições para recorrer a subcontratantes ulteriores (cláusula 5).</li>
                <li>Assistir o Controller no cumprimento dos direitos dos titulares dos dados.</li>
                <li>Apoiar o Controller na realização de avaliações de impacto (DPIA) quando necessário.</li>
                <li>Eliminar ou devolver todos os dados pessoais após o fim da prestação de serviços.</li>
                <li>Disponibilizar ao Controller toda a informação necessária para demonstrar o cumprimento.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Notificação de Violação de Dados</h2>
              <p>
                Em caso de violação de dados pessoais (data breach), o ClinicaBot notificará o Cliente
                no prazo máximo de <strong>48 horas</strong> após tomar conhecimento da violação,
                incluindo, na medida do possível: a natureza da violação, as categorias e número
                aproximado de titulares afetados, os dados de contacto do responsável pelo tratamento,
                as consequências prováveis e as medidas tomadas ou propostas.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Subcontratantes Ulteriores</h2>
              <p className="mb-4">
                O ClinicaBot recorre aos seguintes subcontratantes ulteriores aprovados. O Cliente
                autoriza genericamente o recurso a estes subcontratantes, sendo notificado de quaisquer
                alterações com 30 dias de antecedência:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Subcontratante</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Serviço</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">País</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Mecanismo de transferência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 font-medium">Supabase, Inc.</td>
                      <td className="px-4 py-3">Base de dados PostgreSQL</td>
                      <td className="px-4 py-3">UE (Frankfurt)</td>
                      <td className="px-4 py-3">RGPD — sem transferência</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Vercel, Inc.</td>
                      <td className="px-4 py-3">Hosting / Edge Network</td>
                      <td className="px-4 py-3">EUA</td>
                      <td className="px-4 py-3">SCCs (Decisão 2021/914)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Groq, Inc.</td>
                      <td className="px-4 py-3">Inferência de IA (LLM)</td>
                      <td className="px-4 py-3">EUA</td>
                      <td className="px-4 py-3">SCCs + DPA</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Resend, Inc.</td>
                      <td className="px-4 py-3">Envio de emails transacionais</td>
                      <td className="px-4 py-3">EUA</td>
                      <td className="px-4 py-3">SCCs + DPA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Medidas de Segurança</h2>
              <p className="mb-3">O ClinicaBot implementa, entre outras, as seguintes medidas técnicas e organizativas:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Encriptação de dados em trânsito (TLS 1.2+) e em repouso (AES-256).</li>
                <li>Controlo de acesso baseado em funções (RBAC) com autenticação multifator disponível.</li>
                <li>Cópias de segurança diárias com retenção de 7 dias.</li>
                <li>Monitorização de acessos e logs de auditoria com retenção de 90 dias.</li>
                <li>Testes de penetração anuais realizados por entidade independente.</li>
                <li>Política de gestão de vulnerabilidades com patching crítico em 72 horas.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Direito de Auditoria</h2>
              <p>
                O Cliente tem o direito de realizar auditorias ao cumprimento do presente DPA,
                incluindo inspeções, com um pré-aviso mínimo de <strong>15 dias úteis</strong>.
                As auditorias realizam-se durante o horário normal de funcionamento, sem perturbação
                das operações, e à custa do Cliente, salvo se a auditoria revelar uma violação
                material, caso em que os custos são suportados pelo ClinicaBot.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Eliminação de Dados após Rescisão</h2>
              <p>
                Após a rescisão ou expiração do contrato, o ClinicaBot procederá à eliminação segura
                de todos os dados pessoais tratados em nome do Cliente no prazo de{" "}
                <strong>30 dias</strong>, salvo obrigação legal de conservação. O Cliente pode
                solicitar, antes da eliminação, uma exportação dos seus dados em formato CSV ou JSON.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">9. Contacto</h2>
              <p>
                Para questões relacionadas com este DPA ou com o tratamento de dados pessoais:{" "}
                <a href="mailto:privacidade@clinicabot.pt" className="text-[#1D9E75] hover:underline">
                  privacidade@clinicabot.pt
                </a>
              </p>
            </section>

          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
