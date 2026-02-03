
import { GoogleGenAI } from "@google/genai";
import { Task, TaskStatus } from '../types';
import { fileToBase64, sliceGridImage } from './utils';
import { EMOJI_LABELS } from '../constants';

// In-memory store
const tasks: Record<string, Task> = {};

// Background processor to handle the AI generation without blocking the UI
const processTaskBackground = async (taskId: string, file: File, customPromptArg?: string) => {
  try {
    const task = tasks[taskId];
    if (!task) return;

    // Ensure we get the custom prompt either from the argument or the task object
    const userPrompt = customPromptArg || task.customPrompt || "";

    task.status = TaskStatus.RUNNING;

    // 1. Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. Prepare Prompt
    const base64Data = await fileToBase64(file);
    
    // Format emotion list by rows to guide the AI layout visually
    // REMOVED index numbers (1., 2.) to prevent AI from writing them in the image
    let formattedEmotionList = "";
    for (let i = 0; i < EMOJI_LABELS.length; i += 6) {
      const rowItems = EMOJI_LABELS.slice(i, i + 6);
      formattedEmotionList += `第 ${i/6 + 1} 行: ${rowItems.map((item) => `[${item.label}]`).join('   ')}\n`;
    }

    // Updated prompt with user customization
    // Reorganized to prioritize User Custom Prompt before strict layout rules
    const promptText = `你是一个专业的表情包插画师。请基于上传图像中的人物，创作一套 Q 版半身表情包。

【风格要求】
1. 风格模仿 LINE 热门贴图，线条圆润，色彩鲜艳，具有可爱的彩色手绘质感。
2. 必须保留人物的核心识别特征（如发型、眼镜、配饰、胡须等）。

${userPrompt ? `【用户特别指令（高优先级）】\n${userPrompt}\n(请务必在所有表情中体现上述要求)\n` : ''}

【布局指令 - 必须严格执行】
1. 画面必须是 **4行 x 6列** 的均匀网格矩阵。
2. 总共 **24** 个表情。
3. **安全距离（关键）：** 请务必在行与行之间、列与列之间预留明显的空白间隔。
4. **垂直分布：** 文字必须紧凑地位于表情正下方。**文字底部与网格单元下边缘之间必须留出空白**，防止被切割。

【内容指令】
1. **纯文本标签：** 每个表情下方只写对应的文字。**严禁**写入数字编号（如 '1.', '2.' 等）。只写文字！
2. **文字位置：** 文字必须位于表情的正下方，居中对齐。
3. **水平边距：** 文字不要写得太宽或太大。**确保文字左右两侧都有留白**，不要触碰到左右相邻的网格线。
4. 请按照以下顺序排列内容（只画方括号[]里的词，不要画括号）：
${formattedEmotionList}

【背景指令】
背景必须是纯白色 (Hex #FFFFFF)。
角色轮廓必须清晰闭合，避免与背景混淆。

技术规格： 4K 分辨率 (3840x2160)，16:9 比例。请充分利用画布宽度。`;

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        imageConfig: {
          imageSize: '4K',
          aspectRatio: '16:9',
        },
      },
    });

    // 4. Extract Result
    let generatedBase64 = '';
    
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedBase64) {
      throw new Error("No image generated from API");
    }

    // 5. Slice with Auto-Crop (No transparency applied)
    const slicedImages = await sliceGridImage(generatedBase64, 4, 6);

    // 6. Update Task
    task.images = slicedImages;
    task.preview_images = slicedImages; // In a real app, this might be a watermarked low-res version
    task.status = TaskStatus.COMPLETED;

  } catch (error) {
    console.error("AI Generation failed:", error);
    const task = tasks[taskId];
    if (task) {
      task.status = TaskStatus.FAILED;
    }
  }
};

export const api = {
  uploadImage: async (file: File, customPrompt?: string): Promise<Task> => {
    const id = Date.now().toString();
    
    const newTask: Task = {
      id,
      customPrompt: customPrompt || "",
      status: TaskStatus.PENDING,
      source_image_url: URL.createObjectURL(file),
      images: [],
      created_at: Date.now(),
      expire_at: Date.now() + 3600000, // 1 hour
    };
    
    tasks[id] = newTask;

    // Start background processing
    processTaskBackground(id, file, customPrompt);
    
    return newTask;
  },

  getTask: async (taskId: string): Promise<Task> => {
    // Simulate network latency check
    await new Promise(resolve => setTimeout(resolve, 200));

    const task = tasks[taskId];
    if (!task) throw new Error('Task not found');
    return { ...task };
  },

  createOrder: async (taskId: string): Promise<void> => {
    // Simulate API call to create payment order
    await new Promise(resolve => setTimeout(resolve, 500));
    const task = tasks[taskId];
    if (!task) throw new Error('Task not found');
  },

  mockWeChatPay: async (taskId: string): Promise<Task> => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    const task = tasks[taskId];
    if (!task) throw new Error('Task not found');
    
    task.status = TaskStatus.PAID_UNLOCKED;
    return { ...task };
  }
};
