import { computed } from 'vue'

// ── 味覚距離の重み ──
const TASTE_WEIGHT = { sweet: 0.45, body: 0.40, aroma: 0.15 }

// ── 物理距離の半径制限（マップ対角線の20%） ──
const PHYSICAL_RADIUS_RATIO = 0.20

// ── 甘辛ラベル ──
const sweetLabel = (z) => {
    if (z >= 1.5) return '超辛口'
    if (z >= 0.8) return '辛口'
    if (z >= 0.3) return 'やや辛口'
    if (z >= -0.3) return '中庸'
    if (z >= -0.8) return 'やや甘口'
    if (z >= -1.5) return '甘口'
    return '超甘口'
}

// ── 濃淡ラベル ──
const bodyLabel = (z) => {
    if (z >= 1.5) return '濃醇'
    if (z >= 0.8) return 'やや濃醇'
    if (z >= -0.3) return '中庸'
    if (z >= -0.8) return 'やや淡麗'
    if (z >= -1.5) return '淡麗'
    return '淡麗'
}

// ── 香りラベル ──
const aromaLabel = (z) => {
    if (z >= 1.5) return '華やか'
    if (z >= 0.8) return '穏やか'
    return '控えめ'
}

// ── 味覚特徴を簡潔な文字列に ──
const describeTaste = (taste) => {
    const s = sweetLabel(taste.sweetDry)
    const b = bodyLabel(taste.lightRich)
    const a = aromaLabel(taste.aroma)

    // 中庸が多い場合は省略してシンプルに
    const parts = []
    if (s !== '中庸') parts.push(s)
    if (b !== '中庸') parts.push(b)
    if (a !== '控えめ') parts.push(`香り${a}`)

    return parts.length > 0 ? parts.join('・') : 'バランス型'
}

// ── 味覚距離 ──
const tasteDistance = (a, b) => {
    const ds = a.sweetDry - b.sweetDry
    const db = a.lightRich - b.lightRich
    const da = a.aroma - b.aroma
    return Math.sqrt(TASTE_WEIGHT.sweet * ds * ds + TASTE_WEIGHT.body * db * db + TASTE_WEIGHT.aroma * da * da)
}

// ── 物理距離 ──
const physicalDistance = (a, b) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}

// ── 基準の味覚を文章にする導入文テンプレート ──
const introTemplates = [
    (desc) => `先ほどは${desc}寄りでしたね。`,
    (desc) => `${desc}タイプをお楽しみでしたね。`,
    (desc) => `直近は${desc}系でしたね。`,
]

// ── ① 近い味わいの文テンプレート ──
const similarTemplates = [
    (name, desc) => `近くで傾向が近いのは「${name}」です。${desc}タイプです。`,
    (name, desc) => `お近くの「${name}」も${desc}系で相性が良さそうです。`,
    (name, desc) => `味わいの方向性が近い「${name}」（${desc}）がすぐそばにあります。`,
]

// ── ② 対極の文テンプレート ──
const oppositeTemplates = [
    (name, desc) => `方向性を変えるなら、${desc}タイプの「${name}」も面白いかもしれません。`,
    (name, desc) => `ガラリと変えて「${name}」（${desc}）を試してみるのもおすすめです。`,
    (name, desc) => `対照的な味わいの「${name}」（${desc}）で新たな発見はいかがですか。`,
]

// ── ③ 気分チェンジの文テンプレート ──
const changeTemplates = [
    (name, desc) => `本日まだ体験していないタイプとして、「${name}」（${desc}）もおすすめです。`,
    (name, desc) => `未踏の味わい「${name}」（${desc}）で新しい一杯はいかがでしょう。`,
    (name, desc) => `まだ出会っていない方向性の「${name}」（${desc}）が気になるところです。`,
]

// ── 訪問数に応じた全体導入文 ──
const visitCountIntro = (count, baseDesc) => {
    if (count >= 10) return 'バランスよく巡られています。'
    if (count >= 3) return `本日は${baseDesc}寄りの傾向です。`
    if (count >= 1) return `先ほどのお酒を基準に分析しています。`
    return ''
}

// ── ランダムテンプレート選択（シード付き簡易） ──
const pickTemplate = (templates) => templates[Math.floor(Math.random() * templates.length)]

/**
 * useRecommendation composable
 *
 * @param {import('vue').Ref<Array>} validBooths - ブース一覧（x, y, estimated, id, name, isEmpty）
 * @param {import('vue').Ref<Object>} boothStates - { [id]: { visited, ... } }
 * @param {import('vue').Ref<string|null>} selectedBoothId - 直近タップした酒造ID
 */
export function useRecommendation(validBooths, boothStates, selectedBoothId) {
    const recommendation = computed(() => {
        const booths = validBooths.value
        const states = boothStates.value
        const baseId = selectedBoothId.value

        // 基準ブースが未選択の場合は空
        if (!baseId) return null

        const baseBooth = booths.find(b => b.id === baseId && !b.isEmpty)
        if (!baseBooth || !baseBooth.estimated) return null

        const baseTaste = baseBooth.estimated

        // 未訪問ブース一覧
        const unvisited = booths.filter(b => {
            if (b.isEmpty || b.id === baseId) return false
            return !states[b.id]?.visited
        })

        if (unvisited.length === 0) return null

        // 訪問済みブース一覧
        const visitedBooths = booths.filter(b => {
            if (b.isEmpty) return false
            return !!states[b.id]?.visited
        })

        const visitedCount = visitedBooths.length

        // ── 距離計算 ──
        // 全ペアの最大距離を求めて正規化に使う
        let maxTasteDist = 0
        let maxPhysDist = 0
        const candidates = []

        for (const booth of unvisited) {
            const td = tasteDistance(baseTaste, booth.estimated)
            const pd = physicalDistance(baseBooth, booth)
            if (td > maxTasteDist) maxTasteDist = td
            if (pd > maxPhysDist) maxPhysDist = pd
            candidates.push({ booth, tasteDist: td, physDist: pd })
        }

        if (maxTasteDist === 0) maxTasteDist = 1
        if (maxPhysDist === 0) maxPhysDist = 1

        // 半径制限: マップ全体サイズ基準
        const allBooths = booths.filter(b => !b.isEmpty)
        let mapMaxX = 0, mapMaxY = 0, mapMinX = Infinity, mapMinY = Infinity
        for (const b of allBooths) {
            if (b.x > mapMaxX) mapMaxX = b.x
            if (b.y > mapMaxY) mapMaxY = b.y
            if (b.x < mapMinX) mapMinX = b.x
            if (b.y < mapMinY) mapMinY = b.y
        }
        const mapDiagonal = Math.sqrt((mapMaxX - mapMinX) ** 2 + (mapMaxY - mapMinY) ** 2)
        const physRadiusLimit = mapDiagonal * PHYSICAL_RADIUS_RATIO

        // 半径制限適用
        const nearby = candidates.filter(c => c.physDist <= physRadiusLimit)
        const pool = nearby.length >= 3 ? nearby : candidates // フォールバック

        // 正規化してスコア算出
        const scored = pool.map(c => {
            const normTaste = c.tasteDist / maxTasteDist
            const normPhys = c.physDist / maxPhysDist
            return {
                ...c,
                normTaste,
                normPhys,
                scoreSimilar: 0.7 * normTaste + 0.3 * (1 - normPhys),  // ①低い方が良い
                scoreOpposite: 0.7 * normTaste + 0.3 * (1 - normPhys),  // ②高い方が良い
            }
        })

        // ① 近い味わい × 近距離 → score最小
        const sortedSimilar = [...scored].sort((a, b) => a.scoreSimilar - b.scoreSimilar)
        const similar = sortedSimilar[0] || null

        // ② 対極 × 近距離 → score最大
        const sortedOpposite = [...scored].sort((a, b) => b.scoreOpposite - a.scoreOpposite)
        // ②は①と同じブースにならないようにする
        let opposite = null
        for (const item of sortedOpposite) {
            if (!similar || item.booth.id !== similar.booth.id) {
                opposite = item
                break
            }
        }

        // ③ 気分チェンジ枠 — 訪問済み平均ベクトルから最も遠い
        let change = null
        if (visitedCount > 0) {
            const avgTaste = {
                sweetDry: visitedBooths.reduce((s, b) => s + b.estimated.sweetDry, 0) / visitedCount,
                lightRich: visitedBooths.reduce((s, b) => s + b.estimated.lightRich, 0) / visitedCount,
                aroma: visitedBooths.reduce((s, b) => s + b.estimated.aroma, 0) / visitedCount,
            }

            // 未訪問候補の平均からの距離
            let maxAvgTaste = 0
            let maxAvgPhys = 0
            const changeCandidates = []

            for (const booth of unvisited) {
                const td = tasteDistance(avgTaste, booth.estimated)
                const pd = physicalDistance(baseBooth, booth)
                if (td > maxAvgTaste) maxAvgTaste = td
                if (pd > maxAvgPhys) maxAvgPhys = pd
                changeCandidates.push({ booth, tasteDist: td, physDist: pd })
            }

            if (maxAvgTaste === 0) maxAvgTaste = 1
            if (maxAvgPhys === 0) maxAvgPhys = 1

            const nearbyChange = changeCandidates.filter(c => c.physDist <= physRadiusLimit)
            const changePool = nearbyChange.length >= 3 ? nearbyChange : changeCandidates

            const changeScored = changePool.map(c => ({
                ...c,
                score: 0.8 * (c.tasteDist / maxAvgTaste) + 0.2 * (1 - c.physDist / maxAvgPhys)
            }))

            // 上位3件からランダム
            changeScored.sort((a, b) => b.score - a.score)
            const top3 = changeScored.slice(0, 3).filter(c => {
                // ①②と被らないようにする
                const usedIds = new Set()
                if (similar) usedIds.add(similar.booth.id)
                if (opposite) usedIds.add(opposite.booth.id)
                return !usedIds.has(c.booth.id)
            })

            if (top3.length > 0) {
                change = top3[Math.floor(Math.random() * top3.length)]
            } else if (changeScored.length > 0) {
                // フォールバック: 被りを許容
                const fallback = changeScored.slice(0, 3)
                change = fallback[Math.floor(Math.random() * fallback.length)]
            }
        } else {
            // 訪問0件の場合は基準ブースの味覚から最も遠い候補を使用
            const sortedFar = [...scored].sort((a, b) => b.scoreSimilar - a.scoreSimilar)
            for (const item of sortedFar) {
                const usedIds = new Set()
                if (similar) usedIds.add(similar.booth.id)
                if (opposite) usedIds.add(opposite.booth.id)
                if (!usedIds.has(item.booth.id)) {
                    change = item
                    break
                }
            }
        }

        // ── 文章生成 ──
        const baseDesc = describeTaste(baseTaste)
        const intro = pickTemplate(introTemplates)(baseDesc)

        const visitIntro = visitCountIntro(visitedCount, baseDesc)

        const similarText = similar
            ? pickTemplate(similarTemplates)(similar.booth.name, describeTaste(similar.booth.estimated))
            : null

        const oppositeText = opposite
            ? pickTemplate(oppositeTemplates)(opposite.booth.name, describeTaste(opposite.booth.estimated))
            : null

        const changeText = change
            ? pickTemplate(changeTemplates)(change.booth.name, describeTaste(change.booth.estimated))
            : null

        // 少なくとも1件の提案があるか
        if (!similarText && !oppositeText && !changeText) return null

        // サマリー用短縮テキスト（コンパクト表示向け）
        const similarSummary = similar
            ? `${similar.booth.name}（${describeTaste(similar.booth.estimated)}）`
            : null
        const oppositeSummary = opposite
            ? `${opposite.booth.name}（${describeTaste(opposite.booth.estimated)}）`
            : null
        const changeSummary = change
            ? `${change.booth.name}（${describeTaste(change.booth.estimated)}）`
            : null

        return {
            intro,
            visitIntro,
            similarText,
            oppositeText,
            changeText,
            similarSummary,
            oppositeSummary,
            changeSummary,
            similarBooth: similar?.booth || null,
            oppositeBooth: opposite?.booth || null,
            changeBooth: change?.booth || null,
        }
    })

    return { recommendation }
}
