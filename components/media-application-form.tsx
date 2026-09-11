'use client';

import { ChangeEvent, SyntheticEvent, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormValues = {
  fullName: string;
  nationalId: string;
  youtube: string;
  tiktok: string;
  instagram: string;
  gmail: string;
  whatsapp: string;
};

const initialValues: FormValues = {
  fullName: '',
  nationalId: '',
  youtube: '',
  tiktok: '',
  instagram: '',
  gmail: '',
  whatsapp: '',
};

const fields: Array<{
  id: keyof FormValues;
  label: string;
  placeholder: string;
  type: string;
  autoComplete?: string;
}> = [
  {
    id: 'fullName',
    label: 'Full name',
    placeholder: 'Your legal name',
    type: 'text',
    autoComplete: 'name',
  },
  {
    id: 'nationalId',
    label: 'National ID',
    placeholder: 'Citizenship or national ID number',
    type: 'text',
    autoComplete: 'off',
  },
  {
    id: 'gmail',
    label: 'Gmail',
    placeholder: 'name@gmail.com',
    type: 'email',
    autoComplete: 'email',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    placeholder: '+977 98XXXXXXXX',
    type: 'tel',
    autoComplete: 'tel',
  },
  {
    id: 'youtube',
    label: 'YouTube link',
    placeholder: 'https://youtube.com/@channel',
    type: 'url',
  },
  {
    id: 'tiktok',
    label: 'TikTok link',
    placeholder: 'https://tiktok.com/@profile',
    type: 'url',
  },
  {
    id: 'instagram',
    label: 'Instagram link',
    placeholder: 'https://instagram.com/profile',
    type: 'url',
  },
];

export function MediaApplicationForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.currentTarget.value,
      }));
      setSubmitted(false);
      setError('');
    };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: values,
          type: 'media',
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? 'Application could not be submitted right now.',
        );
      }

      setSubmitted(true);
      setValues(initialValues);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Application could not be submitted right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="space-y-5 rounded-lg border border-white/12 bg-[#050915]/78 p-5 shadow-[0_30px_120px_rgba(7,13,31,0.46)] backdrop-blur-2xl sm:p-6"
      onSubmit={handleSubmit}
      data-qa="media-application-form"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className={field.id === 'instagram' ? 'sm:col-span-2' : undefined}
          >
            <Label
              htmlFor={field.id}
              className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
            >
              {field.label}
            </Label>
            <Input
              id={field.id}
              name={field.id}
              type={field.type}
              value={values[field.id]}
              onChange={updateField(field.id)}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              required
              className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
            />
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-md bg-red-500 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-red-400"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {loading ? 'Submitting' : 'Apply for Media Partner'}
      </Button>

      <p className="text-sm leading-6 text-slate-400">
        Applications are saved directly for the PMGO SA Fall event team.
      </p>
      {error && (
        <p className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
          {error}
        </p>
      )}
      {submitted && (
        <p className="rounded-md border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-sm font-semibold text-cyan-100">
          Application submitted. The team will review it soon.
        </p>
      )}
    </form>
  );
}
