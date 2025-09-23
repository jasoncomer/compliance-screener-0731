import { getEdgeOffset } from '../../views/Flowtrace/utils/edgeOffset'

describe('getEdgeOffset', () => {
  const A = { x: 0, y: 0 }
  const B = { x: 100, y: 0 } // horizontal edge

  it('returns equal and opposite offsets for opposing directions', () => {
    const outAB = getEdgeOffset(A, B, 'out')
    const inBA = getEdgeOffset(B, A, 'in')
    expect(outAB.offX).toBeCloseTo(-inBA.offX)
    expect(outAB.offY).toBeCloseTo(-inBA.offY)
  })

  it('gives perpendicular offset on vertical edge', () => {
    const C = { x: 0, y: 100 } // vertical edge
    const off = getEdgeOffset(A, C, 'out')
    expect(off.offX).toBeCloseTo(14)
    expect(off.offY).toBeCloseTo(0)
  })

  it('scales with zoom', () => {
    const zoom2 = getEdgeOffset(A, B, 'out', 2)
    const zoom1 = getEdgeOffset(A, B, 'out', 1)
    expect(Math.hypot(zoom2.offX, zoom2.offY)).toBeCloseTo(
      Math.hypot(zoom1.offX, zoom1.offY) / 2
    )
  })
})