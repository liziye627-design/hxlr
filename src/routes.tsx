import type { ReactNode } from 'react';
import Partner from './pages/Partner';
import Play from './pages/Play';
import Chat from './pages/Chat';
import TeammateSelect from './pages/TeammateSelect';
import TeammateSelectV2 from './pages/TeammateSelectV2';
import AvatarStage from './pages/AvatarStage';
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
import ScriptUpload from './pages/jubensha/ScriptUpload';
import Adventure from './pages/Adventure';
import Rankings from './pages/Rankings';

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
    element: <Partner />,
    visible: true,
  },
  {
    name: '首页',
    path: '/partner',
    element: <Partner />,
    visible: true,
  },
  {
    name: '玩法',
    path: '/play',
    element: <Play />,
    visible: true,
  },
  {
    name: '队友',
    path: '/chat',
    element: <TeammateSelect />,
    visible: true,
  },
  {
    name: '队友V2',
    path: '/chat/v2',
    element: <TeammateSelectV2 />,
    visible: true,
  },
  {
    name: '对话',
    path: '/chat/room',
    element: <Chat />,
    visible: false,
  },
  {
    name: '形象馆',
    path: '/avatar-stage',
    element: <AvatarStage />,
    visible: false,
  },
  {
    name: '旧首页',
    path: '/home-old',
    element: <Home />,
    visible: false,
  },
  {
    name: '旧陪玩页',
    path: '/companions-old',
    element: <Companions />,
    visible: false,
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
    name: '狼人杀旧版1',
    path: '/werewolf/old/v1',
    element: <Werewolf />,
    visible: false,
  },
  {
    name: '狼人杀旧版2',
    path: '/werewolf/old/v2',
    element: <WerewolfGameView />,
    visible: false,
  },
  {
    name: '狼人杀旧版3',
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
    name: '上传剧本',
    path: '/script-murder/upload',
    element: <ScriptUpload />,
    visible: false,
  },
  {
    name: '剧本杀',
    path: '/script-murder',
    element: <JubenshaLobby />,
    visible: true,
  },
  {
    name: '剧本杀旧入口',
    path: '/jubensha',
    element: <JubenshaLobby />,
    visible: false,
  },
  {
    name: 'Minecraft',
    path: '/minecraft',
    element: <Adventure />,
    visible: false,
  },
  {
    name: 'Minecraft Legacy',
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
