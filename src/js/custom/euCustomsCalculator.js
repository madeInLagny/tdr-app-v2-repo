/**
 * EU Customs Calculator
 * Calculates duty rates, handling surcharges, and VAT declaration modes
 * based on EU 2026 customs regulations
 */

(function() {
	'use strict';

	// ===== Countries Database =====
	const EU_MEMBER_STATES = [
		'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
		'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
		'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
		'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
		'Spain', 'Sweden'
	];

	const NON_EU_COUNTRIES = [
		'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
		'Argentina', 'Armenia', 'Australia', 'Azerbaijan', 'Bahamas', 'Bahrain',
		'Bangladesh', 'Barbados', 'Belarus', 'Belize', 'Benin', 'Bhutan',
		'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
		'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
		'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
		'Congo', 'Costa Rica', 'Côte d\'Ivoire', 'Cuba', 'Curaçao', 'Democratic Republic of Congo',
		'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
		'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Fiji', 'Gabon',
		'Gambia', 'Georgia', 'Ghana', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
		'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'India', 'Indonesia', 'Iran',
		'Iraq', 'Israel', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
		'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon',
		'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Madagascar', 'Malawi',
		'Malaysia', 'Maldives', 'Mali', 'Marshall Islands', 'Mauritania', 'Mauritius',
		'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
		'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'New Zealand', 'Nicaragua',
		'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
		'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
		'Peru', 'Philippines', 'Qatar', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
		'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
		'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
		'Sierra Leone', 'Singapore', 'Sint Maarten', 'Solomon Islands', 'Somalia',
		'South Africa', 'South Korea', 'South Sudan', 'Sudan', 'Suriname', 'Switzerland',
		'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
		'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
		'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
		'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
		'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
	].sort();

	// ===== Duty Rate Database by Country (simplified example) =====
	// In production, this should come from a comprehensive tariff database
	const DUTY_RATES = {
		'default': {
			before: 2.5,  // Default 2.5% before July 1st 2026
			after: 5.0    // Default 5.0% after July 1st 2026
		},
		'China': {
			before: 5.0,
			after: 12.0
		},
		'India': {
			before: 2.5,
			after: 8.0
		},
		'Vietnam': {
			before: 3.0,
			after: 7.5
		},
		'Thailand': {
			before: 2.5,
			after: 6.5
		},
		'Indonesia': {
			before: 2.5,
			after: 6.0
		},
		'Bangladesh': {
			before: 2.5,
			after: 7.0
		},
		'Pakistan': {
			before: 2.5,
			after: 6.5
		},
		'United States': {
			before: 0,
			after: 0  // No EU duties on US goods due to trade agreements
		},
		'United Kingdom': {
			before: 0,
			after: 2.5  // New post-Brexit regulation
		},
		'Switzerland': {
			before: 0,
			after: 0  // Trade partner
		},
		'Turkey': {
			before: 0,
			after: 0  // Customs Union
		},
		'Norway': {
			before: 0,
			after: 0  // EEA
		}
	};

	// ===== Configuration =====
	const CONFIG = {
		// Threshold for simplified procedure (before July 1st 2026)
		thresholdBefore: 150, // EUR
		// Threshold for simplified procedure (after July 1st 2026)
		thresholdAfter: 150,  // EUR (changed in 2026)
		// Minimum handling surcharge per package after July 1st 2026
		handlingSurchargePerPackage: 0.5, // EUR
		// De minimis threshold (goods below this value have no duty)
		deMinimisThreshold: 1,
		// B2C eCom surcharge
		b2cEcommerceSurcharge: 1.0, // EUR per package
		// Handling surcharge currently applies only when goods are cleared in these countries
		handlingSurchargeCountries: ['Italy', 'Romania'],
		// France will implement a handling surcharge from this date (YYYY-MM-DD)
		franceHandlingStart: new Date('2026-03-01')
	};

	// ===== DOM Elements =====
	const form = document.getElementById('euCustomsForm');
	const shippingCountrySelect = document.getElementById('shippingCountry');
	const importCountrySelect = document.getElementById('importCountry');
	const orderValueInput = document.getElementById('orderValue');
	const packageCountInput = document.getElementById('packageCount');
	const hsCodeCountInput = document.getElementById('hsCodeCount');
	const b2cRadios = document.querySelectorAll('input[name="b2cEcommerce"]');
	const resultsSection = document.getElementById('resultsSection');
	const emptyState = document.getElementById('emptyState');

	// Result display elements
	const dutyRateBeforeEl = document.getElementById('dutyRateBefore');
	const estimatedDutyBeforeEl = document.getElementById('estimatedDutyBefore');
	const vatModeBeforeEl = document.getElementById('vatModeBefore');
	const dutyRateAfterEl = document.getElementById('dutyRateAfter');
	const estimatedDutyAfterEl = document.getElementById('estimatedDutyAfter');
	const handlingSurchargeEl = document.getElementById('handlingSurcharge');
	const vatModeAfterEl = document.getElementById('vatModeAfter');
	const impactSummary = document.getElementById('impactSummary');
	const impactText = document.getElementById('impactText');

	// ===== Initialization =====
	function init() {
		populateCountrySelects();
		form.addEventListener('submit', handleFormSubmit);
	}

	// ===== Populate Country Selects =====
	function populateCountrySelects() {
		// Populate shipping country (non-EU)
		NON_EU_COUNTRIES.forEach(country => {
			const option = document.createElement('option');
			option.value = country;
			option.textContent = country;
			shippingCountrySelect.appendChild(option);
		});

		// Populate import country (EU only)
		EU_MEMBER_STATES.forEach(country => {
			const option = document.createElement('option');
			option.value = country;
			option.textContent = country;
			importCountrySelect.appendChild(option);
		});
	}

	// ===== Form Submit Handler =====
	function handleFormSubmit(e) {
		e.preventDefault();

		const formData = {
			shippingCountry: shippingCountrySelect.value,
			importCountry: importCountrySelect.value,
			orderValue: parseFloat(orderValueInput.value),
			packageCount: parseInt(packageCountInput.value),
			hsCodeCount: parseInt(hsCodeCountInput.value),
			b2cEcommerce: document.querySelector('input[name="b2cEcommerce"]:checked').value === 'yes'
		};

		if (validateForm(formData)) {
			calculateAndDisplayResults(formData);
		}
	}

	// ===== Form Validation =====
	function validateForm(data) {
		if (!data.shippingCountry || !data.importCountry) {
			alert('Please select both shipping and import countries');
			return false;
		}
		if (data.shippingCountry === data.importCountry) {
			alert('Shipping country cannot be the same as import country');
			return false;
		}
		if (data.orderValue <= 0) {
			alert('Order value must be greater than 0');
			return false;
		}
		if (data.packageCount < 1 || data.hsCodeCount < 1) {
			alert('Package count and HS code count must be at least 1');
			return false;
		}
		return true;
	}

	// ===== Calculate Results =====
	function calculateAndDisplayResults(data) {
		const resultsBefore = calculateDutiesAndVAT(data, 'before');
		const resultsAfter = calculateDutiesAndVAT(data, 'after');

		displayResults(resultsBefore, resultsAfter, data);
	}

	// ===== Calculate Duties and VAT =====
	function calculateDutiesAndVAT(data, period) {
		const dutyRate = getDutyRate(data.shippingCountry, period);
		const orderValue = data.orderValue;
		const packageCount = data.packageCount;
		const hsCodeCount = data.hsCodeCount;
		const isB2cEcommerce = data.b2cEcommerce;

		// Initialize result object
		const result = {
			period: period,
			dutyRate: dutyRate,
			orderValue: orderValue,
			packageCount: packageCount,
			hsCodeCount: hsCodeCount,
			isB2cEcommerce: isB2cEcommerce
		};

		if (period === 'before') {
			// BEFORE July 1st 2026
			result.threshold = CONFIG.thresholdBefore;
			result.isSimplifiedProcedure = orderValue <= CONFIG.thresholdBefore;

			// Duty calculation
			if (orderValue <= CONFIG.deMinimisThreshold) {
				result.duty = 0; // De minimis threshold
				result.dutyReason = 'De minimis';
			} else if (result.isSimplifiedProcedure) {
				result.duty = 0; // No duty for simplified procedure (under 150 EUR)
				result.dutyReason = 'Simplified procedure';
			} else {
				result.duty = orderValue * (dutyRate / 100);
				result.dutyReason = 'General procedure';
			}

			// VAT calculation (before 2026: generally not charged on imports under 150 EUR)
			if (orderValue <= CONFIG.thresholdBefore) {
				result.vatMode = 'Not charged (simplified)';
				result.vat = 0;
			} else {
				result.vatMode = 'Charged at destination';
				result.vat = (orderValue + result.duty) * 0.19; // Assuming 19% VAT (varies by country)
			}

			result.handlingSurcharge = 0; // No surcharge before 2026
			result.total = orderValue + result.duty + result.vat;

		} else {
			// AFTER July 1st 2026 - New regulations
			result.threshold = CONFIG.thresholdAfter;
			result.isSimplifiedProcedure = orderValue <= CONFIG.thresholdAfter;

			// Duty calculation
			if (orderValue <= CONFIG.deMinimisThreshold) {
				result.duty = 0;
				result.dutyReason = 'De minimis';
			} else {
				result.duty = orderValue * (dutyRate / 100);
				result.dutyReason = 'General procedure (new 2026 rules)';
			}

			// VAT calculation (after 2026: charged on all imports including those under 150 EUR)
			const vatBase = orderValue + result.duty;
			result.vat = vatBase * 0.19; // Assuming 19% VAT
			result.vatMode = 'Charged on all imports';

			// Handling surcharge calculation (limited to specified import countries)
			const importCountry = data.importCountry;
			const now = new Date();
			let handlingApplicable = CONFIG.handlingSurchargeCountries.includes(importCountry);
			if (!handlingApplicable && importCountry === 'France') {
				handlingApplicable = now >= CONFIG.franceHandlingStart;
			}

			if (handlingApplicable) {
				result.handlingSurcharge = CONFIG.handlingSurchargePerPackage * packageCount;
			} else {
				result.handlingSurcharge = 0;
			}

			result.total = orderValue + result.duty + result.vat + result.handlingSurcharge;
		}

		return result;
	}

	// ===== Get Duty Rate =====
	function getDutyRate(country, period) {
		const countryRates = DUTY_RATES[country] || DUTY_RATES.default;
		return period === 'before' ? countryRates.before : countryRates.after;
	}

	// ===== Format Currency =====
	function formatCurrency(value) {
		return new Intl.NumberFormat('en-EU', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	}

	// ===== Display Results =====
	function displayResults(resultsBefore, resultsAfter, formData) {

		// We now present only the two impacts requested by the user:
		// 1) Handling surcharge (only for certain import countries)
		// 2) Abolition of de-minimis from July 1st 2026 (3 EUR per HS code for eCom imports)

		// Clear or hide detailed duty/VAT numbers (guard if elements removed)
		if (dutyRateBeforeEl) dutyRateBeforeEl.textContent = '-';
		if (estimatedDutyBeforeEl) estimatedDutyBeforeEl.textContent = '-';
		if (vatModeBeforeEl) vatModeBeforeEl.textContent = '-';
		if (dutyRateAfterEl) dutyRateAfterEl.textContent = '-';
		if (estimatedDutyAfterEl) estimatedDutyAfterEl.textContent = '-';

		// Handling surcharge (display amount if applicable)
		const handling = resultsAfter.handlingSurcharge || 0;
		if (handlingSurchargeEl) {
			handlingSurchargeEl.textContent = handling > 0 ? formatCurrency(handling) : 'None';
		}

		// De-minimis abolition impact
		let deMinimisMessage = '';
		if (formData.b2cEcommerce) {
			const deMinimisCost = 3 * formData.hsCodeCount; // 3 EUR per HS code
			deMinimisMessage = `Abolition of de-minimis: an additional fixed cost of ${formatCurrency(deMinimisCost)} (3 EUR x ${formData.hsCodeCount} HS codes) will apply to B2C/eCommerce imports from July 1st 2026.`;
		} else {
			deMinimisMessage = `Abolition of de-minimis: standard customs duties will apply to all commercial orders regardless of value. For exact duty calculations, please request a paid consultation.`;
		}

		// Compose final impact message (only these two impacts are shown)
		let finalMessage = '';
		finalMessage += `Handling surcharge: ${handling > 0 ? formatCurrency(handling) : 'No handling surcharge for this import country.'}`;
		finalMessage += '\n\n';
		finalMessage += deMinimisMessage;
		finalMessage += '\n\nFor a detailed duty estimate and full advice, request a paid consultation: /main/contact-us.html';

		impactText.textContent = finalMessage;
		impactSummary.style.whiteSpace = 'pre-wrap';
		impactSummary.style.display = 'block';

		// Show results, hide empty state
		resultsSection.style.display = 'block';
		emptyState.style.display = 'none';

		// Smooth scroll to results
		resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// ===== Initialize on DOM Ready =====
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
