import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPasswordRequirements } from '../../utils/passwordPolicy';

export default function PasswordRequirements({ password = '' }) {
  const reqs = checkPasswordRequirements(password);

  const items = [
    { label: 'At least 12 characters', valid: reqs.minLength },
    { label: 'One uppercase letter (A-Z)', valid: reqs.hasUpper },
    { label: 'One lowercase letter (a-z)', valid: reqs.hasLower },
    { label: 'One number (0-9)', valid: reqs.hasNumber },
    { label: 'One special character (@ $ ! % * ? &)', valid: reqs.hasSpecial }
  ];

  return (
    <div className="mt-3 p-3 rounded-lg bg-slate-900/50 dark:bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
      <p className="font-semibold text-slate-300 mb-2">Password Requirements:</p>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className={`flex items-center gap-2 transition-colors ${item.valid ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
            {item.valid ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
