export type ValidationResult = { valid: boolean; message: string };

const ok = (): ValidationResult => ({ valid: true, message: '' });
const fail = (message: string): ValidationResult => ({ valid: false, message });

// ─── Regex constants ──────────────────────────────────────────────────────────

export const REGEX = {
    digitsOnly: /[^0-9]/g,
    indianMobile: /^[6-9][0-9]{9}$/,
    pincode: /^[1-9][0-9]{5}$/,
    otp: /^\d{6}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// ─── Input sanitisers ─────────────────────────────────────────────────────────

export const sanitize = {
    phone: (raw: string) => raw.replace(REGEX.digitsOnly, '').slice(0, 10),
    pincode: (raw: string) => raw.replace(REGEX.digitsOnly, '').slice(0, 6),
    otpDigit: (raw: string) => raw.replace(REGEX.digitsOnly, '').slice(0, 1),
    digits: (raw: string) => raw.replace(REGEX.digitsOnly, ''),
    date: (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
        if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
        return formatted.slice(0, 10);
    }
};

// ─── Validators ───────────────────────────────────────────────────────────────

export const validate = {
    required: (value: string, fieldName: string): ValidationResult =>
        value.trim() ? ok() : fail(`${fieldName} is required`),

    email: (value: string): ValidationResult => {
        if (!value.trim()) return fail('Email is required');
        if (!REGEX.email.test(value)) return fail('Please enter a valid email');
        return ok();
    },

    employeeId: (value: string): ValidationResult => {
        if (!value.trim()) return fail('Employee ID is required');
        if (value.length < 3) return fail('Enter a valid Employee ID');
        return ok();
    },

    phone: (value: string): ValidationResult => {
        if (!value) return fail('Mobile number is required');
        if (value.length < 10) return fail('Enter a valid 10-digit mobile number');
        if (!REGEX.indianMobile.test(value)) return fail('Number must start with 6, 7, 8, or 9');
        return ok();
    },

    pincode: (value: string): ValidationResult => {
        const v = value.trim();
        if (!v) return fail('Pincode is required');
        if (v.length < 6 || !/^\d{6}$/.test(v)) return fail('Enter a valid 6-digit pincode');
        if (!REGEX.pincode.test(v)) return fail('Enter a valid pincode');
        if (/^(\d)\1{5}$/.test(v)) return fail('Enter a valid pincode');
        const digits = v.split('').map(Number);
        const isAscending = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
        const isDescending = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
        if (isAscending || isDescending) return fail('Enter a valid pincode');
        return ok();
    },

    otp: (value: string): ValidationResult => {
        if (!value || value.length < 6) return fail('Enter the 6-digit OTP');
        if (!REGEX.otp.test(value)) return fail('OTP must contain digits only');
        return ok();
    },

    password: (value: string): ValidationResult => {
        if (!value) return fail('Password is required');
        if (value.length < 6) return fail('Password must be at least 6 digits');
        return ok();
    },

    date: (value: string): ValidationResult => {
        if (!value) return fail('Date of Birth is required');
        if (value.length < 10) return fail('Enter full date (DD-MM-YYYY)');
        const [d, m, y] = value.split('-').map(Number);
        if (d < 1 || d > 31) return fail('Invalid day');
        if (m < 1 || m > 12) return fail('Invalid month');
        if (y < 1900 || y > new Date().getFullYear()) return fail('Invalid year');
        return ok();
    },

    form: (rules: ValidationResult[]): string | null => {
        const failed = rules.find((r) => !r.valid);
        return failed ? failed.message : null;
    },
};
