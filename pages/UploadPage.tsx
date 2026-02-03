
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, AlertCircle, CheckCircle2, KeyRound, MessageSquarePlus } from 'lucide-react';
import { api } from '../services/mockApi';
import { Button } from '../components/Button';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        console.warn("AI Studio wrapper not found, assuming dev environment or pre-configured key");
        setHasApiKey(true); 
      }
    } catch (e) {
      console.error(e);
      setHasApiKey(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      await checkApiKey();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("图片太大啦，请上传10MB以内的照片");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    if (!hasApiKey) {
      setError("请先连接 Google AI 账号以使用生成服务");
      return;
    }

    setIsUploading(true);
    try {
      // Pass the custom prompt to the API
      const task = await api.uploadImage(selectedFile, customPrompt);
      navigate(`/generate/${task.id}`);
    } catch (err) {
      console.error(err);
      setError("上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl relative">
      {/* Header */}
      <div className="bg-white p-6 pb-2 rounded-b-3xl shadow-sm z-10">
        <h1 className="text-2xl font-black text-gray-800 mb-1">Q版表情包生成器 ✨</h1>
        <p className="text-gray-500 text-sm">上传一张照片，AI 自动生成 24 张专属表情</p>
      </div>

      <div className="flex-1 p-5 space-y-8 overflow-y-auto no-scrollbar">
        
        {/* API Key Connection */}
        {!hasApiKey && (
           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
             <div className="bg-blue-100 p-2 rounded-full">
                <KeyRound className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <h3 className="font-bold text-gray-800">需要连接 API Key</h3>
               <p className="text-xs text-gray-500 mt-1">
                 本应用使用 Gemini 3 Pro 高清绘图模型，需要您连接自己的 Google 账号。
               </p>
             </div>
             <Button 
               variant="secondary" 
               className="w-full text-sm py-2" 
               onClick={handleSelectKey}
             >
               连接 Google AI Studio
             </Button>
           </div>
        )}

        {/* Upload Area */}
        <div className={`space-y-3 transition-opacity ${!hasApiKey ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-sm font-bold text-gray-700 ml-1">1. 上传一张清晰正脸照</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
              ${previewUrl ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-gray-400'}
            `}
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-full p-2">
                    <Camera className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 已选择
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-center px-4">
                  <p className="font-medium text-gray-600">点击上传照片</p>
                  <p className="text-xs text-gray-400 mt-1">推荐: 正面、无遮挡、光线好</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/png, image/jpeg, image/jpg" 
              className="hidden" 
            />
          </div>
          {error && (
            <div className="flex items-center text-red-500 text-xs px-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              {error}
            </div>
          )}
        </div>

        {/* Prompt Tuning */}
        <div className={`space-y-3 transition-opacity ${!hasApiKey ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-sm font-bold text-gray-700 ml-1 flex items-center">
            2. 补充说明 (可选)
            <span className="text-xs font-normal text-gray-400 ml-2">如果不填则使用默认风格</span>
          </label>
          <div className="relative">
             <MessageSquarePlus className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
             <textarea 
               value={customPrompt}
               onChange={(e) => setCustomPrompt(e.target.value)}
               placeholder="例如：这是个戴眼镜的程序员，喜欢喝咖啡。&#10;或者：请把头发画成蓝色，穿着超人衣服..."
               className="w-full bg-white text-gray-900 border-2 border-gray-200 rounded-xl p-3 pl-10 h-32 focus:border-orange-500 focus:ring-0 transition-colors resize-none text-sm placeholder:text-gray-400"
             />
          </div>
        </div>
        
        {/* Spacer for bottom CTA */}
        <div className="h-24"></div>
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 z-20">
        <Button 
          fullWidth 
          onClick={handleSubmit} 
          disabled={!selectedFile || !hasApiKey} 
          isLoading={isUploading}
        >
          {selectedFile ? '立即生成 (免费)' : '请先上传照片'}
        </Button>
      </div>
    </div>
  );
};
