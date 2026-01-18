import React from 'react';
import Footer from '../Footer';
import Background from '../ui/Background';
import { Shield, Building, Lock, Server } from 'lucide-react';

const EnterprisePage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-zinc-900 bg-white page-transition">
      <Background />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-green-50 border border-green-200 mb-6 md:mb-8">
              <Building className="w-4 h-4 text-green-600" />
              <span className="text-xs sm:text-sm font-medium text-green-600">Enterprise Grade</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-4 md:mb-6 text-zinc-900 tracking-tight px-2">
              Security at <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Hyper Scale</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-4">
              SOC2 Type II certified. GDPR compliant. Dedicated infrastructure for mission-critical workloads.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 md:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2">Advanced RBAC</h3>
              <p className="text-sm sm:text-base text-zinc-500">Granular role-based access control for teams of thousands.</p>
            </div>
            <div className="p-5 sm:p-6 md:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2">SSO & Audit Logs</h3>
              <p className="text-sm sm:text-base text-zinc-500">SAML integration and comprehensive audit trails for compliance.</p>
            </div>
            <div className="p-5 sm:p-6 md:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <Server className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2">Private VPC</h3>
              <p className="text-sm sm:text-base text-zinc-500">Deploy agents inside your own VPC or on-premise infrastructure.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EnterprisePage;
