'use client';

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  Banknote,
  Check,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Megaphone,
  UserCog,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Google Form integration
//
// Form ID: from your published form URL
//   https://docs.google.com/forms/d/e/{FORM_ID}/formResponse
// Entry IDs: use "Get pre-filled link" in the form editor (fill dummy answers,
// click Get Link) and copy each entry.XXXXXXX from the generated URL.
// ---------------------------------------------------------------------------

const FORM_ID = '1FAIpQLSehg4LOils0EkLsrd8NDMndjHSJHHpWY8yZd8VryqG-sZy1cQ';

const ENTRY_FULL_NAME = 'entry.1063296541';
const ENTRY_SCHOOL_NAME = 'entry.1923274251';
const ENTRY_ROLE = 'entry.1116074731';
const ENTRY_PHONE = 'entry.326250526';
const ENTRY_EMAIL = 'entry.684347342';
const ENTRY_STUDENTS = 'entry.1823859791';
const ENTRY_GOAL = 'entry.1876744323';

const ROLE_OPTIONS = ['Proprietor', 'Principal', 'Teacher', 'Other'];
const STUDENT_RANGE_OPTIONS = ['Under 100', '100-300', '300-600', '600+'];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: GraduationCap, title: 'Student records & promotion', desc: 'Admissions, classes and end-of-term promotion without retyping a single list.' },
  { icon: UserCog, title: 'Staff accounts & roles', desc: 'Principals, teachers and bursars each get a login with the right permissions.' },
  { icon: Banknote, title: 'Fee collection in Naira', desc: 'Invoices, payments and outstanding balances — see who has paid at a glance.' },
  { icon: ClipboardCheck, title: 'Grades & report cards', desc: 'Continuous assessment scores and termly report cards, ready to print or share.' },
  { icon: Megaphone, title: 'Announcements', desc: 'Post an update once and reach staff and parents — no separate WhatsApp groups.' },
  { icon: UsersRound, title: 'Parent portal', desc: 'Parents check results, fees and attendance from any phone, anytime.' },
];

const PERKS = [
  'Early access before public launch',
  'Guided setup for your staff and records',
  'A direct line to the team building Clariva',
];

type FieldKey = 'fullName' | 'schoolName' | 'role' | 'phone' | 'email' | 'students' | 'goal';

const FIELD_ORDER: FieldKey[] = ['fullName', 'schoolName', 'role', 'phone', 'email', 'students', 'goal'];

type Values = Record<FieldKey, string>;
type Errors = Partial<Record<FieldKey, string>>;

const EMPTY_VALUES: Values = {
  fullName: '',
  schoolName: '',
  role: '',
  phone: '',
  email: '',
  students: '',
  goal: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Values): Errors {
  const errs: Errors = {};
  if (!v.fullName.trim()) errs.fullName = 'Enter your full name.';
  if (!v.schoolName.trim()) errs.schoolName = 'Enter your school name.';
  if (!v.role) errs.role = 'Select your role.';
  if (!v.phone.trim()) errs.phone = 'Enter your phone number.';
  if (!v.email.trim()) errs.email = 'Enter your email address.';
  else if (!EMAIL_REGEX.test(v.email.trim())) errs.email = 'Enter a valid email address.';
  if (!v.students) errs.students = 'Select a student range.';
  return errs;
}

function inputClass(error?: string) {
  return `w-full h-12 px-3.5 rounded-xl border bg-white text-sm text-[#0D2B55] outline-none placeholder:text-[#94A3B8] ${
    error ? 'border-[#B91C1C]' : 'border-[#DDE5F0] focus:border-[#0E7490]'
  }`;
}

function Field({ id, label, required, error, className = '', children }: {
  id: string; label: string; required?: boolean; error?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[11px] font-bold text-[#64748B] uppercase mb-1.5">
        {label}{required && ' *'}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-[11px] text-[#B91C1C]">{error}</p>}
    </div>
  );
}

function SelectField({ id, label, value, error, options, onChange, className = '' }: {
  id: string; label: string; value: string; error?: string; options: string[];
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void; className?: string;
}) {
  return (
    <Field id={id} label={label} required error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          className={`${inputClass(error)} appearance-none pr-10 cursor-pointer ${value ? '' : 'text-[#94A3B8]'}`}
        >
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" aria-hidden="true" />
      </div>
    </Field>
  );
}

export default function WaitlistPage() {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState<{ firstName: string; school: string; email: string } | null>(null);

  const update = (key: FieldKey) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { value } = e.target;
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errs = validate(values);
    setErrors(errs);
    setSubmitError('');
    const firstInvalid = FIELD_ORDER.find(f => errs[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const body = new URLSearchParams({
        [ENTRY_FULL_NAME]: values.fullName.trim(),
        [ENTRY_SCHOOL_NAME]: values.schoolName.trim(),
        [ENTRY_ROLE]: values.role,
        [ENTRY_PHONE]: values.phone.trim(),
        [ENTRY_EMAIL]: values.email.trim(),
        [ENTRY_STUDENTS]: values.students,
        ...(values.goal.trim() ? { [ENTRY_GOAL]: values.goal.trim() } : {}),
      });

      // no-cors gives an opaque response we cannot read, so a request that
      // doesn't throw is treated as submitted.
      await fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, {
        method: 'POST',
        mode: 'no-cors',
        body,
      });

      setDone({
        firstName: values.fullName.trim().split(' ')[0],
        school: values.schoolName.trim(),
        email: values.email.trim(),
      });
      setValues(EMPTY_VALUES);
      setErrors({});
    } catch {
      setSubmitError('We could not send your details. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#DDE5F0]">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E7490] text-white font-bold text-sm flex items-center justify-center">C</div>
            <span className="font-semibold text-base text-[#0D2B55]">Clariva</span>
          </div>
          <a href="#waitlist" className="text-xs font-bold text-[#0E7490] hover:text-[#0B5C72] transition-colors">
            Join the waitlist →
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pt-16 pb-14 lg:pt-24 lg:pb-20 text-center">
          <h1 className="mt-6 mx-auto max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0D2B55] leading-[1.12]">
            Retire the paper registers and spreadsheets.
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-base sm:text-lg text-[#64748B] leading-relaxed">
            Clariva runs your whole school in one place — attendance, fees, grades, announcements and a
            parent portal — so nothing lives in three different notebooks ever again.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#waitlist" className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0E7490] text-white text-sm font-bold hover:bg-[#0B5C72] transition-colors">
              Join the waitlist
            </a>
            <span className="text-xs text-[#64748B]">Takes under a minute — no card details.</span>
          </div>
        </section>

        {/* What's included */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-14 lg:py-20 scroll-mt-16">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E7490]">What&apos;s included</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0D2B55]">Everything a school office needs</h2>
            <p className="mt-3 text-sm sm:text-base text-[#64748B]">One login for the whole school. No more chasing files.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white border border-[#DDE5F0] rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-[#E6F3F6] flex items-center justify-center text-[#0E7490]">
                  <f.icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-[#0D2B55]">{f.title}</h3>
                <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Waitlist form */}
        <section id="waitlist" className="scroll-mt-16 border-t border-[#DDE5F0] bg-white">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20 grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#0E7490] bg-[#E6F3F6] rounded-full px-3 py-1">
                Early access
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-[#0D2B55]">
                Be one of the first schools on Clariva
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
                Tell us about your school and we&apos;ll reach out as we open up access. No commitment.
              </p>
              <ul className="mt-6 space-y-3">
                {PERKS.map(p => (
                  <li key={p} className="flex items-start gap-3 text-sm text-[#0D2B55]">
                    <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[#E6F3F6] text-[#0E7490] flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {done ? (
                <div className="bg-white border border-[#DDE5F0] rounded-xl p-7 sm:p-9 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-[#E6F3F6] text-[#0E7490] flex items-center justify-center">
                    <Check className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[#0D2B55]">You&apos;re on the list</h3>
                  <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                    Thanks{done.firstName ? `, ${done.firstName}` : ''} — we&apos;ll email{' '}
                    <span className="font-semibold text-[#0D2B55]">{done.email}</span> with early-access details for{' '}
                    <span className="font-semibold text-[#0D2B55]">{done.school}</span>.
                  </p>
                  <a href="#features" className="inline-block mt-6 text-xs font-bold text-[#0E7490] hover:text-[#0B5C72]">
                    ← See what&apos;s included
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="bg-white border border-[#DDE5F0] rounded-xl p-5 sm:p-7">
                  <h3 className="text-lg font-bold text-[#0D2B55]">Join the waitlist</h3>
                  <p className="mt-1 text-xs text-[#64748B]">Fields marked * are required.</p>

                  {submitError && (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-3 py-2.5 text-xs text-[#B91C1C]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
                      <div>
                        <p>{submitError}</p>
                        <button type="submit" className="mt-1 font-bold underline cursor-pointer">
                          Try again
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field id="fullName" label="Full name" required error={errors.fullName}>
                      <input
                        id="fullName" type="text" autoComplete="name" placeholder="Adebayo Ogunlesi"
                        value={values.fullName} onChange={update('fullName')} aria-invalid={!!errors.fullName}
                        className={inputClass(errors.fullName)}
                      />
                    </Field>

                    <Field id="schoolName" label="School name" required error={errors.schoolName}>
                      <input
                        id="schoolName" type="text" autoComplete="organization" placeholder="Greenfield International"
                        value={values.schoolName} onChange={update('schoolName')} aria-invalid={!!errors.schoolName}
                        className={inputClass(errors.schoolName)}
                      />
                    </Field>

                    <SelectField id="role" label="Your role" value={values.role} error={errors.role}
                      options={ROLE_OPTIONS} onChange={update('role')} />

                    <Field id="phone" label="Phone number (WhatsApp preferred)" required error={errors.phone}>
                      <input
                        id="phone" type="tel" autoComplete="tel" placeholder="0803 000 0000"
                        value={values.phone} onChange={update('phone')} aria-invalid={!!errors.phone}
                        className={inputClass(errors.phone)}
                      />
                    </Field>

                    <Field id="email" label="Email" required error={errors.email} className="sm:col-span-2">
                      <input
                        id="email" type="email" autoComplete="email" placeholder="you@yourschool.com"
                        value={values.email} onChange={update('email')} aria-invalid={!!errors.email}
                        className={inputClass(errors.email)}
                      />
                    </Field>

                    <SelectField id="students" label="Approx. number of students" value={values.students} error={errors.students}
                      options={STUDENT_RANGE_OPTIONS} onChange={update('students')} className="sm:col-span-2" />

                    <Field id="goal" label="Anything specific you'd want this to solve?" className="sm:col-span-2">
                      <textarea
                        id="goal" rows={3} placeholder="Optional"
                        value={values.goal} onChange={update('goal')}
                        className="w-full px-3.5 py-3 rounded-xl border bg-white text-sm text-[#0D2B55] outline-none placeholder:text-[#94A3B8] border-[#DDE5F0] focus:border-[#0E7490] resize-none"
                      />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 w-full h-12 rounded-xl bg-[#0E7490] text-white text-sm font-bold hover:bg-[#0B5C72] disabled:opacity-60 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    {submitting ? 'Sending…' : 'Join the waitlist'}
                  </button>
                  <p className="mt-3 text-[11px] text-[#94A3B8] text-center">
                    We&apos;ll only use your details to contact you about Clariva.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DDE5F0]">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0E7490] text-white text-[11px] font-bold flex items-center justify-center">C</div>
            <span className="font-semibold text-[#0D2B55]">Clariva</span>
          </div>
          <p>School management for Nigerian schools · © {new Date().getFullYear()} Clariva</p>
        </div>
      </footer>
    </div>
  );
}