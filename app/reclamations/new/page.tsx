import { ReclamationForm } from '@/components/ReclamationForm';

export default function NewReclamationPage() {
  return (
    <div>
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#0F172A' }}>
          Nouvelle réclamation
        </h1>
        <p className="text-sm font-medium" style={{ color: '#64748B' }}>
          Remplissez les informations ci-dessous pour signaler un problème.
        </p>
      </div>
      <ReclamationForm />
    </div>
  );
}
