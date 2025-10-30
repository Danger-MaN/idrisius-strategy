import { MarketIndicator } from "@/components/MarketIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Globe, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function Markets() {
  // Mock data - في التطبيق الحقيقي، سيتم جلب البيانات من yfinance API
  const markets = [
    { name: "S&P 500", daily: 0.45, weekly: 2.1, monthly: 5.3, yearly: 12.5 },
    { name: "NASDAQ", daily: -0.32, weekly: 1.8, monthly: 6.7, yearly: 18.2 },
    { name: "Dow Jones", daily: 0.67, weekly: 1.5, monthly: 4.2, yearly: 9.8 },
    { name: "DAX (ألمانيا)", daily: 0.21, weekly: -0.8, monthly: 3.1, yearly: 7.4 },
    { name: "FTSE 100 (بريطانيا)", daily: -0.15, weekly: 0.9, monthly: 2.5, yearly: 5.2 },
    { name: "Nikkei 225 (اليابان)", daily: 0.88, weekly: 3.2, monthly: 7.8, yearly: 15.6 },
    { name: "Bitcoin", daily: -1.5, weekly: 5.2, monthly: 12.8, yearly: 45.3 },
    { name: "Ethereum", daily: -2.1, weekly: 4.8, monthly: 15.2, yearly: 52.7 },
    { name: "الذهب", daily: 0.12, weekly: 0.8, monthly: 2.1, yearly: 8.5 },
    { name: "الفضة", daily: -0.25, weekly: 1.2, monthly: 3.8, yearly: 12.3 },
    { name: "النفط الخام", daily: 1.2, weekly: -2.5, monthly: -5.8, yearly: -8.2 },
    { name: "مؤشر الدولار", daily: -0.08, weekly: -0.4, monthly: -1.2, yearly: -3.5 },
  ];

  const topGainers = markets.sort((a, b) => (b.daily || 0) - (a.daily || 0)).slice(0, 5);
  const topLosers = markets.sort((a, b) => (a.daily || 0) - (b.daily || 0)).slice(0, 5);

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
                <Globe className="h-6 w-6 text-primary" />
                الأسواق العالمية
              </h1>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards - يومي */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">أداء السوق اليومي</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                  <TrendingUp className="h-5 w-5" />
                  أعلى صعود يومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (b.daily || 0) - (a.daily || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-green-500">
                        +{Math.abs(market.daily || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                  <TrendingDown className="h-5 w-5" />
                  أعلى هبوط يومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (a.daily || 0) - (b.daily || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-red-500">
                        {(market.daily || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                  <TrendingUp className="h-5 w-5" />
                  الأكثر استقرارًا يوميًا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets
                    .sort((a, b) => Math.abs(a.daily || 0) - Math.abs(b.daily || 0))
                    .slice(0, 5)
                    .map((market, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{market.name}</span>
                        <span className="text-sm font-semibold text-blue-500">
                          {market.daily && market.daily > 0 ? '+' : ''}{(market.daily || 0).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Cards - أسبوعي */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">أداء السوق الأسبوعي</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                  <TrendingUp className="h-5 w-5" />
                  أعلى صعود أسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (b.weekly || 0) - (a.weekly || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-green-500">
                        +{Math.abs(market.weekly || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                  <TrendingDown className="h-5 w-5" />
                  أعلى هبوط أسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (a.weekly || 0) - (b.weekly || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-red-500">
                        {(market.weekly || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                  <TrendingUp className="h-5 w-5" />
                  الأكثر استقرارًا أسبوعيًا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets
                    .sort((a, b) => Math.abs(a.weekly || 0) - Math.abs(b.weekly || 0))
                    .slice(0, 5)
                    .map((market, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{market.name}</span>
                        <span className="text-sm font-semibold text-blue-500">
                          {market.weekly && market.weekly > 0 ? '+' : ''}{(market.weekly || 0).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Cards - شهري */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">أداء السوق الشهري</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                  <TrendingUp className="h-5 w-5" />
                  أعلى صعود شهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (b.monthly || 0) - (a.monthly || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-green-500">
                        +{Math.abs(market.monthly || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                  <TrendingDown className="h-5 w-5" />
                  أعلى هبوط شهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (a.monthly || 0) - (b.monthly || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-red-500">
                        {(market.monthly || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                  <TrendingUp className="h-5 w-5" />
                  الأكثر استقرارًا شهريًا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets
                    .sort((a, b) => Math.abs(a.monthly || 0) - Math.abs(b.monthly || 0))
                    .slice(0, 5)
                    .map((market, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{market.name}</span>
                        <span className="text-sm font-semibold text-blue-500">
                          {market.monthly && market.monthly > 0 ? '+' : ''}{(market.monthly || 0).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Cards - سنوي */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">أداء السوق السنوي</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                  <TrendingUp className="h-5 w-5" />
                  أعلى صعود سنوي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (b.yearly || 0) - (a.yearly || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-green-500">
                        +{Math.abs(market.yearly || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                  <TrendingDown className="h-5 w-5" />
                  أعلى هبوط سنوي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets.sort((a, b) => (a.yearly || 0) - (b.yearly || 0)).slice(0, 5).map((market, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{market.name}</span>
                      <span className="text-sm font-semibold text-red-500">
                        {(market.yearly || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                  <TrendingUp className="h-5 w-5" />
                  الأكثر استقرارًا سنويًا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {markets
                    .sort((a, b) => Math.abs(a.yearly || 0) - Math.abs(b.yearly || 0))
                    .slice(0, 5)
                    .map((market, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{market.name}</span>
                        <span className="text-sm font-semibold text-blue-500">
                          {market.yearly && market.yearly > 0 ? '+' : ''}{(market.yearly || 0).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Markets */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">جميع الأسواق</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market, index) => (
              <MarketIndicator
                key={index}
                name={market.name}
                daily={market.daily}
                weekly={market.weekly}
                monthly={market.monthly}
                yearly={market.yearly}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
