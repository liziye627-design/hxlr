import { motion } from 'framer-motion';

interface Character {
    id: string;
    name: string;
    role: string;
    avatar: string;
}

interface CharacterPanelProps {
    characters: Character[];
    selectedCharacterId: string | null;
    onSelectCharacter: (characterId: string) => void;
}

export function CharacterPanel({ characters, selectedCharacterId, onSelectCharacter }: CharacterPanelProps) {
    return (
        <div className="p-4 bg-white/5 backdrop-blur-sm border-b border-white/10">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                剧本角色
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {characters.map((character) => (
                    <motion.button
                        key={character.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCharacter(character.id)}
                        className={`
              relative group cursor-pointer rounded-xl overflow-hidden
              transition-all duration-200
              ${selectedCharacterId === character.id
                                ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black/50'
                                : 'ring-1 ring-white/20 hover:ring-purple-400/50'
                            }
            `}
                    >
                        <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                            <img
                                src={character.avatar || '/default-avatar.png'}
                                alt={character.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Selected indicator */}
                        {selectedCharacterId === character.id && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white animate-pulse" />
                        )}

                        {/* Name overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/70 backdrop-blur-sm">
                            <p className="text-white text-xs font-medium truncate text-center">
                                {character.name}
                            </p>
                            <p className="text-gray-400 text-[10px] truncate text-center">
                                {character.role}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
