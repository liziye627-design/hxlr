import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  players: string;
  duration: string;
  difficulty?: string;
  isPremium?: boolean;
  link: string;
}

export function GameCard({
  id,
  title,
  description,
  image,
  players,
  duration,
  difficulty,
  isPremium,
  link,
}: GameCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-primary hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {isPremium && (
          <Badge className="absolute top-3 right-3 gradient-bg-primary border-0">
            <Star className="w-3 h-3 mr-1" />
            VIP
          </Badge>
        )}
        {difficulty && (
          <Badge className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm">
            {difficulty}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-2 line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{players}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>
        
        <Link to={link}>
          <Button className="w-full gradient-bg-primary border-0 hover:opacity-90">
            开始游戏
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
