export interface KidsTip {
  id: string;
  title: string;
  body: string;
  emoji: string;
}

export const KIDS_TIPS: KidsTip[] = [
  { id: 'k1', emoji: '🪙', title: 'Save First, Spend Second', body: 'When you earn money, put some in savings before you spend anything. Even $1 saved is a mission accomplished!' },
  { id: 'k2', emoji: '🎯', title: 'Set a Goal', body: 'Saving is easier when you know what you\'re saving for. Pick your goal and work toward it one chore at a time.' },
  { id: 'k3', emoji: '🧮', title: 'The Power of Counting', body: 'Every dollar you save earns a little more money over time — that\'s called interest. Your money makes more money!' },
  { id: 'k4', emoji: '🏦', title: 'Banks Keep Money Safe', body: 'Banks are like super-secure vaults for your money. When you\'re older, you can open your own account!' },
  { id: 'k5', emoji: '📊', title: 'Needs vs. Wants', body: 'A need is something you must have, like food and shoes. A want is something nice to have, like a new game. Knowing the difference is a superpower.' },
  { id: 'k6', emoji: '💡', title: 'Small Wins Add Up', body: 'If you save just $5 a week, that\'s $260 in a year. Small savings add up to big results!' },
  { id: 'k7', emoji: '🤝', title: 'Giving Feels Good', body: 'Part of managing money well is sharing. Even small donations to people in need make you richer in a different way.' },
  { id: 'k8', emoji: '🛠', title: 'Earn It, Own It', body: 'Money you earn by working feels special because you earned it. That\'s why your chores matter — you\'re building real skills.' },
  { id: 'k9', emoji: '🚫', title: 'Don\'t Spend It All', body: 'It\'s tempting to spend everything right away. But saving some means you\'ll have money when something really important comes along.' },
  { id: 'k10', emoji: '⭐', title: 'You\'re Already Ahead', body: 'Most adults wish they learned about money as kids. By learning now, you\'re way ahead of the game!' },
];

export function getDailyKidsTip(): KidsTip {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return KIDS_TIPS[dayOfYear % KIDS_TIPS.length];
}
