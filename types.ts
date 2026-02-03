
export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAID_UNLOCKED = 'PAID_UNLOCKED',
}

export interface EmojiTemplate {
  key: string;
  label: string;
}

export interface Task {
  id: string;
  customPrompt?: string;
  status: TaskStatus;
  source_image_url: string;
  images: string[];
  preview_images?: string[];
  created_at: number;
  expire_at: number;
}
