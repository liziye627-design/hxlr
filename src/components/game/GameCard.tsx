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
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 filter saturate-110 contrast-105"
        />
        <div className="absolute inset-0 transition-all duration-300 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/50" />
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between text-white">
          <h3 className="text-base font-semibold line-clamp-1">{title}</h3>
          {difficulty && (
            <Badge className="bg-card/90 backdrop-blur-sm">{difficulty}</Badge>
          )}
        </div>
        {isPremium && (
          <Badge className="absolute top-3 right-3 gradient-bg-primary border-0">
            <Star className="w-3 h-3 mr-1" />
            VIP
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
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
          <Button className="w-full gradient-bg-primary border-0 hover:opacity-90">开始游戏</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
