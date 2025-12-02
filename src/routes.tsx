import Home from './pages/Home';
import Companions from './pages/Companions';
import Werewolf from './pages/Werewolf';
import GameRoom from './pages/werewolf/GameRoom';
import WerewolfLobby from './pages/werewolf/WerewolfLobby';
import MultiplayerGameRoom from './pages/werewolf/MultiplayerGameRoom';
import WerewolfGameView from './pages/werewolf/WerewolfGameView';
import ReplayViewer from './pages/werewolf/ReplayViewer';
import JubenshaLobby from './pages/jubensha/JubenshaLobby';
import JubenshaGameRoom from './pages/jubensha/JubenshaGameRoom';
import ITGameRoom from './pages/jubensha/ITGameRoom';
import SchoolRulesGame from './pages/jubensha/SchoolRulesGame';
import PaydayGame from './pages/jubensha/PaydayGame';
import YandereGame from './pages/jubensha/YandereGame';
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
    element: <WerewolfLobby />,
    visible: true,
  },
  {
    name: '狼人杀游戏',
    path: '/werewolf/game',
    element: <MultiplayerGameRoom />,
    visible: false,
  },
  {
    name: '狼人杀联机',
    path: '/werewolf/multiplayer',
    element: <MultiplayerGameRoom />,
    visible: false,
  },
  {
    name: '狼人杀-旧版1',
    path: '/werewolf/old/v1',
    element: <Werewolf />,
    visible: false,
  },
  {
    name: '狼人杀-旧版2',
    path: '/werewolf/old/v2',
    element: <WerewolfGameView />,
    visible: false,
  },
  {
    name: '狼人杀-旧版3',
    path: '/werewolf/old/v3',
    element: <GameRoom />,
    visible: false,
  },
  {
    name: '狼人杀回放',
    path: '/werewolf/replay/:roomId',
    element: <ReplayViewer />,
    visible: false,
  },
  {
    name: '剧本杀游戏',
    path: '/script-murder/room/:roomId',
    element: <JubenshaGameRoom />,
    visible: false,
  },
  {
    name: '小丑回魂',
    path: '/script-murder/it',
    element: <ITGameRoom />,
    visible: false,
  },
  {
    name: '第二十二条校规',
    path: '/script-murder/school-rules',
    element: <SchoolRulesGame />,
    visible: false,
  },
  {
    name: '收获日',
    path: '/script-murder/payday',
    element: <PaydayGame />,
    visible: false,
  },
  {
    name: '病娇男孩的精分日记',
    path: '/script-murder/yandere',
    element: <YandereGame />,
    visible: false,
  },
  {
    name: '剧本杀',
    path: '/script-murder',
    element: <JubenshaLobby />,
    visible: true,
  },
  {
    name: '剧本杀(新)',
    path: '/jubensha',
    element: <JubenshaLobby />,
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
