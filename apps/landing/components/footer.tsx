export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo + copyright */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D9E75] text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">ClinicaBot</span>
            </div>
            <p className="text-xs text-gray-400">
              © 2026 ClinicaBot. Todos os direitos reservados.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6">
            <a href="/termos" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
              Termos de serviço
            </a>
            <a href="/privacidade" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
              Política de privacidade
            </a>
            <a href="/dpa" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
              DPA
            </a>
            <a href="#contact" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
