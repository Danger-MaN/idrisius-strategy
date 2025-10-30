import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketIndicatorProps {
  name: string;
  daily?: number;
  weekly?: number;
  monthly?: number;
  yearly?: number;
}

function ChangeIndicator({ value }: { value?: number }) {
  if (value === undefined || isNaN(value)) {
    return <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" /> N/A</span>;
  }
  
  const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-muted-foreground';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  
  return (
    <span className={`${color} flex items-center gap-1 text-sm font-medium`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function MarketIndicator({ name, daily, weekly, monthly, yearly }: MarketIndicatorProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all">
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-3 text-sm">{name}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">يومي</p>
            <ChangeIndicator value={daily} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">أسبوعي</p>
            <ChangeIndicator value={weekly} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">شهري</p>
            <ChangeIndicator value={monthly} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">سنوي</p>
            <ChangeIndicator value={yearly} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
