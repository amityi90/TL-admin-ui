// The shop sells in US dollars only, so every amount in the dashboard goes
// through this one formatter ($1,250.00).
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatUSD = (amount: number | string | null | undefined): string =>
    usd.format(Number(amount) || 0);
