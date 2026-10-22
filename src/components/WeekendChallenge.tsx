import { useState } from 'react';
import type { Activity, ActivityCategory } from '../data/types';
import { YuwanMascot } from './YuwanMascot';
import '../playful.css';

const tasks: Record<ActivityCategory, readonly string[]> = {
  art: ['选一件喜欢的作品，用三个词记住它。', '留意一个有趣的小细节，给它起个外号。', '为今天看到的展览，想一个自己的小标题。'],
  outdoor: ['找一片让你停下脚步的绿意，安静看十秒。', '听一听周围，记住一种让人放松的声音。', '沿着安全的步道，发现一处平时没留意的风景。'],
  food: ['认真尝一口，给今天的味道起个小名字。', '慢慢吃，找出你最喜欢的一种口感。', '用三个词描述这一餐，留给以后的自己。'],
  show: ['散场后，用一句话记下最喜欢的瞬间。', '把今天听到的一段旋律或台词，留在心里。', '演出结束后，给今天的心情选一个表情。'],
  market: ['只看也可以：找一种今天最喜欢的颜色。', '观察一个有趣的摊位细节，不买东西也算完成。', '为逛到的小物件，想一个有趣的新用途。'],
  experience: ['给今天的新尝试，起一个好记的名字。', '允许自己不熟练，记住一个小小的进步。', '结束后，用一句话夸夸愿意尝试的自己。'],
  sport: ['按自己的节奏动一动，记住一个轻松的瞬间。', '先照顾身体的感受，给今天的活力打个分。', '休息时喝口水，为自己刚才的努力点个赞。'],
  night: ['在安全的地方停一停，找一处喜欢的灯光。', '抬头看看夜色，给今晚选一个专属颜色。', '在不影响通行的地方，安静听十秒城市的声音。'],
};

function ChallengeCard({ category }: { category: ActivityCategory }) {
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  return (
    <section className="weekend-challenge" aria-label="周末小任务">
      <div className="challenge-heading">
        <YuwanMascot state={completed ? 'happy' : 'point'} size="sm" alt="" />
        <div><h3>周末小任务</h3><small>鱼丸的随手灵感 · 自愿参加</small></div>
      </div>
      <p role="status" aria-live="polite">{tasks[category][index]}{completed && ' ✓ 盖章完成！'}</p>
      <div className="chip-row">
        <button className="soft-button" type="button" onClick={() => {
          setIndex((current) => (current + 1) % tasks[category].length);
          setCompleted(false);
        }}>换一张</button>
        <button className="soft-button" type="button" aria-pressed={completed} disabled={completed}
          onClick={() => setCompleted(true)}>{completed ? '✓ 已完成' : '标记完成'}</button>
      </div>
    </section>
  );
}

export function WeekendChallenge({ activity }: { activity: Activity }) {
  return <ChallengeCard key={activity.id} category={activity.category} />;
}
