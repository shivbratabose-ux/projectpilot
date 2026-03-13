import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Badge, StatusBadge, Spinner, PageHeader, EmptyState } from '../components/ui';

const typeColors = { reseller: 'teal', technology: 'navy', services: 'blue', jv_candidate: 'amber', client: 'green', supplier: 'gray' };

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'reseller', country: '', primary_contact_name: '', primary_contact_email: '', categories: '' });

  const load = () => {
    const params = new URLSearchParams(search ? { search } : {});
    api.get(`/api/partners?${params}`).then(r => { setPartners(r.data.partners); setLoading(false); });
  };
  useEffect(load, [search]);

  const create = async () => {
    const payload = { ...form, categories: form.categories ? form.categories.split(',').map(s => s.trim()) : [] };
    await api.post('/api/partners', payload);
    setShowNew(false);
    setForm({ name: '', type: 'reseller', country: '', primary_contact_name: '', primary_contact_email: '', categories: '' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Partners"
        subtitle="Resellers, clients, and strategic relationships"
        actions={<button onClick={() => setShowNew(true)} className="btn-primary">+ Add Partner</button>}
      />

      <div className="mb-5">
        <input className="input max-w-sm" placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>
      ) : partners.length === 0 ? (
        <EmptyState icon="🤝" title="No partners found" description="Add your first partner to begin tracking relationships." action={<button onClick={() => setShowNew(true)} className="btn-primary">Add Partner</button>} />
      ) : (
        <div className="grid gap-4">
          {partners.map(p => (
            <Link key={p.id} to={`/partners/${p.id}`} className="card p-5 hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-navy">{p.name}</h3>
                    <Badge variant={typeColors[p.type] || 'gray'}>{p.type}</Badge>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    {p.country && <span>🌍 {p.country}</span>}
                    {p.primary_contact_name && <span>👤 {p.primary_contact_name}</span>}
                    {p.primary_contact_email && <span>✉ {p.primary_contact_email}</span>}
                  </div>
                  {p.categories && p.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.categories.map(c => <Badge key={c} variant="gray">{c}</Badge>)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-navy">Add New Partner</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div><label className="label">Partner Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Company name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type *</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {['reseller', 'technology', 'services', 'jv_candidate', 'client', 'supplier'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Country</label><input className="input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. South Africa" /></div>
              </div>
              <div><label className="label">Primary Contact Name</label><input className="input" value={form.primary_contact_name} onChange={e => setForm(f => ({ ...f, primary_contact_name: e.target.value }))} /></div>
              <div><label className="label">Primary Contact Email</label><input className="input" type="email" value={form.primary_contact_email} onChange={e => setForm(f => ({ ...f, primary_contact_email: e.target.value }))} /></div>
              <div><label className="label">Categories (comma-separated)</label><input className="input" value={form.categories} onChange={e => setForm(f => ({ ...f, categories: e.target.value }))} placeholder="Aviation Ground Handling, Cargo..." /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={create} disabled={!form.name} className="btn-primary flex-1 disabled:opacity-50">Add Partner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
