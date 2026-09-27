'use client';

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Google Form integration — https://docs.google.com/forms/d/e/{FORM_ID}/formResponse
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

// A register, not a feature grid: each row is one part of the school Clariva runs.
const MODULES = [
  { name: 'Students', desc: 'Admissions, class lists and end-of-term promotion, kept as one record instead of six spreadsheets.' },
  { name: 'Staff', desc: "Give every teacher and bursar their own login, scoped to what they actually need to touch." },
  { name: 'Fees', desc: "Know exactly who's paid and who hasn't, in Naira, without opening an invoice book." },
  { name: 'Grades', desc: 'Continuous assessment and report cards, ready the moment the term ends.' },
  { name: 'Attendance', desc: 'Marked once, visible everywhere: the dashboard, the parent portal, the report card.' },
  { name: 'Announcements', desc: 'Post it once and every parent and teacher gets it. No separate group chat to manage.' },
  { name: 'Parents', desc: "A login of their own, so \u2018how's my child doing\u2019 stops being a phone call to the office." },
];

const PERKS = [
  'Early access before this opens up publicly',
  'Someone from the team helps you set up your first term',
  'A direct line to us, not a support ticket queue',
];

type FieldKey = 'fullName' | 'schoolName' | 'role' | 'phone' | 'email' | 'students' | 'goal';

const FIELD_ORDER: FieldKey[] = ['fullName', 'schoolName', 'role', 'phone', 'email', 'students', 'goal'];

type Values = Record<FieldKey, string>;
type Errors = Partial<Record<FieldKey, string>>;

const EMPTY_VALUES: Values = {
  fullName: '', schoolName: '', role: '', phone: '', email: '', students: '', goal: '',
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

function underlineClass(error?: string) {
  return `w-full h-11 bg-transparent text-[15px] outline-none placeholder:text-[var(--ink-soft)]/60 border-b transition-colors ${
    error ? 'border-[var(--flag)]' : 'border-[var(--rule)] focus:border-[var(--brass)]'
  }`;
}

function Field({ id, label, required, error, className = '', children }: {
  id: string; label: string; required?: boolean; error?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] text-[var(--ink-soft)] mb-1.5">
        {label}{required && <span className="text-[var(--brass)]"> *</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-[12px] text-[var(--flag)]">{error}</p>}
    </div>
  );
}

function SelectField({ id, label, value, error, options, onChange, className = '' }: {
  id: string; label: string; value: string; error?: string; options: string[];
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void; className?: string;
}) {
  return (
    <Field id={id} label={label} required error={error} className={className}>
      <select
        id={id} value={value} onChange={onChange} aria-invalid={!!error}
        className={`${underlineClass(error)} appearance-none cursor-pointer ${value ? '' : 'text-[var(--ink-soft)]/60'}`}
      >
        <option value="">Choose one</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
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

      await fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, {
        method: 'POST', mode: 'no-cors', body,
      });

      setDone({
        firstName: values.fullName.trim().split(' ')[0],
        school: values.schoolName.trim(),
        email: values.email.trim(),
      });
      setValues(EMPTY_VALUES);
      setErrors({});
    } catch {
      setSubmitError('That did not go through. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl">Clariva</span>
          <a href="#waitlist" className="text-sm text-[var(--ink-soft)] hover:text-[var(--brass)] transition-colors">
            Get Early Access
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 grid gap-12 lg:grid-cols-[1.2fr_1fr] items-start">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.08]">
              Run your entire school
              <br />from one Platform.
            </h1>
            <p className="mt-6 max-w-md text-[17px] text-[var(--ink-soft)] leading-relaxed">
              Students, staff, fees, grades, attendance, and parent updates.
              All under one platform, so nothing depends on one spreadsheet, or
              the one person who understands it.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center h-12 px-7 bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--brass-deep)] transition-colors"
              >
                Get Early Access
              </a>
              <span className="text-sm text-[var(--ink-soft)]">Two minutes. No card details.</span>
            </div>
          </div>

          {/* Manifest strip: plain rule-divided list, not a numbered sequence */}
          <div className="border-t border-[var(--rule)] lg:mt-3">
            {MODULES.slice(0, 5).map(m => (
              <div key={m.name} className="border-b border-[var(--rule)] py-3 flex items-baseline justify-between gap-4">
                <span className="font-display text-[17px]">{m.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ledger — the features, as a register */}
        <section id="what-it-runs" className="border-t border-[var(--rule)] bg-[var(--surface)]">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="font-display text-2xl sm:text-3xl max-w-lg">
              Every part of the school office, covered
            </h2>
            <div className="mt-8 border-t border-[var(--rule)]">
              {MODULES.map(m => (
                <div key={m.name} className="border-b border-[var(--rule)] py-5 grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-8">
                  <span className="font-display text-lg">{m.name}</span>
                  <p className="text-[15px] text-[var(--ink-soft)] leading-relaxed max-w-xl">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Waitlist form */}
        <section id="waitlist" className="border-t border-[var(--rule)]">
          <div className="mx-auto max-w-5xl px-6 py-16 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl">Be one of the first schools on it</h2>
              <p className="mt-3 text-[15px] text-[var(--ink-soft)] leading-relaxed max-w-sm">
                Tell us about your school. We&rsquo;ll reach out as we open up access. No commitment either way.
              </p>
              <ul className="mt-8 space-y-3">
                {PERKS.map(p => (
                  <li key={p} className="flex items-start gap-3 text-[15px]">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--brass)] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {done ? (
                <div className="py-8">
                  <div className="animate-stamp w-14 h-14 rounded-full border-2 border-[var(--brass)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--brass)]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mt-5 font-display text-2xl">You&rsquo;re on the list</h3>
                  <p className="mt-2 text-[15px] text-[var(--ink-soft)] leading-relaxed max-w-sm">
                    Thanks{done.firstName ? `, ${done.firstName}` : ''}. We&rsquo;ll write to{' '}
                    <span className="text-[var(--ink)]">{done.email}</span> with early-access details for{' '}
                    <span className="text-[var(--ink)]">{done.school}</span>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {submitError && (
                    <div role="alert" className="mb-5 text-[13px] text-[var(--flag)] border-l-2 border-[var(--flag)] pl-3">
                      {submitError}{' '}
                      <button type="submit" className="underline cursor-pointer">Try again</button>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="fullName" label="Full name" required error={errors.fullName}>
                      <input id="fullName" type="text" autoComplete="name" placeholder="Adebayo Ogunlesi"
                        value={values.fullName} onChange={update('fullName')} aria-invalid={!!errors.fullName}
                        className={underlineClass(errors.fullName)} />
                    </Field>

                    <Field id="schoolName" label="School name" required error={errors.schoolName}>
                      <input id="schoolName" type="text" autoComplete="organization" placeholder="Greenfield International"
                        value={values.schoolName} onChange={update('schoolName')} aria-invalid={!!errors.schoolName}
                        className={underlineClass(errors.schoolName)} />
                    </Field>

                    <SelectField id="role" label="Your role" value={values.role} error={errors.role}
                      options={ROLE_OPTIONS} onChange={update('role')} />

                    <Field id="phone" label="Phone (WhatsApp preferred)" required error={errors.phone}>
                      <input id="phone" type="tel" autoComplete="tel" placeholder="0803 000 0000"
                        value={values.phone} onChange={update('phone')} aria-invalid={!!errors.phone}
                        className={underlineClass(errors.phone)} />
                    </Field>

                    <Field id="email" label="Email" required error={errors.email} className="sm:col-span-2">
                      <input id="email" type="email" autoComplete="email" placeholder="you@yourschool.com"
                        value={values.email} onChange={update('email')} aria-invalid={!!errors.email}
                        className={underlineClass(errors.email)} />
                    </Field>

                    <SelectField id="students" label="Approx. number of students" value={values.students}
                      error={errors.students} options={STUDENT_RANGE_OPTIONS} onChange={update('students')}
                      className="sm:col-span-2" />

                    <Field id="goal" label="Anything specific you'd want this to solve? (optional)" className="sm:col-span-2">
                      <textarea id="goal" rows={2} value={values.goal} onChange={update('goal')}
                        className="w-full px-0 py-2 bg-transparent text-[15px] outline-none border-b border-[var(--rule)] focus:border-[var(--brass)] resize-none transition-colors" />
                    </Field>
                  </div>

                  <button
                    type="submit" disabled={submitting}
                    className="mt-8 h-12 px-8 bg-[var(--ink)] text-[var(--paper)] text-sm font-medium hover:bg-[var(--brass-deep)] disabled:opacity-60 transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    {submitting && (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                    {submitting ? 'Sending' : 'Get Early Access'}
                  </button>
                  <p className="mt-4 text-[12px] text-[var(--ink-soft)]">
                    We&rsquo;ll only use this to contact you about Clariva.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--rule)]">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between text-[13px] text-[var(--ink-soft)]">
          <span className="font-display text-[var(--ink)]">Clariva</span>
          <p>School management for Nigerian schools</p>
        </div>
      </footer>
    </div>
  );
}