import type { Point } from '../engine'

export interface StrategyMove { readonly point: Point; readonly explanation: string }
export interface StrategyChoice {
  readonly id: string
  readonly label: string
  readonly letter: string
  readonly rows: readonly string[]
  readonly moves: readonly StrategyMove[]
  readonly conclusion: string
  readonly target?: Point
  readonly area?: readonly Point[]
}
export interface StrategyLesson {
  readonly id: 'urgent' | 'edges' | 'chase'
  readonly title: string
  readonly intro: string
  readonly takeaway: string
  readonly choices: readonly StrategyChoice[]
  readonly reasons: readonly { readonly text: string; readonly correct: boolean; readonly feedback: string }[]
}

const URGENT_ROWS = ['.........', '.........', '.........', '...OO....', '..OXXO...', '...O.....', '.........', '.........', '.........'] as const
const CHASE_ROWS = ['.........', '......X..', '.....XO..', '.........', '..OO.....', '.OXXO....', '..O......', '.........', '.........'] as const

export const STRATEGY_LESSONS: readonly StrategyLesson[] = [
  {
    id: 'urgent', title: '先救棋，还是去占地？',
    intro: '你执黑。圈出的两颗黑棋只剩一口气。远处有空点，但这一手若不处理眼前危险，白棋会怎样回应？先选 A 或 B，再逐步看结果。',
    takeaway: '每手先检查：自己的棋有没有只剩一口气？本题先接出，能避免两颗棋马上被提。气变多只是暂时缓解危险，后面还要继续观察。',
    choices: [
      { id: 'extend', letter: 'A', label: '先接出黑棋', rows: URGENT_ROWS, target: { x: 3, y: 4 },
        moves: [
          { point: { x: 4, y: 5 }, explanation: '黑棋接在最后一口气上，和原来的两颗连成一块。新棋子向下、向右接触空点，整块的气增加了。' },
          { point: { x: 2, y: 5 }, explanation: '这条变化中，白棋连接左边的棋。目标黑块仍在，白棋没有提到它；接下来还要留意它的气。' },
        ], conclusion: '先处理了眼前危险：原来的两颗黑棋保留下来。' },
      { id: 'far', letter: 'B', label: '先去远处落子', rows: URGENT_ROWS, target: { x: 3, y: 4 },
        moves: [
          { point: { x: 6, y: 6 }, explanation: '这手在远处放了一颗黑子，但没有给目标黑块增加任何气。它仍然只有原来那一个空点可呼吸。' },
          { point: { x: 4, y: 5 }, explanation: '白棋填住最后一口气，原来的两颗黑棋被一起提走。远处那一子还在，但救不到这里。' },
        ], conclusion: '远处落子没有解决眼前危险，目标两颗黑棋被提走。' },
    ],
    reasons: [
      { text: '棋盘哪里空，就先下哪里', correct: false, feedback: '空点可以落子，但不是都同样紧急。这里不处理最后一口气，两颗黑棋下一手就会被提。' },
      { text: '先检查自己的棋是否有马上被提的危险', correct: true, feedback: '对。本题先接出能保住眼前的两颗棋，再考虑向其他地方发展。' },
      { text: '接出一次以后，这块棋就永远安全', correct: false, feedback: '接出只是增加了气。对方仍可能继续围攻，不能把暂时安全当成已经做活。' },
    ],
  },
  {
    id: 'edges', title: '为什么从角和边开始？',
    intro: '比较三张独立示意图：每张都由黑棋补上缺口，再看白棋在外围下一手。目标都是圈住四个空点，看看边界用了多少颗黑子。图中围住的空点还不代表最终得分，也没有保证黑棋已经活了。',
    takeaway: '在这些连成边界的示意图里，同样四个空点，角上用 5 子、边上用 8 子、中腹用 12 子。角有两条边线帮忙，边上有一条；所以没有紧急战斗时，可以先考虑角和边。实际开局不必照着图把小圈填满。',
    choices: [
      { id: 'corner', letter: 'A', label: '角上补一手', rows: ['..X......', '.........', 'XXX......', '.........', '.........', '.........', '.........', '........O', '.........'], area: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
        moves: [
          { point: { x: 2, y: 1 }, explanation: '补上右侧缺口后，黑棋只需要围住右边和下边。上边、左边由棋盘边缘挡住，内部是四个相连空点。' },
          { point: { x: 8, y: 8 }, explanation: '白棋在外围继续落子，这四个空点的边界没有变化。它们现在被黑棋围住，但这个示意图没有演示黑棋的长期死活。' },
        ], conclusion: '角上：两条棋盘边线帮忙，示意边界共 5 颗黑子。' },
      { id: 'side', letter: 'B', label: '边上补一手', rows: ['..X..X...', '.....X...', '..XXXX...', '.........', '.........', '.........', '.........', '........O', '.........'], area: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 1 }],
        moves: [
          { point: { x: 2, y: 1 }, explanation: '补上左侧缺口后，黑棋围住左、右、下三面，上面借助棋盘边缘。同样围住四个空点，比角上多用了一侧棋子。' },
          { point: { x: 8, y: 8 }, explanation: '白棋在外围继续下，示意空区保持四点。这里只比较边界的形状与用子，不把它当成实战必得的地。' },
        ], conclusion: '边上：一条棋盘边线帮忙，示意边界共 8 颗黑子。' },
      { id: 'center', letter: 'C', label: '中腹补一手', rows: ['.........', '.........', '..X.XX...', '..X..X...', '..X..X...', '..XXXX...', '.........', '........O', '.........'], area: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }],
        moves: [
          { point: { x: 3, y: 2 }, explanation: '补上上方缺口后，四个空点的四面都要靠黑棋围住。这里没有棋盘边缘可以借用。' },
          { point: { x: 8, y: 8 }, explanation: '白棋同样在外围下了一手。四个空点没有变大，连成一圈的黑棋却更多。这说明了边线可以节省围地用子。' },
        ], conclusion: '中腹：四面都靠棋子，示意边界共 12 颗黑子。' },
    ],
    reasons: [
      { text: '角上的棋永远不会被吃', correct: false, feedback: '角上的棋也可能被吃。这里比较的是围同样空点时的边界用子，不是在证明死活。' },
      { text: '围成一个圈，就已经保证这些分数', correct: false, feedback: '还要考虑对方能否侵入、黑棋能否活下来。中盘的形状不能直接当作最终得分。' },
      { text: '棋盘边线能替棋子挡住一面或两面', correct: true, feedback: '对。角有两面、边有一面可以借用，所以这些示意图围相同空点时更省子；有紧急危险时仍要先处理危险。' },
    ],
  },
  {
    id: 'chase', title: '什么时候先不追了？',
    intro: '右上的一颗白棋看起来能追，左下圈出的两颗黑棋却只剩一口气。比较追两手和先保护自己的两条变化：每条都包含黑、白各两手。',
    takeaway: '这条追子变化中，两手追赶都没有吃到白棋，自己的两颗却被提走。先保护、再向空处接出，保留了自己的棋。追子不是目的；每次追之前，都重新检查是否有更紧急的事。',
    choices: [
      { id: 'chase', letter: 'A', label: '继续追右上白棋', rows: CHASE_ROWS, target: { x: 2, y: 5 },
        moves: [
          { point: { x: 6, y: 3 }, explanation: '黑棋压住右上白子的一口气，白子还剩右边一口气。左下自己的两颗黑棋仍然只有一口气。' },
          { point: { x: 7, y: 2 }, explanation: '白棋向右逃出，连成两颗，重新获得更多气。追了一手，还没有吃到它。' },
          { point: { x: 7, y: 1 }, explanation: '假如黑棋继续从上方追，白棋仍有向右、向下的空点。左下的危险到现在也没解决。' },
          { point: { x: 3, y: 6 }, explanation: '白棋转身填住左下黑块最后的一口气，提走两颗黑子。右上白棋仍留在盘上，两手追赶没有换来提子。' },
        ], conclusion: '追了两手：没有提到白子，原来的两颗黑棋却被提走。' },
      { id: 'protect', letter: 'B', label: '先保护左下黑棋', rows: CHASE_ROWS, target: { x: 2, y: 5 },
        moves: [
          { point: { x: 3, y: 6 }, explanation: '黑棋先接出左下棋块，增加它的气。右上白子暂时不追，先保留自己的棋。' },
          { point: { x: 7, y: 2 }, explanation: '白棋也向右伸出，但没有提走左下黑棋。双方都在发展，不必每手都追着对方走。' },
          { point: { x: 3, y: 7 }, explanation: '黑棋继续向下面的空处接出，整块又接触到新的空点。这里展示的是增加气、打开出路，还没有保证围到地。' },
          { point: { x: 7, y: 3 }, explanation: '这条变化中白棋向下伸出，左下黑块仍保留。现在可以重新观察全盘，寻找下一处需要处理的地方。' },
        ], conclusion: '先保护再接出：原来的黑棋保留，整块获得更多气。' },
    ],
    reasons: [
      { text: '追了两手还没吃到，自己的两颗却被提走了', correct: true, feedback: '对。这是本题选择先保护的具体原因。是否继续追，要看真实后果，而不是只看对方在逃。' },
      { text: '只要让对手逃跑，就已经得分了', correct: false, feedback: '让对手逃跑不直接得分。本例白棋仍在盘上，自己的两颗却没保住；最后还要比较活子和围住的空点。' },
      { text: '任何时候都不应该追对方的棋', correct: false, feedback: '不是永远不能追。追子可能有用，但这道题里自己的危险更紧急，而且这条追法并没有吃到白棋。' },
    ],
  },
]
