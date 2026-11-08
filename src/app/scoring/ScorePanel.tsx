import { resultText } from './regions'
import type { scoringView } from './regions'

interface ScorePanelProps {
  readonly view: ReturnType<typeof scoringView>
  readonly selected: number | null
  readonly onSelect: (id: number | null) => void
  readonly deadCount: number
}

export function ScorePanel({ view, selected, onSelect, deadCount }: ScorePanelProps) {
  const { score, regions } = view
  const stones = (color: 'black' | 'white') => regions.filter((region) => region.color === color).reduce((sum, region) => sum + region.stones, 0)
  return <section className="score" aria-label="数子结果">
    <h3>{resultText(score.winner, score.margin)}</h3>
    <p className="muted small">结果依据你确认的死子标记计算；电脑接受标记，不自动核验死活。</p>
    <p className="muted small">已移除 {deadCount} 颗死子。得分 = 活子 + 围住的空点，双方都接触的空点不计。</p>
    <dl className="score-totals">
      <div><dt>黑方</dt><dd>{stones('black')} 子 + {score.black - stones('black')} 空 = <strong>{score.black}</strong></dd></div>
      <div><dt>白方</dt><dd>{stones('white')} 子 + {score.white - stones('white')} 空 + {score.komi} 贴目 = <strong>{score.white + score.komi}</strong></dd></div>
    </dl>
    <p className="small">点选区域，查看棋盘上对应的子与空。</p>
    <div className="region-list" aria-label="数子区域">
      <button type="button" className="region-button" aria-pressed={selected === null} onClick={() => onSelect(null)}>显示全部区域</button>
      {regions.map((region) => <button type="button" className="region-button" aria-pressed={selected === region.id}
        key={region.id} onClick={() => onSelect(region.id)}>
        <span className={`stone-key stone-key--${region.color}`} />
        {region.color === 'black' ? '黑方' : '白方'}区域 {region.id + 1}：{region.stones} 子 + {region.territory} 空
      </button>)}
    </div>
    <p className="muted small">蓝色底纹为黑方归属，浅色底纹为白方归属。</p>
  </section>
}
