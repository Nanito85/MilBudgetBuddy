export interface KidsTip {
  id: string;
  title: string;
  body: string;
  emoji: string;
}

export const KIDS_TIPS: KidsTip[] = [
  { id: 'k1',  emoji: '🪙', title: 'Save First, Spend Second',    body: 'When you earn money, put some in savings before you spend anything. Even $1 saved is a mission accomplished!' },
  { id: 'k2',  emoji: '🎯', title: 'Set a Goal',                  body: "Saving is easier when you know what you're saving for. Pick your goal and work toward it one chore at a time." },
  { id: 'k3',  emoji: '🧮', title: 'The Power of Counting',       body: "Every dollar you save earns a little more money over time — that's called interest. Your money makes more money!" },
  { id: 'k4',  emoji: '🏦', title: 'Banks Keep Money Safe',       body: "Banks are like super-secure vaults for your money. When you're older, you can open your own account!" },
  { id: 'k5',  emoji: '📊', title: 'Needs vs. Wants',             body: 'A need is something you must have, like food and shoes. A want is something nice to have, like a new game. Knowing the difference is a superpower.' },
  { id: 'k6',  emoji: '💡', title: 'Small Wins Add Up',           body: "If you save just $5 a week, that's $260 in a year. Small savings add up to big results!" },
  { id: 'k7',  emoji: '🤝', title: 'Giving Feels Good',           body: 'Part of managing money well is sharing. Even small donations to people in need make you richer in a different way.' },
  { id: 'k8',  emoji: '🛠️', title: 'Earn It, Own It',             body: "Money you earn by working feels special because you earned it. That's why your chores matter — you're building real skills." },
  { id: 'k9',  emoji: '🚫', title: "Don't Spend It All",          body: "It's tempting to spend everything right away. But saving some means you'll have money when something really important comes along." },
  { id: 'k10', emoji: '⭐', title: "You're Already Ahead",        body: 'Most adults wish they learned about money as kids. By learning now, you\'re way ahead of the game!' },
  { id: 'k11', emoji: '🚀', title: 'Start a Mini Business',       body: 'You can earn money by solving problems — mowing lawns, pet sitting, making crafts. Every great entrepreneur started small!' },
  { id: 'k12', emoji: '📈', title: 'Let Money Grow',              body: 'A savings account pays you interest — money just for keeping your cash there. Put your savings in the bank and watch it grow!' },
  { id: 'k13', emoji: '🧠', title: 'Wait Before You Buy',         body: "Wait 24 hours before buying something you want. If you still want it tomorrow, it's probably worth it. Impulse buys waste money!" },
  { id: 'k14', emoji: '🌳', title: 'Compound Interest Magic',     body: 'If you save $100 and earn 10% interest, you\'ll have $110. Then 10% on $110 gives you $121. Your money grows faster and faster!' },
  { id: 'k15', emoji: '💼', title: 'Skills = Money',              body: 'Every skill you learn can earn you money someday. Coding, cooking, design, music — master something and people will pay for it.' },
  { id: 'k16', emoji: '🏺', title: 'Three Jars Rule',             body: 'Split your money: 50% to spend, 40% to save, 10% to give. This simple rule builds great money habits that last a lifetime.' },
  { id: 'k17', emoji: '🔍', title: 'Compare Before You Buy',      body: 'Always check if the same thing is cheaper somewhere else. Saving $5 on something is the same as earning $5 — price compare!' },
];

export function getDailyKidsTipIndex(): number {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % KIDS_TIPS.length;
}

export function getDailyKidsTip(): KidsTip {
  return KIDS_TIPS[getDailyKidsTipIndex()];
}
