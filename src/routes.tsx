import Home from './pages/Home';
import Companions from './pages/Companions';
import Werewolf from './pages/Werewolf';
import ScriptMurder from './pages/ScriptMurder';
import Adventure from './pages/Adventure';
import Rankings from './pages/Rankings';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <Home />,
    visible: true,
  },
  {
    name: 'AI伴侣',
    path: '/companions',
    element: <Companions />,
    visible: true,
  },
  {
    name: '狼人杀',
    path: '/werewolf',
    element: <Werewolf />,
    visible: false,
  },
  {
    name: '剧本杀',
    path: '/script-murder',
    element: <ScriptMurder />,
    visible: false,
  },
  {
    name: '数字冒险',
    path: '/adventure',
    element: <Adventure />,
    visible: false,
  },
  {
    name: '排行榜',
    path: '/rankings',
    element: <Rankings />,
    visible: true,
  },
];

export default routes;