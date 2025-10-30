import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioCardProps {
  title: string;
  amount: string;
  usdValue: string;
  icon: React.ReactNode;
  change?: number;
}

export function PortfolioCard({ title, amount, usdValue, icon, change }: PortfolioCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{amount}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{usdValue}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(change).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
