import Web3 from 'web3';

// ABI للعقود الذكية
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

export interface TokenContract {
  address: string;
  symbol: string;
}

export async function getTokenBalance(
  rpcUrl: string,
  tokenAddress: string,
  walletAddress: string
): Promise<number> {
  try {
    const web3 = new Web3(rpcUrl);
    const contract = new web3.eth.Contract(ERC20_ABI as any, tokenAddress);
    
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = await contract.methods.decimals().call();
    
    return Number(balance) / Math.pow(10, Number(decimals));
  } catch (error) {
    console.error(`Error fetching balance for ${tokenAddress}:`, error);
    return 0;
  }
}

export async function getBTCBalance(address: string): Promise<number> {
  if (!address || !address.trim()) {
    return 0;
  }

  const sources = [
    {
      url: `https://blockstream.info/api/address/${address}`,
      extract: (data: any) => {
        const funded = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        return (funded - spent) / 1e8;
      }
    },
    {
      url: `https://blockchain.info/q/addressbalance/${address}`,
      extract: (data: any) => Number(data) / 1e8
    }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { 
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const balance = source.extract(data);
      
      if (balance !== undefined && balance !== null && !isNaN(balance)) {
        return balance;
      }
    } catch (error) {
      console.warn(`Failed to fetch BTC balance from source:`, error);
      continue;
    }
  }

  console.error(`Failed to fetch BTC balance for ${address} from all sources`);
  return 0;
}

export async function getGoldPriceUSD(): Promise<number> {
  const sources = [
    {
      url: "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd",
      extract: (data: any) => data["pax-gold"]?.["usd"],
    },
    {
      url: "https://api.coinpaprika.com/v1/tickers/paxg-pax-gold",
      extract: (data: any) => data?.quotes?.USD?.price,
    },
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      const price = source.extract(data);
      if (price) return price;
    } catch (error) {
      continue;
    }
  }

  return 2650; // fallback price
}

export async function getBTCPriceUSD(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await response.json();
    return data.bitcoin?.usd || 0;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0;
  }
}

export async function getBTCInGold(): Promise<number> {
  const btcPrice = await getBTCPriceUSD();
  const goldPrice = await getGoldPriceUSD();
  
  if (goldPrice === 0) return 0;
  return btcPrice / goldPrice;
}

export function goldToUSD(goldAmount: number, goldPrice: number): number {
  return goldAmount * goldPrice;
}

export function btcToUSD(btcAmount: number, btcPrice: number): number {
  return btcAmount * btcPrice;
}

export function usdToGold(usdAmount: number, goldPrice: number): number {
  if (goldPrice === 0) return 0;
  return usdAmount / goldPrice;
}

export function usdToBTC(usdAmount: number, btcPrice: number): number {
  if (btcPrice === 0) return 0;
  return usdAmount / btcPrice;
}

export interface HistoricalPrice {
  timestamp: number;
  price: number;
}

export async function getHistoricalBTCPrices(days: number = 365): Promise<HistoricalPrice[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
    );
    const data = await response.json();
    
    if (data.prices) {
      return data.prices.map((item: [number, number]) => ({
        timestamp: item[0],
        price: item[1]
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching historical BTC prices:", error);
    return [];
  }
}

export async function getHistoricalGoldPrices(days: number = 365): Promise<HistoricalPrice[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?vs_currency=usd&days=${days}&interval=daily`
    );
    const data = await response.json();
    
    if (data.prices) {
      return data.prices.map((item: [number, number]) => ({
        timestamp: item[0],
        price: item[1]
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching historical Gold prices:", error);
    return [];
  }
}
