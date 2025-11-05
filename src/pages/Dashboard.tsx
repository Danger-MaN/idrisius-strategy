import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Coins, Wallet, TrendingUp, AlertCircle, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getTokenBalance, getBTCBalance, getGoldPriceUSD, getBTCPriceUSD, getHistoricalBTCPrices, getHistoricalGoldPrices, type HistoricalPrice } from "@/lib/web3Utils";

interface TokenContract {
  name: string;
  symbol: string;
  address: string;
}

export default function Dashboard() {
  const [btcAddresses, setBtcAddresses] = useState<string[]>([]);
  const [polygonAddresses, setPolygonAddresses] = useState<string[]>([]);
  const [tokenContracts, setTokenContracts] = useState<TokenContract[]>([]);
  const [rpcUrl, setRpcUrl] = useState("");
  const [hasWallets, setHasWallets] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // البيانات الحالية
  const [totalPortfolioUSD, setTotalPortfolioUSD] = useState(0);
  const [totalPortfolioBTC, setTotalPortfolioBTC] = useState(0);
  const [totalPortfolioGold, setTotalPortfolioGold] = useState(0);
  const [optimalDeviation, setOptimalDeviation] = useState("");
  const [assetBreakdown, setAssetBreakdown] = useState<{ [key: string]: number }>({});
  
  // بيانات الرسم البياني التاريخي
  const [chartData, setChartData] = useState<Array<{ date: string, value: number, timestamp: number }>>([]);
  const [chartLoading, setChartLoading] = useState(false);
  
  // كميات الأصول من المحفظة
  const [btcAmount, setBtcAmount] = useState(0);
  const [goldAmount, setGoldAmount] = useState(0);
  
  // إحصائيات النمو
  const [growthStats, setGrowthStats] = useState({
    weekly: 0,
    monthly: 0,
    quarterly: 0,
    semiAnnual: 0,
    nineMonths: 0,
    yearly: 0
  });

  useEffect(() => {
    // تحميل العناوين من localStorage
    const btcWalletsData = JSON.parse(localStorage.getItem('btcWallets') || '[]');
    const polygonWalletsData = JSON.parse(localStorage.getItem('polygonWallets') || '[]');
    const loadedTokenContracts = JSON.parse(localStorage.getItem('tokenContracts') || '[]');
    const loadedRpcUrl = localStorage.getItem('rpcUrl') || '';

    // استخراج العناوين فقط من كائنات المحافظ
    const loadedBtcAddresses = btcWalletsData
      .map((w: any) => w.address)
      .filter((addr: string) => addr && addr.trim());
    
    const loadedPolygonAddresses = polygonWalletsData
      .map((w: any) => w.address)
      .filter((addr: string) => addr && addr.trim());

    setBtcAddresses(loadedBtcAddresses);
    setPolygonAddresses(loadedPolygonAddresses);
    setTokenContracts(loadedTokenContracts);
    setRpcUrl(loadedRpcUrl);

    const walletsExist = loadedBtcAddresses.length > 0 || loadedPolygonAddresses.length > 0;
    setHasWallets(walletsExist);

    if (walletsExist) {
      fetchPortfolioData(loadedBtcAddresses, loadedPolygonAddresses, loadedTokenContracts, loadedRpcUrl);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchPortfolioData = async (
    btcAddrs: string[],
    polygonAddrs: string[],
    tokens: TokenContract[],
    rpc: string
  ) => {
    setLoading(true);
    try {
      const goldPrice = await getGoldPriceUSD();
      const btcPrice = await getBTCPriceUSD();

      let totalUSD = 0;
      const breakdown: { [key: string]: number } = {};
      let totalBTC = 0;
      let totalGold = 0;

      // جلب أرصدة البيتكوين
      for (const addr of btcAddrs) {
        if (addr.trim()) {
          const balance = await getBTCBalance(addr);
          totalBTC += balance;
          const valueUSD = balance * btcPrice;
          totalUSD += valueUSD;
          breakdown['BTC'] = (breakdown['BTC'] || 0) + valueUSD;
        }
      }

      // جلب أرصدة التوكينات على Polygon
      for (const addr of polygonAddrs) {
        if (addr.trim() && rpc) {
          for (const token of tokens) {
            if (token.address.trim()) {
              const balance = await getTokenBalance(rpc, token.address, addr);
              let valueUSD = 0;
              
              if (token.symbol === 'WBTC') {
                totalBTC += balance;
                valueUSD = balance * btcPrice;
                breakdown['BTC'] = (breakdown['BTC'] || 0) + valueUSD;
              } else if (token.symbol === 'PAXG') {
                totalGold += balance;
                valueUSD = balance * goldPrice;
                breakdown['GOLD'] = (breakdown['GOLD'] || 0) + valueUSD;
              } else if (token.symbol === 'USDT' || token.symbol === 'USDC' || token.symbol === 'DAI') {
                valueUSD = balance;
                breakdown['USD'] = (breakdown['USD'] || 0) + valueUSD;
              } else {
                valueUSD = balance;
                breakdown[token.symbol] = (breakdown[token.symbol] || 0) + valueUSD;
              }
              
              totalUSD += valueUSD;
            }
          }
        }
      }

      setTotalPortfolioUSD(totalUSD);
      setTotalPortfolioBTC(totalUSD / btcPrice);
      setTotalPortfolioGold(totalUSD / goldPrice);
      setAssetBreakdown(breakdown);
      setBtcAmount(totalBTC);
      setGoldAmount(totalGold);

      // حساب النسبة المثالية للانحراف بناءً على أكبر أصل
      calculateOptimalDeviation(totalUSD, breakdown);
      
      // جلب البيانات التاريخية
      if (totalBTC > 0 || totalGold > 0) {
        fetchHistoricalData(totalBTC, totalGold);
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات المحفظة:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOptimalDeviation = (portfolioValue: number, breakdown: { [key: string]: number }) => {
    const assetCount = Object.keys(breakdown).length;
    
    // تحديد القيمة الأساسية للحساب
    let baseValue = 0;
    if (assetCount >= 2) {
      // إذا كان هناك أصلين أو أكتر: استخدم أعلى أصل
      baseValue = Math.max(...Object.values(breakdown));
    } else if (assetCount === 1) {
      // إذا كان هناك أصل واحد فقط: استخدم نصف إجمالي المحفظة
      baseValue = portfolioValue / 2;
    }
    
    // النسبة المثالية هي 3% بشرط أن تكون القيمة > $5
    const threePercentOfBase = baseValue * 0.03;
    
    let deviation = "";
    if (threePercentOfBase >= 5) {
      deviation = "1.5% فما فوق";
    } else {
      // حساب النسبة المثالية التي تغطي $5
      const idealPercent = (5 / baseValue) * 100;
      deviation = `${idealPercent.toFixed(2)}% فما فوق`;
    }
    
    setOptimalDeviation(deviation);
  };

  const fetchHistoricalData = async (btc: number, gold: number) => {
    setChartLoading(true);
    try {
      const [btcHistory, goldHistory] = await Promise.all([
        getHistoricalBTCPrices(365),
        getHistoricalGoldPrices(365)
      ]);

      if (btcHistory.length === 0 && goldHistory.length === 0) {
        console.error("لم يتم جلب البيانات التاريخية");
        setChartLoading(false);
        return;
      }

      // دمج البيانات بناءً على التاريخ
      const mergedData: Array<{ date: string, value: number, timestamp: number }> = [];
      
      // استخدام أطول مصفوفة كمرجع
      const referenceHistory = btcHistory.length >= goldHistory.length ? btcHistory : goldHistory;
      
      referenceHistory.forEach((item) => {
        const date = new Date(item.timestamp);
        
        // البحث عن السعر المقابل في اليوم نفسه
        const btcPrice = btcHistory.find(
          h => new Date(h.timestamp).toDateString() === date.toDateString()
        )?.price || 0;
        
        const goldPrice = goldHistory.find(
          h => new Date(h.timestamp).toDateString() === date.toDateString()
        )?.price || 0;

        // حساب قيمة المحفظة في هذا اليوم
        const portfolioValue = (btc * btcPrice) + (gold * goldPrice);
        
        mergedData.push({
          date: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
          value: portfolioValue,
          timestamp: item.timestamp
        });
      });

      setChartData(mergedData);
      
      // حساب إحصائيات النمو
      calculateGrowthStats(mergedData);
    } catch (error) {
      console.error("خطأ في جلب البيانات التاريخية:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const calculateGrowthStats = (data: Array<{ value: number, timestamp: number }>) => {
    if (data.length === 0) return;

    const currentValue = data[data.length - 1].value;
    const now = Date.now();

    // حساب النسبة المئوية للتغير
    const getGrowth = (daysAgo: number) => {
      const targetDate = now - (daysAgo * 24 * 60 * 60 * 1000);
      const closestData = data.reduce((prev, curr) => {
        return Math.abs(curr.timestamp - targetDate) < Math.abs(prev.timestamp - targetDate) ? curr : prev;
      });
      
      if (closestData.value === 0) return 0;
      return ((currentValue - closestData.value) / closestData.value) * 100;
    };

    setGrowthStats({
      weekly: getGrowth(7),
      monthly: getGrowth(30),
      quarterly: getGrowth(90),
      semiAnnual: getGrowth(180),
      nineMonths: getGrowth(270),
      yearly: getGrowth(365)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
                إدريسيوس استراتيجي
              </h1>
            </Link>
            <div className="flex gap-2">
              <Link to="/rebalance">
                <Button variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  إعادة التوازن
                </Button>
              </Link>
              <Link to="/markets">
                <Button variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                  الأسواق العالمية
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!hasWallets ? (
          // رسالة تنبيه عند عدم وجود محافظ
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    لم يتم إضافة محافظ بعد
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    يرجى الانتقال إلى صفحة "إعادة التوازن" لإضافة عناوين محافظك لبدء تتبع أرصدتك وإدارة استثماراتك.
                  </p>
                  <Link to="/rebalance">
                    <Button className="bg-primary hover:bg-primary/90">
                      إضافة محافظ الآن
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          // حالة التحميل
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل بيانات المحفظة...</p>
          </div>
        ) : (
          <>
            {/* Total Balance Section */}
            <div className="mb-8 relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl" />
              <Card className="relative bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    إجمالي الرصيد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">بالدولار</p>
                      <p className="text-3xl font-bold text-primary">${totalPortfolioUSD.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">بالذهب</p>
                      <p className="text-3xl font-bold text-secondary">{totalPortfolioGold.toFixed(8)} GOLD</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">بالبيتكوين</p>
                      <p className="text-3xl font-bold text-orange-500">{totalPortfolioBTC.toFixed(8)} BTC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* توزيع الأصول الحالية */}
            {Object.keys(assetBreakdown).length > 0 && (
              <Card className="mb-8 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    نسبة توزيع الأصول الحالية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(assetBreakdown)
                      .filter(([_, value]) => value > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([asset, value]) => {
                        const percentage = (value / totalPortfolioUSD) * 100;
                        return (
                          <div key={asset}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-foreground">{asset}</span>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-foreground">{percentage.toFixed(2)}%</span>
                                <span className="text-xs text-muted-foreground ml-2">${value.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" 
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* مؤشر أفضل نسبة انحراف */}
            <Card className="mb-8 border-primary/30 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm animate-fade-in">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  أفضل نسبة انحراف لإعادة التوازن
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">إجمالي رصيد المحفظة:</span>
                    <span className="text-foreground font-semibold">${totalPortfolioUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">النسبة المثالية للانحراف:</span>
                    <span className="text-primary font-bold text-lg">{optimalDeviation}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    هذه النسبة محسوبة بناءً على إجمالي رصيد محفظتك لضمان أن تكون عملية إعادة التوازن مجزية وتغطي رسوم التداول.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* رسم بياني لأداء المحفظة */}
            <Card className="mb-8 animate-fade-in border-primary/20 bg-gradient-to-br from-card via-card to-card/80 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    أداء المحفظة التاريخي
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Calendar className="h-3 w-3" />
                    آخر 365 يوم
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      <p className="text-muted-foreground">جاري تحميل البيانات التاريخية...</p>
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="p-4 bg-muted/30 rounded-full inline-block">
                        <AlertCircle className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">لا توجد بيانات تاريخية متاحة</p>
                        <p className="text-xs text-muted-foreground mt-2">تأكد من إضافة محافظ تحتوي على بيتكوين أو ذهب</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={380}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '10px' }}
                          interval="preserveStartEnd"
                          minTickGap={60}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '10px' }}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                            return `$${value.toFixed(0)}`;
                          }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const date = new Date(data.timestamp);
                              const formattedDate = date.toLocaleDateString('ar-EG', { 
                                weekday: 'long',
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                              const value = payload[0].value as number;
                              
                              return (
                                <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/30 rounded-xl p-4 shadow-xl">
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-medium text-muted-foreground">{formattedDate}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-primary" />
                                      <p className="text-base font-bold text-primary">
                                        ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-border/50 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <Bitcoin className="h-3.5 w-3.5 text-orange-500" />
                                        <p className="text-xs text-muted-foreground">
                                          {btcAmount.toFixed(8)} BTC
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Coins className="h-3.5 w-3.5 text-secondary" />
                                        <p className="text-xs text-muted-foreground">
                                          {goldAmount.toFixed(6)} GOLD
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          fill="url(#colorValue)"
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            fill: 'hsl(var(--primary))',
                            stroke: 'hsl(var(--card))',
                            strokeWidth: 2
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    
                    {/* إحصائيات سريعة */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          <p className="text-xs font-medium text-muted-foreground">الحالية</p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          ${chartData[chartData.length - 1]?.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">قبل سنة</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          ${chartData[0]?.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg border ${
                        ((chartData[chartData.length - 1]?.value - chartData[0]?.value) / chartData[0]?.value * 100) >= 0 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {((chartData[chartData.length - 1]?.value - chartData[0]?.value) / chartData[0]?.value * 100) >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <p className="text-xs font-medium text-muted-foreground">التغير</p>
                        </div>
                        <p className={`text-lg font-bold ${
                          ((chartData[chartData.length - 1]?.value - chartData[0]?.value) / chartData[0]?.value * 100) >= 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {((chartData[chartData.length - 1]?.value - chartData[0]?.value) / chartData[0]?.value * 100) >= 0 ? '+' : ''}
                          {((chartData[chartData.length - 1]?.value - chartData[0]?.value) / chartData[0]?.value * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* متوسط نمو المحفظة */}
                    <div className="mt-6 p-5 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/30 rounded-xl border border-border/50">
                      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        متوسط نمو المحفظة
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {[
                          { label: 'أسبوع', value: growthStats.weekly },
                          { label: 'شهر', value: growthStats.monthly },
                          { label: '3 شهور', value: growthStats.quarterly },
                          { label: '6 شهور', value: growthStats.semiAnnual },
                          { label: '9 شهور', value: growthStats.nineMonths },
                          { label: 'سنة', value: growthStats.yearly }
                        ].map((stat, index) => (
                          <div key={index} className="text-center p-3 bg-card/50 rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">{stat.label}</p>
                            <p className={`text-sm font-bold ${
                              stat.value >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {stat.value >= 0 ? '+' : ''}{stat.value.toFixed(2)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* نبذة توضيحية */}
                    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        📊 <span className="font-semibold text-foreground">آلية الحساب:</span> يتم حساب قيمة المحفظة بناءً على كميات البيتكوين ({btcAmount.toFixed(8)} BTC) 
                        والذهب ({goldAmount.toFixed(6)} GOLD) الموجودة في محفظتك مضروبة في الأسعار التاريخية لكل يوم على مدار السنة الماضية.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
