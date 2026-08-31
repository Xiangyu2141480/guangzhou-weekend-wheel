export type MascotMessageState =
  | 'default'
  | 'filtered'
  | 'searching'
  | 'spinning'
  | 'result'
  | 'empty'
  | 'budget'
  | 'date'
  | 'solo';

export const mascotMessages: Record<MascotMessageState, readonly string[]> = {
  default: ['广州这么大，交给鱼丸挑一个。', '别纠结啦，周末先出门再说。'],
  filtered: ['收到，鱼丸正在缩小范围。', '条件记住了，这次更像你想要的。'],
  searching: ['地图摊开，正在找这一轮。', '十个候选马上集合。'],
  spinning: ['抓稳啦，命运正在转圈圈。', '鱼丸也有一点点晕。'],
  result: ['就是它！先看看交通再出发。', '命运签收完毕，不许继续纠结。'],
  empty: ['这个组合有点难，放宽一点点？', '鱼丸翻遍地图也没找到，再选一次吧。'],
  budget: ['钱包的心情，鱼丸懂。', '价格不确定的活动先不塞给你。'],
  date: ['时间对上了，剩下交给转盘。', '半天还是晚上，鱼丸都记好了。'],
  solo: ['一个人出门，也可以很有意思。', '独处路线已加入候选。'],
};

export const spinCountMessages: Readonly<Record<number, string>> = {
  5: '你是不是其实哪里都不想去？',
  10: '再转下去天都黑啦！！🐶',
};

export function getMascotMessage(state: MascotMessageState, index = 0): string {
  const messages = mascotMessages[state];
  return messages[Math.abs(index) % messages.length];
}
