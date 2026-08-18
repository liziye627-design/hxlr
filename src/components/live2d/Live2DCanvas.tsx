import React, { useEffect, useRef, useState, Suspense, useCallback } from 'react';

interface Live2DCanvasProps {
    modelId: string;
    className?: string;
    expression?: string;
}

const MODEL_FOLDER_MAP: Record<string, string> = {
    'shizuku': 'live2d-widget-model-shizuku',
    'miku': 'live2d-widget-model-miku',
    'haru': 'live2d-widget-model-haru',
    'koharu': 'live2d-widget-model-koharu',
    'hijiki': 'live2d-widget-model-hijiki',
    'tororo': 'live2d-widget-model-tororo',
    'unitychan': 'live2d-widget-model-unitychan',
    'izumi': 'live2d-widget-model-izumi',
    'nico': 'live2d-widget-model-nico',
};

const Live2DCanvasInner: React.FC<Live2DCanvasProps> = ({
    modelId,
    className,
    expression
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Use refs for PIXI app and model to persist across re-renders
    const appRef = useRef<any>(null);
    const modelRef = useRef<any>(null);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const getModelUrl = useCallback((id: string): string => {
        const folderName = MODEL_FOLDER_MAP[id] || `live2d-widget-model-${id}`;
        return `/live2d-models/packages/${folderName}/assets/${id}.model.json`;
    }, []);

    // Safe destroy function - always check before destroying
    const safeDestroy = useCallback(() => {
        // Destroy app only if it exists and hasn't been destroyed
        if (appRef.current) {
            try {
                // Check if the renderer still exists (destroyed apps have null renderer)
                if (appRef.current.renderer) {
                    appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                }
            } catch (e) {
                // Ignore any destruction errors - app might already be destroyed
                console.log('[Live2D] Cleanup: app already destroyed or invalid');
            }
            appRef.current = null;
        }
        modelRef.current = null;
    }, []);

    useEffect(() => {
        let isMounted = true;

        const initLive2D = async () => {
            // Skip if no canvas
            if (!canvasRef.current) {
                console.error('[Live2D] Canvas ref is null');
                return;
            }

            // Skip if already initialized (React Strict Mode protection)
            if (appRef.current) {
                console.log('[Live2D] Already initialized, skipping');
                return;
            }

            try {
                // Step 1: Import PIXI and expose to window (required by pixi-live2d-display)
                const PIXI = await import('pixi.js');
                if (!isMounted) return;

                (window as any).PIXI = PIXI;

                // Step 2: Import Live2DModel (must be after PIXI is on window)
                const { Live2DModel } = await import('pixi-live2d-display/cubism2');
                if (!isMounted) return;

                // Step 3: Get container dimensions
                const canvas = canvasRef.current;
                if (!canvas) return;

                const container = canvas.parentElement;
                const width = container?.clientWidth || 300;
                const height = container?.clientHeight || 300;
                console.log(`[Live2D] Container: ${width}x${height}`);

                // Step 4: Create PIXI Application
                const app = new PIXI.Application({
                    view: canvas,
                    backgroundAlpha: 0,
                    width,
                    height,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                });

                // Store app reference BEFORE async model load
                appRef.current = app;

                // Step 5: Load Live2D model
                const modelUrl = getModelUrl(modelId);
                console.log(`[Live2D] Loading: ${modelUrl}`);

                const model = await Live2DModel.from(modelUrl, {
                    autoInteract: true,
                    autoUpdate: true,
                });

                // Check if still mounted after async load
                if (!isMounted) {
                    safeDestroy();
                    return;
                }

                if (!model) {
                    throw new Error('Model is undefined after load');
                }

                modelRef.current = model;
                console.log(`[Live2D] Loaded: ${model.width}x${model.height}`);

                // Step 6: Scale and position model
                const scaleX = width / model.width;
                const scaleY = height / model.height;
                const scale = Math.min(scaleX, scaleY) * 0.8;

                model.scale.set(scale);
                model.x = (width - model.width * scale) / 2;
                model.y = height - model.height * scale * 0.98;

                // Step 7: Add to stage
                app.stage.addChild(model);
                setStatus('loaded');
                console.log('[Live2D] Added to stage');

                // Step 8: Start idle animation
                try {
                    await model.motion('idle');
                    console.log('[Live2D] Idle motion started');
                } catch {
                    // No idle motion available - that's ok
                }

                // Step 9: Enable click interaction
                model.on('hit', (hitAreas: string[]) => {
                    console.log('[Live2D] Hit:', hitAreas);
                    if (hitAreas.includes('body')) model.motion('tap_body');
                    if (hitAreas.includes('head')) model.motion('flick_head');
                });

            } catch (err: any) {
                console.error('[Live2D] Init failed:', err);
                if (isMounted) {
                    setStatus('error');
                    setErrorMsg(err?.message || 'Unknown error');
                    safeDestroy();
                }
            }
        };

        initLive2D();

        // Cleanup function - ONLY place where destroy is called
        return () => {
            isMounted = false;
            safeDestroy();
        };
    }, [modelId, getModelUrl, safeDestroy]);

    // Handle expression changes
    useEffect(() => {
        const model = modelRef.current;
        if (model && status === 'loaded' && expression) {
            try {
                model.expression(expression);
            } catch {
                // Expression not found
            }
        }
    }, [expression, status]);

    return (
        <div className={`relative ${className}`}>
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-cyan-400 font-mono text-sm animate-pulse">
                        Loading Live2D...
                    </div>
                </div>
            )}
            {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-red-400 text-sm p-4 text-center">
                    <div>
                        <div className="text-2xl mb-2">⚠️</div>
                        <div>模型加载失败</div>
                        <div className="text-xs text-gray-500 mt-1 max-w-[200px] break-words">
                            {errorMsg}
                        </div>
                    </div>
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: status === 'error' ? 'none' : 'block' }}
            />
        </div>
    );
};

export const Live2DCanvas: React.FC<Live2DCanvasProps> = (props) => {
    return (
        <Suspense fallback={<div className="text-cyan-400 animate-pulse">Loading...</div>}>
            <Live2DCanvasInner {...props} />
        </Suspense>
    );
};
