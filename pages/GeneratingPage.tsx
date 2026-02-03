
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { TaskStatus } from '../types';
import { Sparkles } from 'lucide-react';

export const GeneratingPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // Fake progress bar animation for UX (syncs loosely with the 15s mock delay)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 95) return 95;
        // Fast at first, slow at end
        const increment = old < 50 ? 5 : 1; 
        return old + increment;
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Polling Logic
  useEffect(() => {
    if (!taskId) return;

    const checkStatus = async () => {
      try {
        const task = await api.getTask(taskId);
        
        if (task.status === TaskStatus.COMPLETED) {
          setProgress(100);
          // Small delay to let user see 100%
          setTimeout(() => navigate(`/result/${taskId}`), 500);
          return;
        }

        if (task.status === TaskStatus.FAILED) {
          alert("生成失败，请重试");
          navigate('/');
          return;
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    // Immediate check
    checkStatus();

    // Interval check every 2 seconds
    const intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [taskId, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-orange-400 blur-2xl opacity-20 animate-pulse rounded-full"></div>
        <div className="relative bg-gradient-to-tr from-orange-100 to-pink-100 p-8 rounded-full shadow-inner">
           <Sparkles className="w-16 h-16 text-orange-500 animate-bounce" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">正在绘制你的专属表情</h2>
      <p className="text-gray-500 text-sm text-center mb-8 px-4">
        AI 正在分析面部特征，生成 Q 版形象...<br/>
        预计还需要 {Math.max(1, Math.floor((100 - progress) / 6))} 秒
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-orange-400 to-pink-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right w-full">{progress}%</p>
    </div>
  );
};
