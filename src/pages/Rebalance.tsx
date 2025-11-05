import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, TrendingUp, Calculator, Wallet, RefreshCw, Plus, Trash2, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getTokenBalance,
  getBTCBalance,
  getGoldPriceUSD,
  getBTCPriceUSD,
  getBTCInGold,
} from "@/lib/web3Utils";

interface TokenContract {
  id: string;
  name: string;
  symbol: string;
  address: string;
  balance: number;
  priceUSD: number;
}

interface BTCWallet {
  id: string;
  address: string;
  balance: number;
}

interface PolygonWallet {
  id: string;
  address: string;
}

interface TargetAllocation {
  id: string;
  symbol: string;
  percentage: number;
}

export default function Rebalance() {
  const { toast } = useToast();
  
  // RPC URL
  const [rpcUrl, setRpcUrl] = useState(() => 
    localStorage.getItem("rpcUrl") || "https://polygon-rpc.com"
  );
  
  // BTC Wallets
  const [btcWallets, setBtcWallets] = useState<BTCWallet[]>(() => {
    const saved = localStorage.getItem("btcWallets");
    return saved ? JSON.parse(saved) : [{ id: "1", address: "", balance: 0 }];
  });
  
  // Polygon Wallets
  const [polygonWallets, setPolygonWallets] = useState<PolygonWallet[]>(() => {
    const saved = localStorage.getItem("polygonWallets");
    return saved ? JSON.parse(saved) : [{ id: "1", address: "" }];
  });
  
  // Token Contracts
  const [tokenContracts, setTokenContracts] = useState<TokenContract[]>(() => {
    const saved = localStorage.getItem("tokenContracts");
    return saved ? JSON.parse(saved) : [
      { id: "1", name: "Tether USD", symbol: "USDT", address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", balance: 0, priceUSD: 1 },
      { id: "2", name: "USD Coin", symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", balance: 0, priceUSD: 1 },
      { id: "3", name: "Dai Stablecoin", symbol: "DAI", address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", balance: 0, priceUSD: 1 },
      { id: "4", name: "Wrapped BTC", symbol: "WBTC", address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", balance: 0, priceUSD: 0 },
      { id: "5", name: "Paxos Gold", symbol: "PAXG", address: "0x553d3d295e0f695b9228246232edf400ed3560b5", balance: 0, priceUSD: 0 },
    ];
  });
  
  // Target Allocations (max 10)
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>(() => {
    const saved = localStorage.getItem("targetAllocations");
    return saved ? JSON.parse(saved) : [
      { id: "1", symbol: "BTC", percentage: 50 },
      { id: "2", symbol: "PAXG", percentage: 50 },
    ];
  });
  
  // Prices
  const [btcPrice, setBtcPrice] = useState(0);
  const [goldPrice, setGoldPrice] = useState(0);
  const [btcInGold, setBtcInGold] = useState(0);
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Rebalance results state
  interface RebalanceResult {
    symbol: string;
    currentBalance: number;
    currentValueUSD: number;
    currentPercentage: number;
    targetPercentage: number;
    targetValueUSD: number;
    targetBalance: number;
    difference: number;
    differenceUSD: number;
    action: string;
  }
  const [rebalanceResults, setRebalanceResults] = useState<{
    results: RebalanceResult[];
    suitabilityMessage: string;
  } | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("rpcUrl", rpcUrl);
  }, [rpcUrl]);

  useEffect(() => {
    localStorage.setItem("btcWallets", JSON.stringify(btcWallets));
  }, [btcWallets]);

  useEffect(() => {
    localStorage.setItem("polygonWallets", JSON.stringify(polygonWallets));
  }, [polygonWallets]);

  useEffect(() => {
    localStorage.setItem("tokenContracts", JSON.stringify(tokenContracts));
  }, [tokenContracts]);

  useEffect(() => {
    localStorage.setItem("targetAllocations", JSON.stringify(targetAllocations));
  }, [targetAllocations]);

  // BTC Wallet Management
  const addBTCWallet = () => {
    if (btcWallets.length >= 20) {
      toast({
        title: "تحذير",
        description: "الحد الأقصى هو 20 محفظة بيتكوين",
        variant: "destructive",
      });
      return;
    }
    setBtcWallets([...btcWallets, { id: Date.now().toString(), address: "", balance: 0 }]);
  };

  const removeBTCWallet = (id: string) => {
    if (btcWallets.length === 1) {
      toast({
        title: "تحذير",
        description: "يجب أن يكون هناك محفظة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    setBtcWallets(btcWallets.filter(w => w.id !== id));
  };

  const updateBTCWallet = (id: string, address: string) => {
    setBtcWallets(btcWallets.map(w => w.id === id ? { ...w, address } : w));
  };

  // Polygon Wallet Management
  const addPolygonWallet = () => {
    if (polygonWallets.length >= 20) {
      toast({
        title: "تحذير",
        description: "الحد الأقصى هو 20 محفظة Polygon",
        variant: "destructive",
      });
      return;
    }
    setPolygonWallets([...polygonWallets, { id: Date.now().toString(), address: "" }]);
  };

  const removePolygonWallet = (id: string) => {
    if (polygonWallets.length === 1) {
      toast({
        title: "تحذير",
        description: "يجب أن يكون هناك محفظة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    setPolygonWallets(polygonWallets.filter(w => w.id !== id));
  };

  const updatePolygonWallet = (id: string, address: string) => {
    setPolygonWallets(polygonWallets.map(w => w.id === id ? { ...w, address } : w));
  };

  // Token Contract Management
  const addTokenContract = () => {
    if (tokenContracts.length >= 20) {
      toast({
        title: "تحذير",
        description: "الحد الأقصى هو 20 عقد",
        variant: "destructive",
      });
      return;
    }
    setTokenContracts([...tokenContracts, { 
      id: Date.now().toString(), 
      name: "", 
      symbol: "", 
      address: "", 
      balance: 0, 
      priceUSD: 0 
    }]);
  };

  const removeTokenContract = (id: string) => {
    if (tokenContracts.length === 1) {
      toast({
        title: "تحذير",
        description: "يجب أن يكون هناك عقد واحد على الأقل",
        variant: "destructive",
      });
      return;
    }
    setTokenContracts(tokenContracts.filter(t => t.id !== id));
  };

  const updateTokenContract = (id: string, field: string, value: string) => {
    setTokenContracts(tokenContracts.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Target Allocation Management
  const addTargetAllocation = () => {
    if (targetAllocations.length >= 10) {
      toast({
        title: "تحذير",
        description: "الحد الأقصى هو 10 عملات",
        variant: "destructive",
      });
      return;
    }
    setTargetAllocations([...targetAllocations, { 
      id: Date.now().toString(), 
      symbol: "", 
      percentage: 0 
    }]);
  };

  const removeTargetAllocation = (id: string) => {
    if (targetAllocations.length === 1) {
      toast({
        title: "تحذير",
        description: "يجب أن يكون هناك عملة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    setTargetAllocations(targetAllocations.filter(t => t.id !== id));
  };

  const updateTargetAllocation = (id: string, field: string, value: string | number) => {
    setTargetAllocations(targetAllocations.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Fetch Balances and Prices
  const fetchBalances = async () => {
    const hasValidBTC = btcWallets.some(w => w.address.trim() !== "");
    const hasValidPolygon = polygonWallets.some(w => w.address.trim() !== "");
    
    if (!hasValidBTC && !hasValidPolygon) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عناوين المحافظ أولاً",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch BTC balances
      const updatedBTCWallets = await Promise.all(
        btcWallets.map(async (wallet) => {
          if (!wallet.address.trim()) return wallet;
          const balance = await getBTCBalance(wallet.address);
          return { ...wallet, balance };
        })
      );
      setBtcWallets(updatedBTCWallets);

      // Fetch Polygon token balances
      const updatedTokens = await Promise.all(
        tokenContracts.map(async (token) => {
          let totalBalance = 0;
          for (const wallet of polygonWallets) {
            if (!wallet.address.trim() || !token.address.trim()) continue;
            try {
              const balance = await getTokenBalance(rpcUrl, token.address, wallet.address);
              totalBalance += balance;
            } catch (error) {
              console.error(`Error fetching ${token.symbol} for ${wallet.address}:`, error);
            }
          }
          return { ...token, balance: totalBalance };
        })
      );

      // Fetch prices
      const gPrice = await getGoldPriceUSD();
      const bPrice = await getBTCPriceUSD();
      const btcGold = await getBTCInGold();
      
      setGoldPrice(gPrice);
      setBtcPrice(bPrice);
      setBtcInGold(btcGold);

      // Update token prices
      const tokensWithPrices = updatedTokens.map(token => {
        if (token.symbol === "WBTC") return { ...token, priceUSD: bPrice };
        if (token.symbol === "PAXG") return { ...token, priceUSD: gPrice };
        if (token.symbol === "USDT" || token.symbol === "USDC" || token.symbol === "DAI") return { ...token, priceUSD: 1 };
        return token;
      });

      setTokenContracts(tokensWithPrices);

      toast({
        title: "تم بنجاح",
        description: "تم جلب الأرصدة والأسعار",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "فشل في جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalBTCBalance = btcWallets.reduce((sum, w) => sum + w.balance, 0);
  const totalWBTCBalance = tokenContracts.find(t => t.symbol === "WBTC")?.balance || 0;
  const totalBTCIncludingWBTC = totalBTCBalance + totalWBTCBalance;
  const totalBTCInUSD = totalBTCIncludingWBTC * btcPrice;

  // جمع أرصدة USD (USDT + USDC + DAI)
  const totalUSDBalance = tokenContracts
    .filter(t => t.symbol === "USDT" || t.symbol === "USDC" || t.symbol === "DAI")
    .reduce((sum, t) => sum + t.balance, 0);

  const tokenTotalsInUSD = tokenContracts.map(token => ({
    symbol: token.symbol,
    balance: token.balance,
    valueUSD: token.balance * token.priceUSD
  }));

  // Calculate total portfolio - exclude WBTC from tokens since it's already in totalBTCInUSD
  const totalTokensUSDExcludingWBTC = tokenTotalsInUSD
    .filter(t => t.symbol !== "WBTC")
    .reduce((sum, t) => sum + t.valueUSD, 0);
  
  const totalPortfolioUSD = totalBTCInUSD + totalTokensUSDExcludingWBTC;
  const totalPortfolioBTC = btcPrice > 0 ? totalPortfolioUSD / btcPrice : 0;
  const totalPortfolioGold = goldPrice > 0 ? totalPortfolioUSD / goldPrice : 0;

  const totalAllocatedPercentage = targetAllocations.reduce((sum, t) => sum + t.percentage, 0);

  // Calculate Rebalance Function
  const calculateRebalance = async () => {
    if (totalAllocatedPercentage !== 100) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون مجموع النسب 100%",
        variant: "destructive",
      });
      return;
    }

    // إظهار رسالة تنبيه بأنه جاري جلب الأرصدة
    toast({
      title: "جاري جلب البيانات",
      description: "يتم الآن جلب الأرصدة والأسعار قبل حساب إعادة التوازن...",
    });
    
    setLoading(true);
    
    let updatedBTCWallets;
    let tokensWithPrices;
    let bPrice = 0;
    let gPrice = 0;
    
    try {
      // Fetch BTC balances
      updatedBTCWallets = await Promise.all(
        btcWallets.map(async (wallet) => {
          if (!wallet.address.trim()) return wallet;
          const balance = await getBTCBalance(wallet.address);
          return { ...wallet, balance };
        })
      );
      setBtcWallets(updatedBTCWallets);

      // Fetch Polygon token balances
      const updatedTokens = await Promise.all(
        tokenContracts.map(async (token) => {
          let totalBalance = 0;
          for (const wallet of polygonWallets) {
            if (!wallet.address.trim() || !token.address.trim()) continue;
            try {
              const balance = await getTokenBalance(rpcUrl, token.address, wallet.address);
              totalBalance += balance;
            } catch (error) {
              console.error(`Error fetching ${token.symbol} for ${wallet.address}:`, error);
            }
          }
          return { ...token, balance: totalBalance };
        })
      );

      // Fetch prices
      gPrice = await getGoldPriceUSD();
      bPrice = await getBTCPriceUSD();
      const btcGold = await getBTCInGold();
      
      setGoldPrice(gPrice);
      setBtcPrice(bPrice);
      setBtcInGold(btcGold);

      // Update token prices
      tokensWithPrices = updatedTokens.map(token => {
        if (token.symbol === "WBTC") return { ...token, priceUSD: bPrice };
        if (token.symbol === "PAXG") return { ...token, priceUSD: gPrice };
        if (token.symbol === "USDT" || token.symbol === "USDC" || token.symbol === "DAI") return { ...token, priceUSD: 1 };
        return token;
      });

      setTokenContracts(tokensWithPrices);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب البيانات",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    setLoading(false);

    // الآن نحسب إعادة التوازن باستخدام البيانات المُجلبة مباشرة
    const totalBTC = updatedBTCWallets.reduce((sum, w) => sum + w.balance, 0);
    const totalWBTC = tokensWithPrices.find(t => t.symbol === "WBTC")?.balance || 0;
    const totalBTCCombined = totalBTC + totalWBTC;
    const btcValueUSD = totalBTCCombined * bPrice;

    const tokenTotals = tokensWithPrices.map(token => ({
      symbol: token.symbol,
      balance: token.balance,
      valueUSD: token.balance * token.priceUSD
    }));

    const totalTokensUSDExcludingWBTC = tokenTotals
      .filter(t => t.symbol !== "WBTC")
      .reduce((sum, t) => sum + t.valueUSD, 0);
    
    const portfolioUSD = btcValueUSD + totalTokensUSDExcludingWBTC;

    const results: RebalanceResult[] = [];

    targetAllocations.forEach(allocation => {
      const targetPercentage = allocation.percentage;
      const targetValueUSD = (portfolioUSD * targetPercentage) / 100;

      let currentBalance = 0;
      let currentValueUSD = 0;
      let priceUSD = 0;

      // Handle BTC (including WBTC)
      if (allocation.symbol === "BTC") {
        currentBalance = totalBTCCombined;
        priceUSD = bPrice;
        currentValueUSD = btcValueUSD;
      } else if (allocation.symbol === "USD") {
        // Handle USD as combined stablecoins (USDT + USDC + DAI)
        const usdTokens = tokensWithPrices.filter(t => 
          t.symbol === "USDT" || t.symbol === "USDC" || t.symbol === "DAI"
        );
        currentBalance = usdTokens.reduce((sum, t) => sum + t.balance, 0);
        priceUSD = 1;
        currentValueUSD = currentBalance;
      } else if (allocation.symbol === "GOLD") {
        // Handle GOLD as PAXG
        const paxgToken = tokensWithPrices.find(t => t.symbol === "PAXG");
        if (paxgToken) {
          currentBalance = paxgToken.balance;
          priceUSD = paxgToken.priceUSD;
          currentValueUSD = paxgToken.balance * paxgToken.priceUSD;
        }
      } else {
        // Handle other tokens
        const token = tokensWithPrices.find(t => t.symbol === allocation.symbol);
        if (token) {
          currentBalance = token.balance;
          priceUSD = token.priceUSD;
          currentValueUSD = token.balance * token.priceUSD;
        }
      }

      if (priceUSD === 0) {
        toast({
          title: "تحذير",
          description: `لا يوجد سعر للعملة ${allocation.symbol}`,
          variant: "destructive",
        });
        return;
      }

      const currentPercentage = portfolioUSD > 0 ? (currentValueUSD / portfolioUSD) * 100 : 0;
      const targetBalance = targetValueUSD / priceUSD;
      const difference = targetBalance - currentBalance;
      const differenceUSD = targetValueUSD - currentValueUSD;
      const action = difference > 0 ? "شراء" : "بيع";

      results.push({
        symbol: allocation.symbol,
        currentBalance,
        currentValueUSD,
        currentPercentage,
        targetPercentage,
        targetValueUSD,
        targetBalance,
        difference,
        differenceUSD,
        action,
      });
    });

    // حساب النسبة المثالية بنفس منطق الصفحة الرئيسية
    // بناءً على توزيع جميع الأصول الحالية الموجودة في المحفظة
    const assetBreakdown: { [key: string]: number } = {};
    
    // جمع BTC (شامل WBTC)
    if (btcValueUSD > 0) {
      assetBreakdown['BTC'] = btcValueUSD;
    }
    
    // جمع جميع التوكنات الحالية
    tokensWithPrices.forEach(token => {
      if (token.balance > 0) {
        const valueUSD = token.balance * token.priceUSD;
        // دمج USD stablecoins في فئة USD واحدة
        if (token.symbol === 'USDT' || token.symbol === 'USDC' || token.symbol === 'DAI') {
          assetBreakdown['USD'] = (assetBreakdown['USD'] || 0) + valueUSD;
        } else if (token.symbol === 'PAXG') {
          assetBreakdown['GOLD'] = (assetBreakdown['GOLD'] || 0) + valueUSD;
        } else if (token.symbol !== 'WBTC') {
          // تجاهل WBTC لأنه مدمج في BTC
          assetBreakdown[token.symbol] = (assetBreakdown[token.symbol] || 0) + valueUSD;
        }
      }
    });
    
    const assetCount = Object.keys(assetBreakdown).length;
    
    // تحديد القيمة الأساسية للحساب
    let baseValue = 0;
    if (assetCount >= 2) {
      // إذا كان هناك أصلين أو أكتر: استخدم أعلى أصل
      baseValue = Math.max(...Object.values(assetBreakdown));
    } else if (assetCount === 1) {
      // إذا كان هناك أصل واحد فقط: استخدم نصف إجمالي المحفظة
      baseValue = portfolioUSD / 2;
    }
    
    // النسبة المثالية هي 1.5% بشرط أن تكون القيمة > $5
    const threePercentOfBase = baseValue * 0.015;
    const maxDeviation = Math.max(...results.map(r => Math.abs(r.currentPercentage - r.targetPercentage)));
    
    let suitabilityMessage = "";
    
    if (threePercentOfBase >= 5) {
      // 1.5% مناسبة
      if (maxDeviation >= 1.5) {
        suitabilityMessage = `✅ نسبة الانحراف (${maxDeviation.toFixed(2)}%) مناسبة للتداول. النسبة المثالية: 1.5% فما فوق`;
      } else {
        suitabilityMessage = `⚠️ تنبيه: نسبة الانحراف (${maxDeviation.toFixed(2)}%) أقل من النسبة المثالية (1.5% فما فوق). يُفضل الانتظار لانحراف أكبر.`;
      }
    } else {
      // نحتاج نسبة أكبر لتغطية $5
      const idealPercent = (5 / baseValue) * 100;
      if (maxDeviation >= idealPercent) {
        suitabilityMessage = `✅ نسبة الانحراف (${maxDeviation.toFixed(2)}%) مناسبة للتداول. النسبة المثالية: ${idealPercent.toFixed(2)}% فما فوق (لتغطية $5)`;
      } else {
        suitabilityMessage = `⚠️ تنبيه: نسبة الانحراف (${maxDeviation.toFixed(2)}%) أقل من النسبة المثالية (${idealPercent.toFixed(2)}% فما فوق لتغطية $5). قد تكون رسوم التداول غير مجزية.`;
      }
    }

    setRebalanceResults({ results, suitabilityMessage });
    
    toast({
      title: "تم الحساب",
      description: "تم حساب إعادة التوازن بنجاح",
    });
    
    // الانتقال إلى نتائج الحساب بشكل سلس
    setTimeout(() => {
      document.getElementById('rebalance-results')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <TrendingUp className="h-6 w-6 text-primary" />
                إعادة التوازن
              </h1>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* RPC Configuration & Token Contracts - Collapsible */}
        <Collapsible>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">إعدادات RPC وعقود التوكنات</CardTitle>
                  <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* RPC URL */}
                <div>
                  <Label htmlFor="rpc" className="text-sm font-semibold">Polygon RPC URL</Label>
                  <Input
                    id="rpc"
                    value={rpcUrl}
                    onChange={(e) => setRpcUrl(e.target.value)}
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                {/* Token Contracts Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold">عقود التوكنات على Polygon</Label>
                    <Button 
                      onClick={addTokenContract} 
                      size="sm" 
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة عقد
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {tokenContracts.map((token, index) => (
                      <div key={token.id} className="border border-border/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">عقد {index + 1}</Label>
                          {tokenContracts.length > 1 && (
                            <Button 
                              onClick={() => removeTokenContract(token.id)} 
                              size="sm" 
                              variant="ghost"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">اسم العملة</Label>
                            <Input
                              value={token.name}
                              onChange={(e) => updateTokenContract(token.id, "name", e.target.value)}
                              placeholder="Tether USD"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">الرمز</Label>
                            <Input
                              value={token.symbol}
                              onChange={(e) => updateTokenContract(token.id, "symbol", e.target.value)}
                              placeholder="USDT"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">عنوان العقد</Label>
                            <Input
                              value={token.address}
                              onChange={(e) => updateTokenContract(token.id, "address", e.target.value)}
                              placeholder="0x..."
                              className="mt-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Polygon Wallets */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-500" />
                محافظ Polygon
              </CardTitle>
              <Button onClick={addPolygonWallet} size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إضافة محفظة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {polygonWallets.map((wallet, index) => (
              <div key={wallet.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">محفظة {index + 1}</Label>
                  <Input
                    value={wallet.address}
                    onChange={(e) => updatePolygonWallet(wallet.id, e.target.value)}
                    placeholder="0x..."
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                {polygonWallets.length > 1 && (
                  <Button 
                    onClick={() => removePolygonWallet(wallet.id)} 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive mt-5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* BTC Wallets */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-orange-500" />
                محافظ البيتكوين
              </CardTitle>
              <Button onClick={addBTCWallet} size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إضافة محفظة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {btcWallets.map((wallet, index) => (
              <div key={wallet.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">محفظة {index + 1}</Label>
                  <Input
                    value={wallet.address}
                    onChange={(e) => updateBTCWallet(wallet.id, e.target.value)}
                    placeholder="bc1p..."
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                {btcWallets.length > 1 && (
                  <Button 
                    onClick={() => removeBTCWallet(wallet.id)} 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive mt-5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fetch Button */}
        <Button 
          onClick={fetchBalances} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary"
          size="lg"
        >
          <RefreshCw className={`h-5 w-5 ml-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'جاري الجلب...' : 'جلب الأرصدة والأسعار'}
        </Button>

        {/* Current Balances - Detailed View */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              الأرصدة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Individual BTC Wallets */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-orange-500">محافظ البيتكوين</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {btcWallets.map((wallet, index) => (
                  <div key={wallet.id} className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                    <p className="text-xs text-muted-foreground mb-1">محفظة {index + 1}</p>
                    <p className="text-base font-bold text-orange-500">{wallet.balance.toFixed(8)} BTC</p>
                    <p className="text-xs text-muted-foreground mt-1">${(wallet.balance * btcPrice).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Token Balances */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-purple-500">التوكنات على Polygon</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* عرض USD المجمع (USDT + USDC + DAI) */}
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <p className="text-xs text-muted-foreground mb-1">USD (USDT+USDC+DAI)</p>
                  <p className="text-base font-bold text-purple-500">
                    {totalUSDBalance.toFixed(6)} USD
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">${totalUSDBalance.toFixed(2)}</p>
                </div>
                
                {/* عرض باقي التوكنات (WBTC, PAXG, إلخ) */}
                {tokenContracts
                  .filter(token => token.symbol !== "USDT" && token.symbol !== "USDC" && token.symbol !== "DAI")
                  .map((token) => (
                    <div key={token.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-1">{token.symbol || "N/A"}</p>
                      <p className="text-base font-bold text-purple-500">
                        {token.balance.toFixed(6)} {token.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">${(token.balance * token.priceUSD).toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Total BTC Including WBTC */}
            <div>
              <h3 className="text-sm font-semibold mb-3">إجماليات البيتكوين</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground mb-1">إجمالي BTC</p>
                  <p className="text-xl font-bold text-orange-500">{totalBTCBalance.toFixed(8)} BTC</p>
                  <p className="text-xs text-muted-foreground mt-1">${(totalBTCBalance * btcPrice).toFixed(2)}</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground mb-1">إجمالي WBTC</p>
                  <p className="text-xl font-bold text-orange-500">{totalWBTCBalance.toFixed(8)} WBTC</p>
                  <p className="text-xs text-muted-foreground mt-1">${(totalWBTCBalance * btcPrice).toFixed(2)}</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground mb-1">الإجمالي الكلي (BTC+WBTC)</p>
                  <p className="text-xl font-bold text-orange-500">{totalBTCIncludingWBTC.toFixed(8)} BTC</p>
                  <p className="text-xs text-muted-foreground mt-1">${totalBTCInUSD.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* All Assets in USD - ترتيب تنازلي */}
            <div>
              <h3 className="text-sm font-semibold mb-3">إجمالي كل الأصول بالدولار</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* جمع كل الأصول في مصفوفة واحدة وترتيبها */}
                {[
                  { symbol: 'BTC (شامل WBTC)', valueUSD: totalBTCInUSD },
                  { symbol: 'USD (USDT+USDC+DAI)', valueUSD: totalUSDBalance },
                  ...tokenTotalsInUSD
                    .filter(t => t.symbol !== "WBTC" && t.symbol !== "USDT" && t.symbol !== "USDC" && t.symbol !== "DAI")
                    .map(t => ({ symbol: t.symbol, valueUSD: t.valueUSD }))
                ]
                  .sort((a, b) => b.valueUSD - a.valueUSD)
                  .map((asset) => (
                    <div key={asset.symbol} className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <p className="text-xs text-muted-foreground mb-1">{asset.symbol}</p>
                      <p className="text-lg font-bold text-green-500">${asset.valueUSD.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Grand Totals */}
            <div>
              <h3 className="text-sm font-semibold mb-3">الإجماليات الكلية</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                  <p className="text-xs text-muted-foreground mb-1">المجموع بالدولار</p>
                  <p className="text-2xl font-bold text-secondary">${totalPortfolioUSD.toFixed(2)}</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground mb-1">المجموع بالبيتكوين</p>
                  <p className="text-2xl font-bold text-orange-500">{totalPortfolioBTC.toFixed(8)} BTC</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">المجموع بالذهب</p>
                  <p className="text-2xl font-bold text-primary">{totalPortfolioGold.toFixed(6)} GOLD</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Allocations */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                النسب المستهدفة
              </CardTitle>
              <Button onClick={addTargetAllocation} size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إضافة عملة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {targetAllocations.map((allocation, index) => (
              <div key={allocation.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs">رمز العملة</Label>
                  <Input
                    value={allocation.symbol}
                    onChange={(e) => updateTargetAllocation(allocation.id, "symbol", e.target.value)}
                    placeholder="Coin"
                    className="mt-1"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">النسبة %</Label>
                  <Input
                    type="number"
                    value={allocation.percentage}
                    onChange={(e) => updateTargetAllocation(allocation.id, "percentage", Number(e.target.value))}
                    min="0"
                    max="100"
                    className="mt-1"
                  />
                </div>
                {targetAllocations.length > 1 && (
                  <Button 
                    onClick={() => removeTargetAllocation(allocation.id)} 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive mt-5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className={`text-sm font-semibold ${totalAllocatedPercentage === 100 ? 'text-green-500' : 'text-destructive'}`}>
              المجموع: {totalAllocatedPercentage}% {totalAllocatedPercentage !== 100 && "(يجب أن يكون 100%)"}
            </div>
          </CardContent>
        </Card>

        {/* Calculate Rebalance Button */}
        <Button 
          onClick={calculateRebalance}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          size="lg"
        >
          <Calculator className="h-5 w-5 ml-2" />
          احسب إعادة التوازن
        </Button>

        {/* Rebalance Results */}
        {rebalanceResults && (
          <Card id="rebalance-results" className="border-primary/30 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                نتائج إعادة التوازن
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* رسالة ملاءمة نسبة الانحراف */}
              <div className={`mb-6 p-4 rounded-lg ${rebalanceResults.suitabilityMessage.includes('✅') ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                <p className={`text-sm font-medium ${rebalanceResults.suitabilityMessage.includes('✅') ? 'text-green-500' : 'text-yellow-500'}`}>
                  {rebalanceResults.suitabilityMessage}
                </p>
              </div>

              <div className="grid gap-4">
                {rebalanceResults.results.map((result, index) => (
                  <div key={index} className="border border-border/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{result.symbol}</h4>
                      <span className={`text-sm font-semibold ${result.action === 'شراء' ? 'text-green-500' : 'text-orange-500'}`}>
                        {result.action}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                        <p className="text-base font-semibold">{result.currentBalance.toFixed(6)} {result.symbol}</p>
                        <p className="text-xs text-muted-foreground">${result.currentValueUSD.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الرصيد المستهدف</p>
                        <p className="text-base font-semibold">{result.targetBalance.toFixed(6)} {result.symbol}</p>
                        <p className="text-xs text-muted-foreground">${result.targetValueUSD.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="bg-secondary/20 rounded-lg p-3 border border-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">المطلوب {result.action}</p>
                      <p className="text-xl font-bold text-secondary">
                        {Math.abs(result.difference).toFixed(6)} {result.symbol}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${Math.abs(result.differenceUSD).toFixed(2)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">النسبة الحالية</p>
                        <p className="font-semibold">{result.currentPercentage.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">نسبة الانحراف</p>
                        <p className={`font-bold ${(result.currentPercentage - result.targetPercentage) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(result.currentPercentage - result.targetPercentage) >= 0 ? '+' : ''}{(result.currentPercentage - result.targetPercentage).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">النسبة المستهدفة</p>
                        <p className="font-semibold">{result.targetPercentage.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-primary/30 mt-6">
                <h4 className="font-bold text-base mb-2">ملخص العملية</h4>
                <p className="text-sm text-muted-foreground">
                  إجمالي قيمة المحفظة: <span className="font-bold text-foreground">${totalPortfolioUSD.toFixed(2)}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  عدد العمليات المطلوبة: <span className="font-bold text-foreground">{rebalanceResults.results.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
