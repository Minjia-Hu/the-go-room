import type { Point } from '../engine'
import type { SurvivalScene } from './survivalTypes'
import type { IndependentScene } from './independent'

/** 专项新题仅出现在「练」，不插入原来的课程顺序。 */
export interface RescuePractice extends IndependentScene { readonly title: string }
export interface PriorityChoice {
  readonly label: string
  readonly point: Point
  readonly reply: Point
  readonly feedback: string
}
export interface PriorityScene {
  readonly id: string
  readonly title: string
  readonly rows: readonly string[]
  readonly target: Point
  readonly related: string
  readonly hint: string
  readonly choices: readonly PriorityChoice[]
  readonly answer: number
  readonly reasons: readonly string[]
  readonly reasonAnswer: number
  readonly takeaway: string
}

export const PRACTICE_DANGER_SCENES: readonly SurvivalScene[] = [
  {
    "id": "danger-edge-three",
    "title": "边上三颗棋，共用几口气",
    "course": 1,
    "guided": false,
    "kind": "danger",
    "rows": [
      ".........",
      "O.....O..",
      "XO...OXO.",
      "XO....XX.",
      "XO.......",
      ".........",
      ".........",
      ".........",
      "........."
    ],
    "target": {
      "x": 0,
      "y": 3
    },
    "examples": [
      {
        "x": 0,
        "y": 5
      }
    ],
    "wrongMove": {
      "x": 8,
      "y": 8
    },
    "intro": "先找到只有一口气的黑块，再点出它最后的一口气。其他黑棋也靠近白棋，但不一定同样危险。",
    "hints": [
      "别按棋子多少判断，先数相连整块的气。",
      "边线外没有气，留意左边竖着的三颗黑棋。",
      "点左边的黑块，再点它最下方的空点。"
    ]
  },
  {
    "id": "danger-top-bend",
    "title": "弯着连接，也算同一块",
    "course": 1,
    "guided": false,
    "kind": "danger",
    "rows": [
      "...OXX...",
      "...OXO...",
      "....O....",
      ".........",
      ".........",
      ".O.......",
      "OXX......",
      "..O......",
      "........."
    ],
    "target": {
      "x": 4,
      "y": 0
    },
    "examples": [
      {
        "x": 6,
        "y": 0
      }
    ],
    "wrongMove": {
      "x": 8,
      "y": 8
    },
    "intro": "先找到只有一口气的黑块，再点出它最后的一口气。其他黑棋也靠近白棋，但不一定同样危险。",
    "hints": [
      "黑棋拐弯也能相连；只数上下左右相邻的空点。",
      "看上边连成弯形的黑块，边线外不算气。",
      "点上边的黑块，再点它右侧剩下的空点。"
    ]
  }
]

export const PRACTICE_RESCUE_SCENES: readonly RescuePractice[] = [
  {
    "id": "extend-corner",
    "title": "角上的三颗棋",
    "kind": "extend",
    "rows": [
      "XXO......",
      "XO.......",
      ".........",
      ".........",
      ".........",
      "......O..",
      "......XX.",
      ".......O.",
      "........."
    ],
    "target": {
      "x": 0,
      "y": 0
    },
    "example": {
      "x": 0,
      "y": 2
    }
  },
  {
    "id": "extend-bend",
    "title": "弯形黑块，出口在哪里",
    "kind": "extend",
    "rows": [
      ".........",
      ".XO......",
      "OX...O...",
      ".....XO..",
      "...OXXO..",
      "....OO...",
      ".........",
      ".........",
      "........."
    ],
    "target": {
      "x": 5,
      "y": 3
    },
    "example": {
      "x": 4,
      "y": 3
    }
  },
  {
    "id": "capture-pair",
    "title": "被夹住的黑棋",
    "kind": "capture",
    "rows": [
      ".........",
      "..O....X.",
      ".O.......",
      ".OXOX....",
      ".OXOX....",
      "..OX.....",
      ".........",
      ".........",
      "........."
    ],
    "target": {
      "x": 2,
      "y": 3
    },
    "example": {
      "x": 3,
      "y": 2
    },
    "focus": {
      "x": 3,
      "y": 3
    }
  },
  {
    "id": "capture-edge",
    "title": "边线上的紧急救援",
    "kind": "capture",
    "rows": [
      "......O..",
      "......OXO",
      "......OXO",
      ".......OX",
      "........X",
      ".OX......",
      "..X......",
      ".........",
      "........."
    ],
    "target": {
      "x": 7,
      "y": 1
    },
    "example": {
      "x": 8,
      "y": 0
    },
    "focus": {
      "x": 8,
      "y": 1
    }
  },
  {
    "id": "connect-larger",
    "title": "两块棋之间的缺口",
    "kind": "connect",
    "rows": [
      ".........",
      ".....OX..",
      ".........",
      ".........",
      ".........",
      ".OO.XX...",
      "OXX.X....",
      ".OO......",
      "........."
    ],
    "target": {
      "x": 1,
      "y": 6
    },
    "example": {
      "x": 3,
      "y": 6
    },
    "partner": {
      "x": 4,
      "y": 6
    }
  },
  {
    "id": "connect-corner",
    "title": "角旁的三颗棋",
    "kind": "connect",
    "rows": [
      ".........",
      ".O.......",
      ".X.......",
      ".........",
      "......XX.",
      ".........",
      ".....OXO.",
      ".....OXXO",
      "......OO."
    ],
    "target": {
      "x": 6,
      "y": 7
    },
    "example": {
      "x": 6,
      "y": 5
    },
    "partner": {
      "x": 6,
      "y": 4
    }
  }
]

export const PRIORITY_SCENES: readonly PriorityScene[] = [
  {
    "id": "priority-save-or-capture",
    "title": "能吃一颗，要先吃吗",
    "rows": [
      ".........",
      "O........",
      "XO.......",
      "XO.......",
      "XO.......",
      ".....X...",
      "....XOX..",
      ".........",
      "........."
    ],
    "target": {
      "x": 0,
      "y": 3
    },
    "related": "strategy/urgent",
    "hint": "先比较：每个选择之后，左边这整块黑棋还有几口气？",
    "choices": [
      {
        "label": "先接出左边黑棋",
        "point": {
          "x": 0,
          "y": 5
        },
        "reply": {
          "x": 8,
          "y": 8
        },
        "feedback": "接出后整块有了两口气，避免原来的三颗黑棋马上被提。右下白子暂时不吃。"
      },
      {
        "label": "先提右下的一颗白棋",
        "point": {
          "x": 5,
          "y": 7
        },
        "reply": {
          "x": 0,
          "y": 5
        },
        "feedback": "虽然提了一颗白棋，左边三颗仍只剩一口气。白棋填住它，就能把三颗一起提走。"
      }
    ],
    "answer": 0,
    "reasons": [
      "吃到一颗就说明这一手一定好",
      "接出增加了危险黑块的气，先避免三颗棋被提",
      "黑棋接出后永远不会被吃"
    ],
    "reasonAnswer": 1,
    "takeaway": "落子前先检查自己的危险棋块。这里吃一颗不能解决另一边三颗黑棋马上被提的问题。"
  },
  {
    "id": "priority-save-or-chase",
    "title": "白棋能追，自己能等吗",
    "rows": [
      "...OXX...",
      "...OXO...",
      "....O....",
      ".........",
      "......X..",
      ".....XO..",
      ".........",
      ".........",
      "........."
    ],
    "target": {
      "x": 4,
      "y": 0
    },
    "related": "strategy/chase",
    "hint": "追白棋之前，数一数上边弯形黑块的气。",
    "choices": [
      {
        "label": "继续追右下白棋",
        "point": {
          "x": 7,
          "y": 5
        },
        "reply": {
          "x": 6,
          "y": 0
        },
        "feedback": "追这一手没有提到白棋，上边三颗黑棋却还只剩一口气。白棋转身填住，就能提走它们。"
      },
      {
        "label": "先接出上边黑棋",
        "point": {
          "x": 6,
          "y": 0
        },
        "reply": {
          "x": 6,
          "y": 6
        },
        "feedback": "先接出让上边黑块获得两口气。这条变化里白棋向下伸出，原来的黑棋也保住了。"
      }
    ],
    "answer": 1,
    "reasons": [
      "先解决自己马上被提的危险，再判断要不要追",
      "只要追着白棋走，就会得分",
      "任何时候都不能追白棋"
    ],
    "reasonAnswer": 0,
    "takeaway": "追子前先检查自己的气。这里追一手没有提到白子，自己的三颗却会被提。"
  },
  {
    "id": "priority-capture-or-extend",
    "title": "救棋，不一定是往外伸",
    "rows": [
      ".........",
      "..O....X.",
      ".O.......",
      ".OXOX....",
      ".OXOX....",
      "..OX.....",
      ".........",
      ".........",
      "........."
    ],
    "target": {
      "x": 2,
      "y": 3
    },
    "related": "survival/escape-guided",
    "hint": "比较向上接一颗和提掉右边白棋：哪一种真的让目标黑块多出气？",
    "choices": [
      {
        "label": "向上接一颗黑棋",
        "point": {
          "x": 2,
          "y": 2
        },
        "reply": {
          "x": 3,
          "y": 2
        },
        "feedback": "向上伸了一颗，整块仍只有一口气。白棋占住最后一气，原来的两颗和新下的一颗都会被提走。"
      },
      {
        "label": "先提右边相连的白棋",
        "point": {
          "x": 3,
          "y": 2
        },
        "reply": {
          "x": 8,
          "y": 8
        },
        "feedback": "提掉右边两颗白棋，腾出相邻空点，目标黑块的气增加了。这次提子本身就是救棋。"
      }
    ],
    "answer": 1,
    "reasons": [
      "只要多下一颗，气就一定变多",
      "提过子就保证这盘赢了",
      "提掉相邻白棋空出位置，目标黑块才真正增加了气"
    ],
    "reasonAnswer": 2,
    "takeaway": "救棋要看结果，不看动作名称。伸出后可能仍只有一口气，提子也可能是正确的救法。"
  },
  {
    "id": "priority-connect-or-corner",
    "title": "先去角上，还是补上缺口",
    "rows": [
      ".........",
      ".....OX..",
      ".........",
      ".........",
      ".........",
      ".OO.XX...",
      "OXX.X....",
      ".OO......",
      "........."
    ],
    "target": {
      "x": 1,
      "y": 6
    },
    "related": "strategy/urgent",
    "hint": "右边同伴有空点可用。看看补上缺口能不能让危险黑块与它共享气。",
    "choices": [
      {
        "label": "先连接左下两块黑棋",
        "point": {
          "x": 3,
          "y": 6
        },
        "reply": {
          "x": 8,
          "y": 8
        },
        "feedback": "补上缺口后，危险黑块与同伴直线连成一块，共用更多气，眼前危险缓解了。"
      },
      {
        "label": "先去左上角落子",
        "point": {
          "x": 1,
          "y": 1
        },
        "reply": {
          "x": 3,
          "y": 6
        },
        "feedback": "角上的新子离危险黑块很远，没有给它增加气。白棋填住缺口，就能提走左下两颗黑棋。"
      }
    ],
    "answer": 0,
    "reasons": [
      "角上永远不能下",
      "连接让危险黑块共用同伴的气，远处落子做不到",
      "连接以后就已经做活"
    ],
    "reasonAnswer": 1,
    "takeaway": "没有紧急危险时可以考虑角和边；本题先补连接，避免眼前两颗棋被提。"
  }
]
