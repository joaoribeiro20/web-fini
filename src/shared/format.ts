export const formatCurrency = (value: number, fractionDigits = 0) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(value)

export const formatPercent = (value: number, fractionDigits = 0) =>
	`${value.toFixed(fractionDigits).replace('.', ',')}%`
