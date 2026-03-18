import { MATERIAL_RATES } from '../core/constants.js';

export function calcMaterials(totalTiledAreaM2, wallAreaM2, wetAreaM2 = 0, customRates = {}) {
  const rates = { ...MATERIAL_RATES };
  // Apply custom rates
  Object.keys(customRates).forEach(k => {
    if (rates[k]) rates[k] = { ...rates[k], rate: customRates[k] };
  });

  return {
    glue: {
      ...rates.glue,
      amount: Math.ceil(totalTiledAreaM2 * rates.glue.rate * 10) / 10,
    },
    grout: {
      ...rates.grout,
      amount: Math.ceil(totalTiledAreaM2 * rates.grout.rate * 10) / 10,
    },
    primer: {
      ...rates.primer,
      amount: Math.ceil(totalTiledAreaM2 * rates.primer.rate * 10) / 10,
    },
    waterproofing: {
      ...rates.waterproofing,
      amount: Math.ceil(wetAreaM2 * rates.waterproofing.rate * 10) / 10,
    },
    plaster: {
      ...rates.plaster,
      amount: Math.ceil(wallAreaM2 * rates.plaster.rate * 10) / 10,
    },
  };
}
