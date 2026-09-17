import { PLAN_COLORS } from '../../lib/palette';

export const BOOK_CATEGORIES = [
  '文学', '小说', '科幻', '人物传记', '历史', '哲学与思想',
  '心理与成长', '经济与管理', '计算机与编程', '教育与育儿',
  '健康与生活', '艺术与设计', '旅行与地理', '美食',
  '童书与绘本', '人文社科', '法律', '其他',
];

/** 按书名（及书名 + 作者）匹配，顺序越靠前优先级越高 */
const TITLE_RULES: [RegExp, string][] = [
  [/三国演义|红楼梦|西游记|水浒传|封神|儒林外史|聊斋|镜花缘|演义/, '小说'],
  [
    /编程|程序设计|代码|算法|数据结构|计算机|软件|架构|数据库|Linux|人工智能|机器学习|深度学习|Python|Java|JavaScript|TypeScript|前端|后端|运维|网络协议|\bAI\b/,
    '计算机与编程',
  ],
  [/经济|金融|投资|股票|基金|财富|商业|管理|营销|创业|货币|债务|会计|产业链/, '经济与管理'],
  [
    /心理|情绪|习惯|自律|认知|思维|沟通|演讲|疗愈|原生家庭|亲密关系|勇气|内耗|焦虑|孤独|自卑|活出/,
    '心理与成长',
  ],
  [/科幻|银河|太空|星际|赛博|三体/, '科幻'],
  [/绘本|童书|幼儿|儿童|亲子|漫画|连环画/, '童书与绘本'],
  [/育儿|教育|学习法|考试|高考|考研|教辅|教学法|如何阅读/, '教育与育儿'],
  [/哲学|思想|伦理|宗教|佛|禅|论语|庄子|尼采|存在主义/, '哲学与思想'],
  [/菜谱|食谱|美食|烘焙|厨|食单|餐桌|食材/, '美食'],
  [/医学|健康|养生|营养|睡眠|运动|中医|解剖|健身|本草|黄帝内经|伤寒|药/, '健康与生活'],
  [/艺术|设计|摄影|绘画|建筑|音乐|电影|书法/, '艺术与设计'],
  [/旅行|游记|地理|地图|国家地理/, '旅行与地理'],
  [/法律|法学|宪法|民法典|刑法|律师/, '法律'],
  [/社会|人类学|民族|文化研究|性别|传播学/, '人文社科'],
  [/传记|自传|回忆录|列传|传$/, '人物传记'],
  [/史|史记|朝代|王朝|战争|抗战|三国|唐朝|宋朝|明朝|清朝|帝国|文明/, '历史'],
  [/文集|散文|诗集|诗歌|随笔|选集|文存|文选/, '文学'],
  [/小说|长篇|短篇|故事集|悬疑|推理|侦探|言情/, '小说'],
];

/** 书名作者无法判断时，再按出版社兜底 */
const PUBLISHER_RULES: [RegExp, string][] = [
  [/译文|人民文学|译林|上海文艺|作家出版|十月文艺|长江文艺|花城|新经典|果麦|磨铁/, '文学'],
  [/少年儿童|童趣|少儿/, '童书与绘本'],
  [/人民邮电|机械工业|电子工业|清华大学|计算机/, '计算机与编程'],
  [/中信|蓝狮子|湛庐|哈佛商业/, '经济与管理'],
  [/商务印书馆|三联|社会科学/, '人文社科'],
  [/教育|师范大学/, '教育与育儿'],
];

export function detectCategory(title: string, author = '', publisher = ''): string {
  // 先只用书名判断（避免作者名干扰「传$」等尾部规则），再用书名 + 作者
  for (const text of [title, `${title} ${author}`]) {
    for (const [pattern, category] of TITLE_RULES) {
      if (pattern.test(text)) return category;
    }
  }
  if (publisher) {
    for (const [pattern, category] of PUBLISHER_RULES) {
      if (pattern.test(publisher)) return category;
    }
  }
  return '其他';
}

export function categoryColor(category: string): string {
  const index = BOOK_CATEGORIES.indexOf(category);
  return PLAN_COLORS[(index < 0 ? BOOK_CATEGORIES.length - 1 : index) % PLAN_COLORS.length];
}
