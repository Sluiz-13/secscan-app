export default function TermosPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-md p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Termos de Uso — SecScan</h1>

        <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-slate-900 mb-1">1. Objeto</h2>
            <p>
              O SecScan é uma ferramenta de verificação automatizada de configurações de
              segurança (cabeçalhos HTTP, cookies e certificados SSL/TLS) de domínios web,
              oferecida como está, sem garantias de disponibilidade, precisão completa ou
              adequação a qualquer finalidade específica.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-1">2. Responsabilidade pela autorização de uso</h2>
            <p>
              Ao cadastrar um domínio na plataforma, o usuário declara e garante que possui
              autorização legítima do responsável pelo domínio para realizar verificações de
              segurança sobre ele. O SecScan realiza apenas verificações passivas e não invasivas
              (leitura de respostas HTTP públicas), mas o usuário é o único responsável legal
              por assegurar que possui essa autorização antes de cada verificação.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-1">3. Uso proibido</h2>
            <p>
              É proibido usar a plataforma para verificar domínios sobre os quais o usuário não
              tenha autorização, para fins de reconhecimento prévio a ataques, ou qualquer outra
              finalidade que viole a legislação aplicável, incluindo a Lei 12.737/2012 e a Lei
              Geral de Proteção de Dados (Lei 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-1">4. Limitação de responsabilidade</h2>
            <p>
              O SecScan não se responsabiliza por decisões tomadas com base nos resultados
              apresentados, nem garante que a ausência de alertas signifique inexistência de
              vulnerabilidades. Os resultados são indicativos e não substituem uma auditoria de
              segurança profissional completa.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-1">5. Dados coletados</h2>
            <p>
              A plataforma armazena o e-mail e senha (com hash criptográfico) do usuário, os
              domínios cadastrados e os resultados das verificações realizadas, para o
              funcionamento do serviço.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Versão preliminar (MVP). Este texto ainda não passou por revisão jurídica e será
              atualizado antes de qualquer uso comercial da plataforma.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}