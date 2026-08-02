import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Eye, Target, Skull, Shield, Zap } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface ActionConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    targetName?: string;
    actionType: 'check' | 'kill' | 'heal' | 'poison' | 'vote' | 'shoot';
}

export const ActionConfirmDialog: React.FC<ActionConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    targetName,
    actionType
}) => {
    const getActionIcon = () => {
        switch (actionType) {
            case 'check': return <Eye className="w-8 h-8 text-cyan-400" />;
            case 'kill':
            case 'poison': return <Skull className="w-8 h-8 text-red-500" />;
            case 'heal': return <Shield className="w-8 h-8 text-green-400" />;
            case 'shoot': return <Target className="w-8 h-8 text-orange-500" />;
            default: return <Zap className="w-8 h-8 text-purple-400" />;
        }
    };

    const getActionColor = () => {
        switch (actionType) {
            case 'check': return 'cyan';
            case 'kill':
            case 'poison': return 'red';
            case 'heal': return 'green';
            case 'shoot': return 'orange';
            default: return 'purple';
        }
    };

    const color = getActionColor();

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <DialogPrimitive.Portal forceMount>
                        <DialogPrimitive.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            />
                        </DialogPrimitive.Overlay>
                        <DialogPrimitive.Content asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%]"
                            >
                                <div className={`
                  relative overflow-hidden rounded-xl bg-slate-900/90 border-2 
                  border-${color}-500 shadow-[0_0_30px_rgba(var(--${color}-rgb),0.3)]
                `}>
                                    {/* Decorative Header Line */}
                                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${color}-500 to-transparent`} />

                                    {/* Content */}
                                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                                        {/* Icon Halo */}
                                        <div className="relative">
                                            <div className={`absolute inset-0 bg-${color}-500/20 blur-xl rounded-full`} />
                                            <div className={`
                        relative w-16 h-16 rounded-full border-2 border-${color}-400/50 
                        bg-slate-800/50 flex items-center justify-center
                        shadow-[0_0_15px_rgba(var(--${color}-rgb),0.4)]
                      `}>
                                                {getActionIcon()}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
                                            {targetName && (
                                                <div className={`text-lg font-mono font-bold text-${color}-400`}>
                                                    {targetName}
                                                </div>
                                            )}
                                            {description && (
                                                <p className="text-xs text-slate-400 uppercase tracking-widest">{description}</p>
                                            )}
                                        </div>

                                        {/* Action Slider / Confirmation Area */}
                                        <div className="w-full pt-4 flex gap-3">
                                            <Button
                                                onClick={onConfirm}
                                                className={`flex-1 bg-${color}-600 hover:bg-${color}-500 text-white border border-${color}-400 shadow-[0_0_15px_rgba(var(--${color}-rgb),0.4)]`}
                                            >
                                                CONFIRM
                                            </Button>
                                            <Button
                                                onClick={onClose}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600"
                                            >
                                                CANCEL
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    );
};
