export const FOOTER_MESSAGES = {
    start: {
        line1: '🌾 今日の一杯は、どこから始めますか',
        line2: 'ふと気になった蔵から、ゆっくり歩いてみましょう。'
    },
    first: {
        line1: '🌾 最初の一杯、お疲れさまでした',
        line2: '余韻の向こうに、もうひとつ出会いが待っています。'
    },
    early: {
        line1: '🌾 少しずつ、この会場の空気が見えてきましたね',
        line2: '今日はどんな味わいに出会えるでしょう。'
    },
    middle: {
        line1: '🌾 歩くほどに、味わいの景色が変わっていきます',
        line2: 'まだ知らない一杯が、そっと待っています。'
    },
    late: {
        line1: '🌾 出会いも、そろそろ折り返し',
        line2: 'それでも気になる蔵があれば、もう一歩。'
    },
    almost: {
        line1: '🌾 ずいぶん巡りましたね',
        line2: 'まだ出会っていない一杯が、どこかで待っています。'
    },
    complete: {
        line1: '🌾 今日の出会いは、もう十分かもしれません',
        line2: 'それでも心が動いたなら、もう一度。'
    }
}

export const getFooterState = (total, visited) => {
    if (visited === 0) return 'start'
    if (visited === 1) return 'first'
    if (visited <= 5) return 'early'

    const remaining = total - visited

    if (remaining === 0) return 'complete'
    if (remaining <= 20) return 'almost'
    if (visited >= 30) return 'late'

    return 'middle'
}
