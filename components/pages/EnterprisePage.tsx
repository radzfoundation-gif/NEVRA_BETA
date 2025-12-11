import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import Background from '../ui/Background';
import { Shield, Building, Lock, Server } from 'lucide-react';

const EnterprisePage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-aura-primary bg-[#020202] page-transition">
      <Background />
      <Navbar />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
              <Building className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-200">Enterprise Grade</span>
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tight">
              Security at <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Hyper Scale</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              SOC2 Type II certified. GDPR compliant. Dedicated infrastructure for mission-critical workloads.
            </p>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/10">
                <Shield className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Advanced RBAC</h3>
                <p className="text-gray-400">Granular role-based access control for teams of thousands.</p>
             </div>
             <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/10">
                <Lock className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">SSO & Audit Logs</h3>
                <p className="text-gray-400">SAML integration and comprehensive audit trails for compliance.</p>
             </div>
             <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/10">
                <Server className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Private VPC</h3>
                <p className="text-gray-400">Deploy agents inside your own VPC or on-premise infrastructure.</p>
             </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EnterprisePage;
