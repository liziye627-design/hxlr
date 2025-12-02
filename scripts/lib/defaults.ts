/**
 * Default Value Assignment
 * 
 * Provides default values for missing script metadata.
 */

/**
 * Default cover URLs by category from Unsplash
 */
const params = 'q=80&auto=format&fit=crop&w=400&ixlib=rb-4.0.3';
const DEFAULT_COVERS: Record<string, string> = {
  horror: `https://images.unsplash.com/photo-1509248961725-aec71f4e848e?${params}`,
  mystery: `https://images.unsplash.com/photo-1451187580459-43490279c0fa?${params}`,
  romance: `https://images.unsplash.com/photo-1516414447565-b14be0adf13e?${params}`,
  comedy: `https://images.unsplash.com/photo-1527224857830-43a7acc85260?${params}`,
  thriller: `https://images.unsplash.com/photo-1478720568477-152d9b164e26?${params}`,
};

/**
 * Get a default cover URL based on the script category.
 * All URLs start with "https://images.unsplash.com/" per Requirements 4.1.
 */
export function getDefaultCoverUrl(category: string): string {
  const cover = DEFAULT_COVERS[category] || DEFAULT_COVERS.mystery;
  return cover;
}

/**
 * Generate a placeholder description based on the script title.
 * The description will contain the title as a substring per Requirements 4.5.
 */
export function generateDescription(title: string): string {
  const templates = [
    `《${title}》是一场精心设计的剧本杀体验，等待你来揭开真相...`,
    `欢迎来到《${title}》的世界，一场扣人心弦的推理之旅即将开始。`,
    `在《${title}》中，每个人都有秘密，每个线索都可能改变结局。`,
    `《${title}》将带你进入一个充满悬疑与惊喜的故事世界。`,
  ];
  
  // Use title hash to consistently select a template
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % templates.length;
  
  return templates[index];
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
