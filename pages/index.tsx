import { useRef, useEffect } from 'react'
import {
  TinyGame,
  CanvasRenderer,
  CanvasInputManager,
  AnimationFrameRequestTicker,
  TextAlign,
  Point2D
} from 'tiny-canvas'

enum TileState {
  Null,
  Empty,
  Bom,
  Around1,
  Around2,
  Around3,
  Around4,
  Around5,
  Around6,
  Around7,
  Around8
}

type Tile = {
  state: TileState
  show: boolean
}

class MineSweeper extends TinyGame {
  /**
   * タイルの状態
   */
  tiles: Tile[] = []

  /**
   * ボードのはば
   */
  width: number

  /**
   * ボードの高さ
   */
  height: number

  /**
   * タイルの大きさ
   */
  readonly tileSize = 32

  /**
   * MineSweeperのこんすとらくた
   *
   * @param canvas
   */
  constructor(canvas: HTMLCanvasElement) {
    super(
      new CanvasRenderer(canvas),
      new CanvasInputManager(canvas),
      new AnimationFrameRequestTicker()
    )

    // 10 x 10のボードを生成
    this.generateTiles(10, 10)
  }

  /**
   * タイルを生成します。
   *
   * @param width
   * @param height
   */
  private generateTiles(width: number, height: number) {
    this.width = width
    this.height = height

    for (let i = 0; i < width * height; ++i) {
      this.tiles.push(this.generateBomTiles())
    }

    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const tile = this.getTile(x, y)
        if (tile.state === TileState.Empty || tile.state === TileState.Null) {
          const bomCount = this.getAroundBomCount(x, y)
          tile.state = this.numberToAroundState(bomCount)
        }
      }
    }
  }

  private getAroundBomCount(x: number, y: number) {
    const tiles = []

    tiles.push(this.getTile(x - 1, y - 1))
    tiles.push(this.getTile(x, y - 1))
    tiles.push(this.getTile(x + 1, y - 1))

    tiles.push(this.getTile(x + 1, y))
    tiles.push(this.getTile(x - 1, y))

    tiles.push(this.getTile(x - 1, y + 1))
    tiles.push(this.getTile(x, y + 1))
    tiles.push(this.getTile(x + 1, y + 1))

    const bomTiles = tiles.filter(tile => tile.state === TileState.Bom)

    return bomTiles.length
  }

  /**
   * 数字からタイルの状態を返す。
   *
   * @param number
   */
  private numberToAroundState(number: number) {
    if (number === 1) return TileState.Around1
    if (number === 2) return TileState.Around2
    if (number === 3) return TileState.Around3
    if (number === 4) return TileState.Around4
    if (number === 5) return TileState.Around5
    if (number === 6) return TileState.Around6
    if (number === 7) return TileState.Around7
    if (number === 8) return TileState.Around8
    return TileState.Empty
  }

  private aroundStateToNumber(state: TileState) {
    if (state === TileState.Around1) return 1
    if (state === TileState.Around2) return 2
    if (state === TileState.Around3) return 3
    if (state === TileState.Around4) return 4
    if (state === TileState.Around5) return 5
    if (state === TileState.Around6) return 6
    if (state === TileState.Around7) return 7
    if (state === TileState.Around8) return 8
    return 0
  }

  /**
   * ランダムなタイルを生成する
   */
  private generateBomTiles(): Tile {
    const rand = Math.floor(Math.random() * 10)

    return {
      state: rand === 0 ? TileState.Bom : TileState.Empty,
      show: false
    }
  }

  /**
   * フレームごとに呼び出される関数
   */
  onFrame() {
    // 更新
    this.update()

    // 描画
    this.draw()
  }

  /**
   * ゲームを更新
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  update() {
    const point = this.getClickedTilePoint()
    if (point) {
      // もしタイルがクリックされていれば表示
      this.openTile(point.x, point.y)
    }
  }

  /**
   * 特定の位置のタイルを表示する
   *
   * @param x
   * @param y
   */
  openTile(x: number, y: number) {
    const tile = this.getTile(x, y)

    // すでに表示されているタイルならなにもせずに終了
    if (tile.show) return

    if (tile.state === TileState.Empty) {
      // Emptyなタイルなら周りのタイルを表示する
      this.runEmptyTiles(x, y)
    }

    // タイルを表示
    tile.show = true
  }

  /**
   * Emptyなタイルの周りの連続したタイルを表示する
   *
   * @param x
   * @param y
   */
  private runEmptyTiles(x: number, y: number) {
    const tile = this.getTile(x, y)

    if (
      tile.state === TileState.Null ||
      tile.state === TileState.Bom ||
      tile.show
    ) {
      // タイルがNullまたはBomなら終了
      return
    }

    // タイルを表示
    tile.show = true

    // 数字のタイルなら終了
    if (this.aroundStateToNumber(tile.state) > 0) return

    this.runEmptyTiles(x, y - 1) // 上

    this.runEmptyTiles(x - 1, y) // 左
    this.runEmptyTiles(x + 1, y) // 右

    this.runEmptyTiles(x, y + 1) // 下
  }

  /**
   * クリックされているタイルを返す
   */
  private getClickedTilePoint(): Point2D | undefined {
    // クリックされていなければundefinedを返す
    if (this.mouse.leftDown === false) return

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        if (this.checkTileAndCursor(x, y)) {
          // カーソルに触れていたら位置を返す
          return {
            x,
            y
          }
        }
      }
    }
  }

  /**
   * タイルがカーソルに触れているか返す
   *
   * @param x
   * @param y
   */
  private checkTileAndCursor(x: number, y: number) {
    const draw = this.getDrawPosition(x, y)

    return (
      draw.x > this.cursor.x - this.tileSize &&
      draw.y > this.cursor.y - this.tileSize &&
      draw.x - this.tileSize < this.cursor.x - this.tileSize &&
      draw.y - this.tileSize < this.cursor.y - this.tileSize
    )
  }

  /**
   * ゲームを描画
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  draw() {
    // this.fillCircle(0, 0, 32, 'black')
    this.fillRect(0, 0, 640, 480, 'black')
    this.drawTiles()
  }

  /**
   * タイルの位置から描画の位置を計算する
   *
   * @param x
   * @param y
   */
  private getDrawPosition(x: number, y: number): Point2D {
    return {
      x: x * this.tileSize,
      y: y * this.tileSize
    }
  }

  /**
   * タイルを描画
   */
  private drawTiles() {
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const tile = this.getTile(x, y)
        const draw = this.getDrawPosition(x, y)

        // タイルの背景
        this.fillRect(
          draw,
          this.tileSize,
          this.tileSize,
          this.getTileColor(this.getTile(x, y))
        )

        // タイルの枠
        this.strokeRect(
          draw,
          this.tileSize,
          this.tileSize,
          this.checkTileAndCursor(x, y) ? 'green' : 'white',
          1
        )

        // タイルが開いてないか
        if (tile.show === false) continue

        // 周りのボムの数を描画
        const number = this.aroundStateToNumber(tile.state)
        if (number > 0) {
          this.fillText(
            number.toString(),
            this.tileSize / 2 + x * this.tileSize,
            this.tileSize / 1.1 + y * this.tileSize,
            'Arial',
            this.tileSize,
            TextAlign.Center,
            'white'
          )
        }
      }
    }
  }

  /**
   * タイルの色を返す
   *
   * @param tile
   */
  private getTileColor(tile: Tile) {
    if (tile.show === false) return '#a0a0a0'
    if (tile.state === TileState.Bom) return 'red'
    if (tile.state === TileState.Empty) return '#202020'
    return '#a0a0a0'
  }

  /**
   * 特定の位置のタイルを返す
   *
   * @param x
   * @param y
   */
  private getTile(x: number, y: number) {
    if (x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1) {
      return {
        show: false,
        state: TileState.Null
      }
    }
    return this.tiles[this.getPointIndex(x, y)]
  }

  /**
   * 特定の位置の配列の添字を返す
   *
   * @param x
   * @param y
   */
  private getPointIndex(x: number, y: number) {
    return y * this.height + x
  }
}

const Home = () => {
  const canvasRef = useRef<HTMLCanvasElement>()

  useEffect(() => {
    // ゲームを生成
    const game = new MineSweeper(canvasRef.current)

    // ゲームを開始
    game.start()
  })

  return (
    <div className="container">
      <canvas ref={canvasRef} width="640" height="480"></canvas>
    </div>
  )
}

export default Home
