# 画像の可動範囲（Boundary）調整ガイド

このドキュメントは `src/lib/boundaryUtils.ts` にある関数と型の動作を数式・具体例を用いて丁寧に解説します。
目的は、img要素に対して「どれだけ画面内で動かせるか（可動範囲）」を調整するときに生じる挙動を正確に理解し、UIやパラメータ設計に反映できるようにすることです。

## 目次
- 概要
- 型の説明
- 関数別の詳解
  - computeBaseSize
  - computeMinMax
  - clampPosition
- フロー例（数値例で追う）
- よくある疑問／境界ケース
- 実装上の注意点


## 概要

このモジュールは次の要素を提供します：
- 型 `Size`, `MinMax`
- 画面（DOM）上の img 要素から基本サイズを計算する `computeBaseSize`
- コンテナ（表示領域）と表示サイズ／拡大率に基づいて、X/Y 軸ごとの最小／最大移動量を計算する `computeMinMax`
- 計算した範囲に位置を制限する `clampPosition`

これらを組み合わせることで、ユーザーが画像をパンしたときにどの範囲まで移動可能かを制御できます。


## 型の説明

- `Size`:
  - 構造: `{ width: number; height: number }`
  - 用途: 要素（container や表示要素）の幅・高さをピクセルで表す。

- `MinMax`:
  - 構造: `{ minX: number; maxX: number; minY: number; maxY: number }`
  - 用途: X/Y それぞれの最小・最大位置（ピクセル単位）。位置は中心基準（本実装では中心からの相対座標を想定する設計が多い）で扱われることが多いです。


## 関数別の詳解

### computeBaseSize(imgEl: HTMLImageElement | null | undefined, scale: number): Size | null

目的: HTMLImageElement の DOM 上の表示サイズ（bounding client rect）と与えられた `scale` に基づき、“ベースサイズ（スケール前の画像サイズ）” を返します。

実装（要点）:
- 引数 `imgEl` が null または `scale === 0` の場合は `null` を返す。
- DOM の矩形（getBoundingClientRect）を取得し、表示されている大きさ rect.width / scale, rect.height / scale を計算して返す。

数式:
- 画面における表示幅を $W_{display}$、表示高さを $H_{display}$、スケール係数を $s$ とすると
  \[ W_{base} = \frac{W_{display}}{s}, \quad H_{base} = \frac{H_{display}}{s} \]

説明:
- たとえば、CSSで `transform: scale(s)` を用いて表示を拡大縮小している場合、DOM の矩形は既にスケール後の大きさです。内部で扱いたい「画像自体の基準サイズ（スケールをかける前のサイズ）」を得るために、矩形サイズをスケールで割ります。
- scale が 0 のときは除算できないため `null` を返して呼び出し側で異常処理する必要があります。

推奨される呼び出し例（疑似コード）:
- `const base = computeBaseSize(imgEl, scale);`
- `const displaySize = { width: base.width * scale, height: base.height * scale }`（もし displaySize を自前計算するなら）
- あるいは `displaySize` を直接 `imgEl.getBoundingClientRect()` で取得してもよい。


### computeMinMax(container: Size, displaySize: Size, _scale: number, maxTravelFactor: number = 1): MinMax

目的: コンテナ（通常は表示領域）と表示サイズに基づき、画像中心の X/Y の移動可能範囲を計算します。`maxTravelFactor` は「移動可能領域を何倍まで許容するか」を制御するパラメータです。

引数の意味（実装に合わせた解釈）:
- `container`: コンテンツを収める領域のサイズ（幅・高さ）。
- `displaySize`: 画像が画面上に表示されるサイズ（幅・高さ）。
- `_scale`: （本実装では未使用。ただし将来的に scale を使った調整が想定されるので引数として残している。）
- `maxTravelFactor`: 既定値 1。1 より大きくすると移動可能範囲が拡張されます（例: 1.2 で 20% 広げる）。

内部変数と数式（コードからの意味の読み替え）:

1. factor
   \[ factor = \max(1,\; maxTravelFactor) \]
   - 1 未満の値は 1 に丸められ、移動範囲が勝手に縮まらないようにする。

2. desiredWidthByDisplay / desiredHeightByDisplay
   \[ W_{d,disp} = W_{display} \times factor,\quad H_{d,disp} = H_{display} \times factor \]
   - 表示サイズに factor を掛けたもの。

3. desiredWidthByContainer / desiredHeightByContainer
   \[ W_{d,cont} = W_{container} \times factor,\quad H_{d,cont} = H_{container} \times factor \]

4. desiredWidth / desiredHeight
   \[ W_{d} = \max(W_{d,disp},\;W_{d,cont}),\quad H_{d} = \max(H_{d,disp},\;H_{d,cont}) \]
   - 表示サイズ由来とコンテナ由来のどちらを基準に拡張するかを最大値で決定する。

5. halfWidthScreen（X方向の片側余白）

- 条件分岐 1: 画面上の表示幅がコンテナ幅以上のとき
  \[ halfWidthScreen = \frac{W_{display} - W_{container}}{2} \]
  - 例えば画像がコンテナより大きければ、オーバーフロー分の半分が片側の最大移動量となる。

- 条件分岐 2: 表示幅がコンテナ幅より小さいとき
  \[ halfWidthScreen = \min\Big(\frac{W_{container}-W_{display}}{2},\; factor>1\ ?\ \max\Big(0,\frac{W_{d}-W_{display}}{2}\Big)\ :\ \frac{W_{container}-W_{display}}{2}\Big) \]

  直感的な意味:
  - 画像がコンテナより小さい場合、通常はコンテナと画像の差分（(container - display)/2）だけ埋める余地がある。
  - しかし `factor > 1` のときは、`desiredWidth` を使ってさらに広げられる可能性があるため、その増分 `max(0,(W_d - W_display)/2)` を候補にし、最終的には小さい方を取る（ユーザーが無制限に移動できないようにするため）。

6. 最終的な halfWidth / halfHeight
   \[ halfWidth = \max(0,\; halfWidthScreen) \]
   \[ halfHeight = \max(0,\; halfHeightScreen) \]

7. min/max の決定
   \[ minX = -halfWidth,\quad maxX = halfWidth \]
   \[ minY = -halfHeight,\quad maxY = halfHeight \]


コメント（挙動の解釈）:
- 返り値の minX/maxX は中心原点からの相対位置で指定される。正の X は右方向、負の X は左方向の移動を意味します。
- `factor` を 1 より大きくすると、`desiredWidth` が大きくなり、結果的に `halfWidth` が増える（より遠くまで移動できる）傾向があります。ただし、実装上は "最小" と "最大" を内側で抑えており無限に広がるわけではありません。


#### 可視化（X軸まわり簡易）

- 画像表示幅: $W_{display}$
- コンテナ幅: $W_{container}$
- 片側に移動できる最大量（理想的）: $\dfrac{W_{display}-W_{container}}{2}$（画像が大きい場合）

- factor による拡張効果は、表示幅／コンテナ幅どちらを基準にするかで変わります。`desiredWidth = max(W_{display}*factor, W_{container}*factor)` により、表示領域かコンテナのどちらか大きい方を基準に拡張します。


### clampPosition(pos: { x: number; y: number }, mm: MinMax)

目的: 算出した `MinMax` に基づいて、与えられた座標（pos.x, pos.y）を範囲内に収めます。

実装（要点）:
- x は `Math.max(mm.minX, pos.x)` で下限を守り、その後 `Math.min(mm.maxX, ...)` で上限を守る。y も同様。
- つまり最終的に
  \[ x_{clamped} = \min( mm.maxX,\; \max( mm.minX,\; x ) ) \]
  \[ y_{clamped} = \min( mm.maxY,\; \max( mm.minY,\; y ) ) \]

効果:
- もしユーザーがパンで無理に画像を動かしても、clampPosition を通すことで強制的に移動量が制限され、常に UI の想定範囲内に収まります。


## フロー例（数値で理解する）

例 1: 画像がコンテナより大きい

- 前提:
  - container = { width: 800, height: 600 }
  - img DOM 表示矩形: rect.width = 1200, rect.height = 900
  - scale = 1
  - maxTravelFactor = 1 (デフォルト)

- computeBaseSize(imgEl, 1) ->
  \[ W_{base} = 1200/1 = 1200,\quad H_{base} = 900/1 = 900 \]
  （今回は base と display は同じ: displaySize = {1200,900}）

- computeMinMax(container, displaySize, 1, 1):
  - factor = max(1,1)=1
  - desiredWidth = max(1200*1, 800*1) = 1200
  - halfWidthScreen (display >= container の分岐) = (1200 - 800)/2 = 200
  - halfWidth = max(0,200) = 200
  - よって minX = -200, maxX = 200

解釈: 画像は左右にそれぞれ 200px まで移動可能。これはオーバーフローした 400px の半分に相当します。


例 2: 画像がコンテナより小さいが factor を大きくした場合

- 前提:
  - container = { width: 1200, height: 900 }
  - displaySize = { width: 800, height: 600 }
  - maxTravelFactor = 1.5

- 計算:
  - factor = max(1, 1.5) = 1.5
  - desiredWidth = max(800*1.5, 1200*1.5) = max(1200, 1800) = 1800
  - (container - display)/2 = (1200 - 800)/2 = 200
  - (desiredWidth - display)/2 = (1800 - 800)/2 = 500
  - halfWidthScreen = min(200, max(0,500)) = min(200,500) = 200
  - halfWidth = 200
  - minX = -200, maxX = 200

解釈:
- factor を 1.5 にしたことで desiredWidth は 1800 に拡張されましたが、実装の min(..., ...) により最終的には (container - display)/2 の 200px に抑えられています。つまり factor が大きくても常に無限に拡張されるわけではなく、実際には "コンテナと表示差分の制約" を尊重します。


例 3: 極端に小さな display（中央寄せしたいケース）

- container = { 800, 600 }
- displaySize = { 200, 100 }
- factor = 2

計算:
- desiredWidth = max(200*2=400, 800*2=1600) = 1600
- (container - display)/2 = (800-200)/2 = 300
- (desiredWidth - display)/2 = (1600 - 200)/2 = 700
- halfWidthScreen = min(300, max(0,700)) = 300
- halfWidth = 300
- minX = -300, maxX = 300

解釈: 画像が小さい場合はコンテナとの差分（300px）が実際の移動量の上限になり、factor が大きくてもその差を超えないように制御されます。


## よくある疑問／境界ケース

1. scale が 0 のとき
   - `computeBaseSize` は `null` を返す。呼び出し側はこれをチェックして例外処理を行うべきです。

2. maxTravelFactor < 1 のとき
   - 内部で `factor = Math.max(1, maxTravelFactor)` としているため、1 未満は 1 に丸められます（移動範囲が勝手に狭まらないようにする防御処理）。

3. displaySize が container と同一のとき
   - 差分が 0 になり、halfWidth/halfHeight は 0。移動は許されない（min=max=0）。

4. 意図的に中心外に寄せたい UI 要求がある場合
   - この実装は "中心を基準にした対称的な可動範囲" を返すため、左右非対称の挙動を実現したいなら `computeMinMax` の結果を加工（例: minX をさらに -50 する等）してから `clampPosition` に渡してください。


## 実装上の注意点と推奨

- computeBaseSize は DOM の getBoundingClientRect() を参照する。レスポンシブな UI ではリサイズ時に再計算を行う必要がある。
- `displaySize` は "実際に画面上で画像が占めているサイズ" として渡すか、あるいは `computeBaseSize` の戻り値に `scale` を掛け直して作る（どちらでも良いが整合性を保つこと）。
- clampPosition を UI のパン処理に組み込むことで、ユーザー操作で画像が画面外に逃げないようにする。
- `maxTravelFactor` を UX 的なスライダーに結びつけると、ユーザーが「どれくらい余裕をもって画像を動かしたいか」を調整できる。だが上で示したとおり、実装はコンテナ差分で上限を取るため、過度な期待はさせない。


## 付録: 簡単な疑似コード（使い方）

```ts
// 1) ベースサイズを取得
const base = computeBaseSize(imgEl, scale);
if (!base) return; // scale が 0 など

// 2) 表示サイズを決定（2通りの例）
const displaySize = imgEl.getBoundingClientRect();
// または
const displaySizeFromBase = { width: base.width * scale, height: base.height * scale };

// 3) 可動範囲を取得
const mm = computeMinMax(containerSize, displaySize, scale, maxTravelFactor);

// 4) パン操作で得られた位置を制限
const clamped = clampPosition(userDesiredPos, mm);
// clamped を適用して描画する
```


## まとめ

- `computeBaseSize` は表示矩形をスケールで割って "基準サイズ" を返す。
- `computeMinMax` は `factor`（= max(1, maxTravelFactor)）に基づき、表示サイズとコンテナサイズの差分を用いて対称的な移動上限を計算する。
- `clampPosition` は与えられた範囲に位置を厳密に閉じ込める。

ファイル: `src/lib/boundaryUtils.ts` の挙動を数式と数値例で追い、どのように UI に影響するかを明確にしました。必要ならこのドキュメントに図（SVG など）や、より多くの実行例（ユニットテスト）を追加します。
