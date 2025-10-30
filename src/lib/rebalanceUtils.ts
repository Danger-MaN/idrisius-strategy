export interface RebalanceResult {
  totalValueBefore: number;
  totalValueAfter: number;
  targetGoldUSD: number;
  targetBtcUSD: number;
  buyGoldUSD: number;
  buyBtcUSD: number;
  buyGoldAmount: number;
  buyBtcAmount: number;
  sellAsset?: string;
  buyAsset?: string;
  sellAmount?: number;
  btcDiffPercent?: number;
  diffUSDValue?: number;
}

export function rebalanceWithUSDT(
  goldAmount: number,
  btcAmount: number,
  goldUsdPrice: number,
  btcUsdPrice: number,
  usdtBalance: number,
  goldPercent: number,
  btcPercent: number
): RebalanceResult {
  // Current values in USD
  const goldValueUSD = goldAmount * goldUsdPrice;
  const btcValueUSD = btcAmount * btcUsdPrice;
  const totalValueBefore = goldValueUSD + btcValueUSD;

  // New total after adding USDT
  const totalValueAfter = totalValueBefore + usdtBalance;

  // Target values based on percentages
  const targetGoldUSD = totalValueAfter * (goldPercent / 100);
  const targetBtcUSD = totalValueAfter * (btcPercent / 100);

  // Differences
  const diffGold = targetGoldUSD - goldValueUSD;
  const diffBtc = targetBtcUSD - btcValueUSD;

  // Buy amounts
  const buyGoldUSD = Math.max(diffGold, 0);
  const buyBtcUSD = Math.max(diffBtc, 0);

  const buyGoldAmount = buyGoldUSD / goldUsdPrice;
  const buyBtcAmount = buyBtcUSD / btcUsdPrice;

  return {
    totalValueBefore,
    totalValueAfter,
    targetGoldUSD,
    targetBtcUSD,
    buyGoldUSD,
    buyBtcUSD,
    buyGoldAmount,
    buyBtcAmount,
  };
}

export function rebalanceGoldBased(
  goldAmount: number,
  btcAmount: number,
  targetGoldPercent: number,
  targetBtcPercent: number,
  btcInGold: number,
  goldPriceUSD: number,
  btcPriceUSD: number
): RebalanceResult {
  // Values in gold units
  const goldValue = goldAmount;
  const btcValue = btcAmount * btcInGold;
  const totalGoldValue = goldValue + btcValue;

  // Targets in gold units
  const targetGoldValue = totalGoldValue * (targetGoldPercent / 100);
  const targetBtcValue = totalGoldValue * (targetBtcPercent / 100);

  // Convert to original units
  const targetGoldAmount = targetGoldValue;
  const targetBtcAmount = targetBtcValue / btcInGold;

  // Differences
  const diffGold = goldValue - targetGoldValue;
  const diffBtc = btcValue - targetBtcValue;

  let sellAsset = "";
  let buyAsset = "";
  let sellAmount = 0;
  let buyAmount = 0;

  if (diffGold > 0) {
    sellAsset = "Gold";
    buyAsset = "Bitcoin";
    const sellValue = diffGold;
    sellAmount = sellValue;
    buyAmount = sellValue / btcInGold;
  } else if (diffBtc > 0) {
    sellAsset = "Bitcoin";
    buyAsset = "Gold";
    const sellValue = diffBtc;
    sellAmount = sellValue / btcInGold;
    buyAmount = sellValue;
  }

  // BTC movement percentage
  const btcDiffPercent = targetBtcValue !== 0 ? (diffBtc / targetBtcValue) * 100 : 0;
  const diffUSDValue = Math.abs(diffBtc) * goldPriceUSD;

  return {
    totalValueBefore: goldValue + btcValue,
    totalValueAfter: totalGoldValue,
    targetGoldUSD: targetGoldValue * goldPriceUSD,
    targetBtcUSD: targetBtcValue * goldPriceUSD,
    buyGoldUSD: 0,
    buyBtcUSD: 0,
    buyGoldAmount: targetGoldAmount,
    buyBtcAmount: targetBtcAmount,
    sellAsset,
    buyAsset,
    sellAmount,
    btcDiffPercent,
    diffUSDValue,
  };
}
