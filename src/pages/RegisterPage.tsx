import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Field, TextInput, Select } from '../components/ui/Field';
import { Flash } from '../components/ui/Misc';
import type { Role } from '../types';

const SELF_REGISTER_ROLES: Role[] = ['dealer', 'customer', 'salesrep'];
const ROLE_HOME: Partial<Record<Role, string>> = { dealer: '/dealer-sale', salesrep: '/sales-team', customer: '/verify' };

interface FormState {
  username: string;
  password: string;
  businessName: string;
  owner: string;
  fullName: string;
  mobile: string;
  address: string;
}

function isSelfRegisterRole(value: string | null): value is Role {
  return SELF_REGISTER_ROLES.includes(value as Role);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole: Role = isSelfRegisterRole(roleParam) ? roleParam : 'dealer';
  const [role, setRole] = useState<Role>(initialRole);
  const [form, setForm] = useState<FormState>({
    username: '', password: '', businessName: '', owner: '', fullName: '', mobile: '', address: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ role, ...form });
      navigate(ROLE_HOME[role] || '/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] bg-panel border border-line rounded-[10px] p-8">
        <h1 className="text-xl mb-1">Create an account</h1>
        <p className="text-ink-soft text-[13px] mb-6">Dealers, sales reps, and customers can self-register here. Admin and Warehouse accounts are provisioned by the admin.</p>

        <Flash kind="err">{error}</Flash>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Account type">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="dealer">Dealer</option>
              <option value="salesrep">Sales Rep</option>
              <option value="customer">Customer</option>
            </Select>
          </Field>

          {role === 'dealer' ? (
            <>
              <Field label="Business name">
                <TextInput value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
              </Field>
              <Field label="Owner name">
                <TextInput value={form.owner} onChange={(e) => set('owner', e.target.value)} required />
              </Field>
              <Field label="Business address">
                <TextInput value={form.address} onChange={(e) => set('address', e.target.value)} required />
              </Field>
            </>
          ) : (
            <Field label="Full name">
              <TextInput value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
            </Field>
          )}

          {role === 'salesrep' && (
            <p className="text-[12px] text-ink-soft -mt-2">
              Your account is created with no dealers assigned and a 0-unit target — your team lead / admin will assign your dealers and set your monthly target.
            </p>
          )}

          <Field label="Mobile number">
            <TextInput value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
          </Field>
          <Field label="Choose a username">
            <TextInput value={form.username} onChange={(e) => set('username', e.target.value)} required />
          </Field>
          <Field label="Choose a password">
            <TextInput type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
          </Field>

          <Button type="submit" disabled={busy} className="w-full mt-2">
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-[13px] text-ink-soft mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
