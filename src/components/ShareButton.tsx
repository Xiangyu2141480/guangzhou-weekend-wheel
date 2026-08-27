import { useState } from 'react';
import type { Activity } from '../data/activities';

interface ShareButtonProps {
  activity: Activity;
}

function getShareText(activity: Activity) {
  return `🐶 今天去哪汪？\n\n命运让我今天去：\n📍 ${activity.name}\n💰 ${activity.budgetLabel}\n⏰ ${activity.duration}\n🚇 ${activity.transport}\n\n广州周末去哪玩？\n👉 ${window.location.href}`;
}

export function ShareButton({ activity }: ShareButtonProps) {
  const [status, setStatus] = useState('📋 复制结果');

  const share = async () => {
    const text = getShareText(activity);
    try {
      if (navigator.share) {
        await navigator.share({ title: '今天去哪汪？', text, url: window.location.href });
        setStatus('汪！分享好啦 🐾');
      } else {
        await navigator.clipboard.writeText(text);
        setStatus('汪！已经复制啦 🐾');
      }
    } catch {
      setStatus('没复制上，再试一下');
    }
  };

  return <button type="button" className="soft-button" aria-label="分享或复制结果" onClick={share}>{status}</button>;
}
