import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Task, TaskStatus } from '../types';
import { APP_PRICE } from '../constants';
import { Button } from '../components/Button';
import { EmojiGrid } from '../components/EmojiGrid';
import { Lock, Share2, Check } from 'lucide-react';

export const PreviewPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  
  const [showPayModal, setShowPayModal] = useState(false); // Simulates Wechat Pay Sheet

  useEffect(() => {
    if (!taskId) return;
    const fetchTask = async () => {
      try {
        const data = await api.getTask(taskId);
        setTask(data);
        if (data.status === TaskStatus.PAID_UNLOCKED) {
           navigate(`/result/${taskId}`);
        }
      } catch (e) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId, navigate]);

  const handlePayClick = () => {
    // Open "WeChat Pay" simulation
    setShowPayModal(true);
  };

  const executePayment = async () => {
    if (!taskId) return;
    setPaying(true);
    try {
      // 1. Create Order
      await api.createOrder(taskId);
      // 2. Simulate Pay Success
      const updatedTask = await api.mockWeChatPay(taskId);
      setTask(updatedTask);
      setShowPayModal(false);
      
      // 3. Redirect to success
      navigate(`/result/${taskId}`);
    } catch (e) {
      alert("支付失败，请重试");
    } finally {
      setPaying(false);
    }
  };

  const handleShare = () => {
    // In a real WeChat browser, this calls wx.updateAppMessageShareData
    // Here we just show a toast
    alert("点击右上角 ... 分享给好友，看你的预览图！");
  };

  if (loading || !task) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl">
      {/* Top Bar */}
      <div className="bg-white p-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
         <h1 className="font-bold text-lg text-gray-800">预览表情包 (24张)</h1>
         <button onClick={handleShare} className="text-gray-500 flex items-center text-sm font-medium">
            <Share2 className="w-4 h-4 mr-1" /> 分享预览
         </button>
      </div>

      {/* Grid */}
      <EmojiGrid 
        images={task.preview_images} 
        isLocked={true} 
        onImageClick={() => {}} // Could open a modal to zoom in single watermarked image
      />

      {/* Sticky Payment Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 pb-6 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-gray-500 text-sm">
            限时特惠 <span className="line-through">¥29.9</span>
          </div>
          <div className="text-orange-500 font-medium text-sm flex items-center">
            <Check className="w-3 h-3 mr-1" /> 满意再下载
          </div>
        </div>
        <Button 
          fullWidth 
          onClick={handlePayClick}
          className="flex items-center justify-center text-lg shadow-orange-500/30"
        >
          <Lock className="w-5 h-5 mr-2 opacity-80" />
          微信支付解锁 ¥{APP_PRICE}
        </Button>
      </div>

      {/* Mock WeChat Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-t-2xl p-6 pb-10 slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <span onClick={() => setShowPayModal(false)} className="text-gray-400 text-sm cursor-pointer">取消</span>
                <span className="font-bold text-gray-800">确认付款</span>
                <span className="w-8"></span> 
              </div>
              
              <div className="text-center mb-8">
                <p className="text-gray-500 text-sm mb-1">Q-Moji Gen</p>
                <div className="text-4xl font-black text-gray-900">¥{APP_PRICE.toFixed(2)}</div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500">收款方</span>
                    <span className="text-gray-900 font-medium">Q-Moji 官方</span>
                 </div>
                 <Button 
                   onClick={executePayment} 
                   variant="primary" 
                   fullWidth 
                   isLoading={paying}
                   className="bg-[#07c160] from-[#07c160] to-[#07c160] shadow-none hover:shadow-none"
                 >
                   立即支付
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
