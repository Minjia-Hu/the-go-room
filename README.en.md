# The Go Room

[简体中文](README.md) | English

> Before trying to win, understand each move.

Learn Go (Weiqi / Baduk) by playing on a 9×9 board. The black stone on the home page has just one liberty. Try A or B to save it, then see how White can respond.

**The interface and lessons are in Simplified Chinese.**

**[Try it online (Chinese) →](https://minjia-hu.github.io/the-go-room/)**

Interactive lessons, practice problems, a simple computer opponent, and game review all run locally in your browser. No account, API key, or paid Go service is required to use the app.

![Home page showing a circled black stone surrounded on three sides by White, with A and B marked on the board](docs/images/home.png)

## Learn · Practice · Play · Review

| Section | What you can do |
| --- | --- |
| **Learn · 学** | Six chapters take you from the rules to saving your own stones and capturing your opponent’s. Learn about territory, the endgame, and 9×9 strategy, then play through a complete annotated game. |
| **Practice · 练** | Practice spotting danger, escaping, capturing, connecting, making two eyes, choosing what to do first, and defending against ladders. Find problems you have not yet completed independently, or return to a related lesson. |
| **Play · 弈** | Play 9×9 Go against a simple computer opponent. Coaching is on by default: try a move, inspect its local consequences, then confirm. Retry the most recent round, mark dead stones, and score the game. |
| **Review · 复** | Keep the ten most recent completed games and replay them move by move, with explanations of rule events such as captures, ko, and the end of the game. |

The home page puts the course catalog above the practice catalog. Each chapter lists its lessons, with Go terms alongside the titles. For example, the lesson on blocking an escape introduces the net (枷吃). Open the term in the lesson to read its definition. The chapter menu stays open as you switch lessons or select a companion exercise.

The six chapters cover **37 lesson and practice units**. The five opening lessons introduce placement, liberties, captures, suicide, and ko. The suicide lesson includes an optional step-by-step comparison of one eye and two eyes. Practice has **26 problems**, including 12 that share completion records with the lessons. Practicing preserves your place in the course.

## Watch a problem unfold

In **练 → 先后判断 → 救棋，不一定是往外伸**, Black can extend upward or capture the white stones on the right. After the extension, White can still capture the whole black group. Capturing White first frees up liberties for Black. This 23-second recording shows both lines and the final question about why the capture works.

![Practice recording showing White capturing Black after move A, then Black playing B to capture White and gain liberties](docs/images/practice-demo.gif)

[Still image showing why the extension fails](docs/images/practice-result.png)

## Getting started

- **Learn the rules.** Try A or B on the home board, or select **从第一课开始** to start the first lesson on placing a stone.
- **Practice a skill.** Choose a problem from the lower catalog, or select **练** in the top navigation to browse all problems.
- **Play a game.** Select **弈**. Coaching lets you try a move before confirming it and seeing the computer’s response. Open **复** after the game to review it.

## Run locally

Requires **Node.js 24.x** and npm.

```bash
git clone https://github.com/Minjia-Hu/the-go-room.git
cd the-go-room
```

If you use nvm, run `nvm install` and `nvm use` in the project directory. The Node.js version is specified in [.nvmrc](.nvmrc). Then install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal. Other commands:

```bash
npm test          # Run tests
npm run lint      # Check code
npm run build     # Build the static site into dist/
npm run preview   # Preview the production build locally
```

Built with Vite, React, TypeScript, and Vitest. The app is entirely frontend-based, with no backend.

The `dist/` output can be served by a static hosting service. See the [deployment notes](docs/release.md) (Chinese) for details.

## Rules and saved data

Games use a 9×9 board, Chinese area scoring, 7.5 komi for White, and positional superko: a move may not recreate an earlier board position.

Learning records, your place in the lessons, and completed games are saved in the current browser. Refreshing a lesson returns to the beginning of the saved lesson or problem; refreshing Practice returns to its list. Steps within a problem and games in progress do not survive a refresh.

Clearing browser data removes these records. Account sync and SGF import/export are not currently supported.

## Current limitations

- The computer opponent uses simple heuristics. Coaching explains local consequences; it does not provide best-move recommendations, win rates, or reliable long-term life-and-death analysis.
- You mark dead stones before scoring. The computer accepts those markings without checking them; incorrect or missing markings affect the result.
- Practice compares local outcomes. Completion records are not a certification of playing strength. Feedback on how well the lessons teach is welcome.
- Mobile layouts have been checked using browser emulation. Touch accuracy and Safari toolbar behavior still need testing on physical phones.

## Contributing and documentation

Please use [Issues](https://github.com/Minjia-Hu/the-go-room/issues) to report confusing explanations, board interaction problems, or rule errors. Include the lesson name, steps to reproduce the issue, expected behavior, browser, and screen size. Screenshots are helpful; avoid including private information.

For code contributions, work on a feature branch and run `npm test`, `npm run lint`, and `npm run build`. Check interface changes in a browser as well. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full conventions.

The following documents are currently in Chinese:

- [Feature status and verification records](docs/status.md)
- [Initial design](docs/superpowers/specs/2026-11-01-v1-design.md) and [project vision](docs/vision.md)
- [Contribution guide](CONTRIBUTING.md)
- [References and third-party notices](THIRD_PARTY_NOTICES.md)

## License

The project's own code, lesson text, and assets are available under the [MIT License](LICENSE), allowing use, modification, and commercial use with the copyright and license notices retained. Third-party materials remain subject to their respective licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
