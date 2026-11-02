const ke = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(d);

export const presetRange = (days) => ({ from: ke(new Date(Date.now() - (days - 1) * 864e5)), to: ke(new Date()) });

export { ke };
