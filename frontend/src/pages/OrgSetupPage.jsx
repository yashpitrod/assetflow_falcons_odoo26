import { useState } from 'react';
import { Plus, Building2, Tag, Users, X, ChevronDown } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { getDepartments, createDepartment, updateDepartment, getCategories, createCategory, updateCategory, getEmployees, promoteEmployee } from '../api/org';
import { useToast } from '../components/Toast';
import GlassCard from '../components/GlassCard';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmployeeRole } from '../utils/constants';

// Modal for creating/editing departments
function DeptModal({ onClose, onSave, dept }) {
  const [form, setForm] = useState({ name: dept?.name || '', code: dept?.code || '', status: dept?.status || 'Active' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Department name is required';
    if (!form.code.trim()) e.code = 'Code is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (e) => { e.preventDefault(); if (validate()) onSave(form); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md" padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold">{dept ? 'Edit Department' : 'New Department'}</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block">Department Name</label>
            <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Engineering" />
            {errors.name && <p className="text-status-danger text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="eyebrow mb-1.5 block">Code</label>
            <input className="glass-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ENG" maxLength={6} />
            {errors.code && <p className="text-status-danger text-xs mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="eyebrow mb-1.5 block">Status</label>
            <select className="glass-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1">Cancel</button>
            <button type="submit" className="btn-yellow flex-1">Save</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// Modal for category
function CategoryModal({ onClose, onSave, cat }) {
  const [form, setForm] = useState({ name: cat?.name || '', warrantyPeriod: cat?.warrantyPeriod || '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Category name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (e) => { e.preventDefault(); if (validate()) onSave(form); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md" padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold">{cat ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow mb-1.5 block">Category Name</label>
            <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Laptops" />
            {errors.name && <p className="text-status-danger text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="eyebrow mb-1.5 block">Warranty Period (months)</label>
            <input type="number" className="glass-input" value={form.warrantyPeriod} onChange={e => setForm(f => ({ ...f, warrantyPeriod: e.target.value }))} placeholder="36" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1">Cancel</button>
            <button type="submit" className="btn-yellow flex-1">Save</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// Role promotion modal for Admin
function PromoteModal({ employee, onClose, onSave }) {
  const [role, setRole] = useState(employee.role);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-sm" padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold">Promote Employee</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="mb-4">
          <p className="text-text-secondary text-sm">{employee.name}</p>
          <p className="text-text-dim text-xs">{employee.email}</p>
        </div>
        <div className="space-y-2 mb-5">
          {Object.values(EmployeeRole).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all ${role === r ? 'bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow' : 'glass-surface text-text-secondary hover:text-text-primary'}`}
            >
              {r.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-glass flex-1">Cancel</button>
          <button onClick={() => onSave(role)} className="btn-yellow flex-1">Promote</button>
        </div>
      </GlassCard>
    </div>
  );
}

export default function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [modal, setModal] = useState(null); // { type, data }
  const { addToast } = useToast();

  const { data: deptsRes, loading: deptsLoading, refetch: refetchDepts } = useFetch(getDepartments, null, []);
  const { data: catsRes, loading: catsLoading, refetch: refetchCats } = useFetch(getCategories, null, []);
  const { data: empsRes, loading: empsLoading, refetch: refetchEmps } = useFetch(getEmployees, null, []);

  const depts = deptsRes?.data || [];
  const cats = catsRes?.data || [];
  const emps = empsRes?.data || [];

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'employees', label: 'Employees', icon: Users },
  ];

  const handleSaveDept = async (form) => {
    try {
      if (modal.data) await updateDepartment(modal.data.id, form);
      else await createDepartment(form);
      addToast(modal.data ? 'Department updated' : 'Department created', 'success');
      setModal(null);
      refetchDepts();
    } catch (e) { addToast(e.message, 'error'); }
  };

  const handleSaveCat = async (form) => {
    try {
      if (modal.data) await updateCategory(modal.data.id, form);
      else await createCategory(form);
      addToast(modal.data ? 'Category updated' : 'Category created', 'success');
      setModal(null);
      refetchCats();
    } catch (e) { addToast(e.message, 'error'); }
  };

  const handlePromote = async (role) => {
    try {
      await promoteEmployee(modal.data.id, { role });
      addToast(`${modal.data.name} promoted to ${role.replace(/([A-Z])/g, ' $1').trim()}`, 'success');
      setModal(null);
      refetchEmps();
    } catch (e) { addToast(e.message, 'error'); }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="text-2xl font-semibold text-text-primary">Organization Setup</h1>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-yellow text-bg-base'
                  : 'glass-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Departments tab */}
      {activeTab === 'departments' && (
        <GlassCard padding="p-0">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <h2 className="text-text-primary font-semibold text-sm">Departments ({depts.length})</h2>
            <button onClick={() => setModal({ type: 'dept', data: null })} className="btn-yellow text-sm flex items-center gap-2">
              <Plus size={15} /> New Department
            </button>
          </div>
          {deptsLoading ? <div className="p-5"><TableSkeleton rows={4} /></div> : depts.length === 0 ? (
            <EmptyState title="No departments yet" actionLabel="Create Department" onAction={() => setModal({ type: 'dept', data: null })} />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {depts.map(d => (
                <div key={d.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-text-primary text-sm font-medium">{d.name}</p>
                    <p className="text-text-dim text-xs mt-0.5">Code: {d.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={d.status} />
                    <button onClick={() => setModal({ type: 'dept', data: d })} className="text-text-dim hover:text-accent-yellow text-xs transition-colors">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Categories tab */}
      {activeTab === 'categories' && (
        <GlassCard padding="p-0">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <h2 className="text-text-primary font-semibold text-sm">Asset Categories ({cats.length})</h2>
            <button onClick={() => setModal({ type: 'cat', data: null })} className="btn-yellow text-sm flex items-center gap-2">
              <Plus size={15} /> New Category
            </button>
          </div>
          {catsLoading ? <div className="p-5"><TableSkeleton rows={4} /></div> : cats.length === 0 ? (
            <EmptyState title="No categories yet" actionLabel="Create Category" onAction={() => setModal({ type: 'cat', data: null })} />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {cats.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-text-primary text-sm font-medium">{c.name}</p>
                    <p className="text-text-dim text-xs mt-0.5">
                      {c.warrantyPeriod ? `${c.warrantyPeriod} months warranty` : 'No warranty period'}
                    </p>
                  </div>
                  <button onClick={() => setModal({ type: 'cat', data: c })} className="text-text-dim hover:text-accent-yellow text-xs transition-colors">Edit</button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Employees tab */}
      {activeTab === 'employees' && (
        <GlassCard padding="p-0">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <h2 className="text-text-primary font-semibold text-sm">Employee Directory ({emps.length})</h2>
          </div>
          {empsLoading ? <div className="p-5"><TableSkeleton rows={6} /></div> : emps.length === 0 ? (
            <EmptyState title="No employees" />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {emps.map(emp => (
                <div key={emp.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{emp.name}</p>
                      <p className="text-text-dim text-xs">{emp.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary text-xs">{emp.role.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <StatusPill status={emp.status} />
                    <button
                      onClick={() => setModal({ type: 'promote', data: emp })}
                      className="text-text-dim hover:text-accent-yellow text-xs transition-colors"
                    >
                      Promote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Modals */}
      {modal?.type === 'dept' && <DeptModal dept={modal.data} onClose={() => setModal(null)} onSave={handleSaveDept} />}
      {modal?.type === 'cat' && <CategoryModal cat={modal.data} onClose={() => setModal(null)} onSave={handleSaveCat} />}
      {modal?.type === 'promote' && <PromoteModal employee={modal.data} onClose={() => setModal(null)} onSave={handlePromote} />}
    </div>
  );
}
