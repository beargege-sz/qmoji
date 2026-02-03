
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Task } from '../types';
import { Button } from '../components/Button';
import { EmojiGrid } from '../components/EmojiGrid';
import { downloadZip, removeBackground } from '../services/utils';
import { Download, Sparkles, X, CheckCircle2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

export const ResultPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  
  // Transparency States
  const [isTransparent, setIsTransparent] = useState(false);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    api.getTask(taskId).then(setTask);
  }, [taskId]);

  const handleToggleTransparency = async () => {
    if (isTransparent) {
        setIsTransparent(false);
        return;
    }

    // If already processed, just switch
    if (processedImages.length > 0) {
        setIsTransparent(true);
        return;
    }

    if (!task || !task.images) return;

    // Process images
    setIsProcessing(true);
    try {
        const promises = task.images.map(img => removeBackground(img));
        const results = await Promise.all(promises);
        setProcessedImages(results);
        setIsTransparent(true);
    } catch (e) {
        console.error("Failed to process background", e);
        alert("背景处理失败，请重试");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
     const imagesToDownload = isTransparent && processedImages.length > 0 ? processedImages : task?.images;
     if (!task || !imagesToDownload) return;

     setIsDownloading(true);
     try {
       await downloadZip(imagesToDownload, `q-moji-${task.id}${isTransparent ? '-transparent' : ''}.zip`);
       // Show modal after successful download
       setTimeout(() => {
         setShowFollowModal(true);
       }, 1000);
     } catch (e) {
       console.error(e);
       alert("下载失败，请重试");
     } finally {
       setIsDownloading(false);
     }
  };

  if (!task) return null;

  const displayImages = isTransparent && processedImages.length > 0 ? processedImages : task.images;

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-2xl pb-24 relative">
      {/* Success Header */}
      <div className="bg-orange-50 p-6 text-center border-b border-orange-100">
        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-200">
           <Sparkles className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">生成成功！</h1>
        <p className="text-orange-700 text-sm mt-1">你的专属表情包已就绪</p>
      </div>

      <div className="p-4 pb-2">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 mb-4 flex items-start">
           <span className="mr-2">💡</span>
           长按图片可单独保存，或点击下方按钮打包下载。
        </div>

        {/* Transparency Toggle */}
        <div className="flex justify-end items-center mb-2">
            <button 
                onClick={handleToggleTransparency}
                disabled={isProcessing}
                className={`
                    flex items-center text-sm font-bold px-4 py-1.5 rounded-full border transition-all shadow-sm
                    ${isTransparent 
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                    }
                `}
            >
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isTransparent ? (
                    <ToggleRight className="w-5 h-5 mr-2 text-green-400" />
                ) : (
                    <ToggleLeft className="w-5 h-5 mr-2 text-gray-400" />
                )}
                {isProcessing ? '处理中...' : isTransparent ? '透明底 (开)' : '透明底 (关)'}
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className={isTransparent ? "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-gray-100" : ""}>
        <EmojiGrid 
            images={displayImages} 
            onImageClick={() => {}} 
        />
      </div>

      {/* Sticky Actions - Side by Side Layout */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-row gap-3">
            <Link to="/" className="flex-1">
                <Button variant="secondary" fullWidth className="flex items-center justify-center h-full">
                    再做一套
                </Button>
            </Link>
            
            <div className="flex-1">
                <Button 
                    onClick={handleDownload} 
                    fullWidth 
                    className="flex items-center justify-center"
                    isLoading={isDownloading}
                >
                    <Download className="w-5 h-5 mr-2" />
                    免费下载
                </Button>
            </div>
        </div>
      </div>

      {/* Follow Us Modal */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-6">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative flex flex-col items-center shadow-2xl">
              <button 
                onClick={() => setShowFollowModal(false)}
                className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Success Message */}
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold mb-6 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                已保存！请到下载文件夹获得打包文件
              </div>

              {/* Header: Avatar + Name */}
              <div className="flex items-center space-x-3 mb-6 w-full justify-center">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm shrink-0">
                   {/* 
                      头像替换说明：
                      请在 public 目录下放入 avatar.png，如果没有会自动使用默认头像
                   */}
                   <img 
                     src="/avatar.png" 
                     onError={(e) => {
                       e.currentTarget.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=XiongGe";
                     }}
                     alt="Avatar" 
                     className="w-full h-full object-cover bg-gray-100"
                   />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">熊哥AI军团</h3>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="relative w-64 h-64 bg-white rounded-xl flex items-center justify-center mb-6">
                 {/* 
                    二维码替换说明：
                    请在 public 目录下放入 qrcode.png，如果没有会自动使用默认二维码
                 */}
                 <img 
                   src="/qrcode.png" 
                   onError={(e) => {
                     e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://channels.weixin.qq.com";
                   }}
                   alt="关注视频号"
                   className="w-full h-full object-contain"
                 />
                 
                 {/* Channels Icon (Bottom Right Corner) */}
                 <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-sm">
                    <div className="bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center">
                       {/* Simple Infinity-like icon for Channels */}
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-white">
                         <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
                       </svg>
                    </div>
                 </div>
              </div>

              <p className="text-center text-gray-500 text-sm">
                扫一扫二维码，关注我的视频号
              </p>
           </div>
        </div>
      )}
    </div>
  );
};
