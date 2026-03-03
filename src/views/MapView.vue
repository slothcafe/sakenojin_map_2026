<template>
  <div class="app-shell">
    <div class="map-container" aria-hidden="true"></div>
    <header class="app-header">
      <div class="header-inner">
        <div class="title-block">
          <h1>酒の陣めぐり帖</h1>
          <p>にいがた酒の陣 2026</p>
        </div>
        <div class="header-metrics" aria-live="polite">
          <div class="metric-row">
            <span class="metric-label">訪問</span>
            <span class="metric-value">{{ visitedBreweryIds.length }} / {{ breweries.size }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">訪問率</span>
            <span class="metric-value">{{ progressPercent }}%</span>
          </div>
        </div>
      </div>
    </header>

    <nav class="tab-bar" role="tablist" aria-label="表示タブ">
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'map' }"
        @click="currentView = 'map'"
      >
        会場ガイド
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'heatmap' }"
        @click="currentView = 'heatmap'"
      >
        味わいナビ
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'favorites' }"
        @click="currentView = 'favorites'"
      >
        お気に入り
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': currentView === 'progress' }"
        @click="currentView = 'progress'"
      >
        巡歴
      </button>
    </nav>

    <section class="content-area">
      <main v-if="isMapLikeView" class="map-page">
        <div class="map-topbar">
          <div v-if="currentView === 'map'" class="legend-row">
            <div v-for="r in regionDataList" :key="r.id" :class="['legend-chip', 'pattern-' + r.id]">
              <span class="legend-color" :style="{ backgroundColor: r.color, borderColor: r.stroke }"></span>
              <span>{{ r.name }}</span>
            </div>
          </div>

          <div v-else class="heatmap-control-block">
            <div class="axis-selector" role="group" aria-label="ヒートマップ軸選択">
              <button
                v-for="axis in heatmapAxes"
                :key="axis.id"
                class="axis-btn"
                :class="{ 'is-active': heatmapAxis === axis.id }"
                @click="heatmapAxis = axis.id"
              >
                {{ axis.name }}
              </button>
            </div>

            <div class="heatmap-legend">
              <span class="legend-label min">{{ heatmapMinLabel }}</span>
              <div class="legend-gradient" :class="heatmapAxis + '-gradient'"></div>
              <span class="legend-label max">{{ heatmapMaxLabel }}</span>
            </div>
          </div>

        </div>

        <div class="map-stage">
          <div
            ref="mapViewportRef"
            class="map-viewport"
            :class="{ 'is-zoomed': isZoomed }"
            @pointerdown="onMapPointerDown"
            @pointerup="onMapPointerUp"
            @pointercancel="clearPointerState"
            @pointerleave="clearPointerState"
          >
            <div class="map-canvas" :style="mapCanvasFrameStyle">
              <svg
                :width="mapWidth"
                :height="mapHeight"
                class="booth-map"
                :style="mapSvgStyle"
              >
                <defs>
                  <linearGradient id="booth-sheen" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
                    <stop offset="30%" stop-color="#ffffff" stop-opacity="0.1" />
                    <stop offset="70%" stop-color="#000000" stop-opacity="0.02" />
                    <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
                  </linearGradient>
                  <pattern id="shippou-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                    <circle cx="0" cy="12" r="10" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                    <circle cx="24" cy="12" r="10" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                    <circle cx="12" cy="0" r="10" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                    <circle cx="12" cy="24" r="10" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                  </pattern>
                  <pattern id="asanoha-pattern" x="0" y="0" width="30" height="17.32" patternUnits="userSpaceOnUse" patternTransform="scale(0.7)">
                    <path d="M0,8.66 L15,0 L30,8.66 L15,17.32 Z" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                    <path d="M15,0 L15,17.32 M0,8.66 L30,8.66 M7.5,4.33 L22.5,12.99 M22.5,4.33 L7.5,12.99" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                  </pattern>
                  <pattern id="kikkou-pattern" x="0" y="0" width="20" height="34.64" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                    <path d="M10,0 L20,5.77 L20,11.55 L10,17.32 L0,11.55 L0,5.77 Z" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                    <path d="M10,17.32 L20,23.09 L20,28.87 L10,34.64 L0,28.87 L0,23.09 Z" fill="none" stroke="#221d14" stroke-opacity="0.12" stroke-width="1.2" />
                  </pattern>
                  <pattern id="seigaiha-pattern" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse" patternTransform="scale(0.7)">
                    <path d="M0,20 A10,10 0 0,1 20,20 A10,10 0 0,1 40,20 M0,20 A6,6 0 0,1 20,20 A6,6 0 0,1 40,20" fill="none" stroke="#221d14" stroke-opacity="0.08" stroke-width="1.2" />
                    <path d="M10,10 A10,10 0 0,1 30,10 A10,10 0 0,1 50,10 M10,10 A6,6 0 0,1 30,10 A6,6 0 0,1 50,10" fill="none" stroke="#221d14" stroke-opacity="0.08" stroke-width="1.2" />
                  </pattern>
                  <linearGradient id="booth-touch-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#fffef5" stop-opacity="0.95" />
                    <stop offset="30%" stop-color="#f9f2d4" stop-opacity="0.5" />
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
                  </linearGradient>
                  <linearGradient id="metal-plaque" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f5f1df" />
                    <stop offset="48%" stop-color="#d5c39a" />
                    <stop offset="100%" stop-color="#b29362" />
                  </linearGradient>
                  <linearGradient id="metal-line" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff9df" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="#c6a775" stop-opacity="0" />
                  </linearGradient>
                  <pattern id="wood-grain" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
                    <rect width="48" height="24" fill="#8c5a2e" />
                    <path d="M-4 8 C6 2, 18 2, 30 8 C38 12, 44 12, 54 8" fill="none" stroke="#b47b42" stroke-opacity="0.5" stroke-width="1.2" />
                    <path d="M-6 17 C6 12, 18 12, 30 17 C42 22, 50 22, 62 17" fill="none" stroke="#6f431f" stroke-opacity="0.48" stroke-width="1.2" />
                  </pattern>
                  <filter id="pine-air" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" />
                  </filter>
                  <path id="pine-silhouette" d="M0 30 C18 8, 54 8, 72 30 C58 27, 50 34, 43 46 C36 34, 24 27, 0 30 Z" />
                  <filter id="recommend-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                </defs>

                <g class="pine-atmosphere" aria-hidden="true">
                  <g class="pine-cluster pine-cluster-top" filter="url(#pine-air)">
                    <use href="#pine-silhouette" x="548" y="22" />
                    <use href="#pine-silhouette" x="592" y="12" transform="scale(0.86)" />
                    <use href="#pine-silhouette" x="516" y="38" transform="scale(0.74)" />
                  </g>
                  <g class="pine-cluster pine-cluster-bottom" filter="url(#pine-air)">
                    <use href="#pine-silhouette" x="38" y="502" transform="scale(1.02)" />
                    <use href="#pine-silhouette" x="82" y="538" transform="scale(0.82)" />
                    <use href="#pine-silhouette" x="12" y="560" transform="scale(0.74)" />
                  </g>
                </g>

                <g v-for="booth in validBooths" :key="booth.id">
                  <rect
                    v-if="!booth.isEmpty"
                    :x="booth.x"
                    :y="booth.y"
                    width="64"
                    height="64"
                    class="booth-rect"
                    :style="getBoothStyle(booth)"
                  />

                  <rect
                    v-if="!booth.isEmpty"
                    :x="booth.x"
                    :y="booth.y"
                    width="64"
                    height="64"
                    rx="8"
                    class="booth-pattern-overlay"
                    :fill="getBoothPatternUrl(booth)"
                  />

                  <rect
                    v-if="!booth.isEmpty"
                    :x="booth.x"
                    :y="booth.y"
                    width="64"
                    height="64"
                    rx="8"
                    class="booth-gradient-overlay"
                  />

                  <g
                    v-if="!booth.isEmpty"
                    class="recommend-highlight-group"
                    :class="{ 
                      'is-recommended': recommendedBoothIds.includes(booth.id),
                      'is-flickering': recommendedBoothIds.includes(booth.id)
                    }"
                    :key="`recommend-${booth.id}-${recommendBounceTrigger}`"
                  >
                    <rect
                      :x="booth.x - 2"
                      :y="booth.y - 2"
                      width="68"
                      height="68"
                      rx="10"
                      fill="none"
                      stroke="#ff9e3d"
                      stroke-width="5"
                      stroke-opacity="0.7"
                      filter="url(#recommend-glow-blur)"
                      class="recommend-glow"
                      pointer-events="none"
                    />
                    <rect
                      :x="booth.x"
                      :y="booth.y"
                      width="64"
                      height="64"
                      rx="8"
                      fill="none"
                      stroke="#ffc285"
                      stroke-width="3"
                      class="recommend-border"
                      pointer-events="none"
                    />
                  </g>

                  <rect
                    v-if="!booth.isEmpty && boothTouchHighlightId === booth.id"
                    :key="'touch-' + booth.id + '-' + boothTouchHighlightToken"
                    :x="booth.x"
                    :y="booth.y"
                    width="64"
                    height="64"
                    rx="6"
                    class="booth-touch-sheen"
                  />

                  <rect
                    v-if="!booth.isEmpty"
                    :x="booth.x"
                    :y="booth.y"
                    width="64"
                    height="64"
                    rx="8"
                    class="booth-border-overlay"
                  />

                  <rect
                    v-else
                    :x="booth.x"
                    :y="booth.y"
                    width="64"
                    height="64"
                    class="booth-rect is-empty"
                  />

                  <text
                    v-if="!booth.isEmpty"
                    :x="booth.x + 32"
                    :y="booth.y + 16"
                    text-anchor="middle"
                    class="booth-text"
                  >
                    {{ booth.id }}
                  </text>

                  <text
                    v-if="!booth.isEmpty"
                    :x="booth.x + 12"
                    :y="booth.y + 16"
                    text-anchor="middle"
                    class="visited-check"
                    :class="{ 'is-visible': visitedBoothIdSet.has(booth.id) }"
                  >
                    ✔
                  </text>

                  <text
                    v-if="!booth.isEmpty"
                    :x="booth.x + 52"
                    :y="booth.y + 16"
                    text-anchor="middle"
                    class="favorite-star"
                    :class="{ 'is-visible': favoriteBoothIdSet.has(booth.id) }"
                  >
                    ★
                  </text>

                  <template v-if="!booth.isEmpty">
                    <text
                      v-for="(line, index) in booth.nameLines"
                      :key="'name-' + index"
                      :x="booth.x + 32"
                      :y="booth.y + 44 - (booth.nameLines.length - 1) * 8 + index * 16"
                      text-anchor="middle"
                      class="booth-name-text"
                      :class="{
                        'is-small-text': booth.name === 'ラグーン ブリュワリー',
                        'is-medium-text': booth.name === 'マスカガミ'
                      }"
                    >
                      {{ line }}
                    </text>
                  </template>
                </g>

                <g class="facility-layer" aria-hidden="true">
                  <g class="facility-zone">
                    <rect
                      class="facility-zone-bg"
                      :x="FACILITY_A_CENTER_X - FACILITY_ZONE_WIDTH / 2"
                      :y="FACILITY_BASE_Y"
                      :width="FACILITY_ZONE_WIDTH"
                      :height="FACILITY_ZONE_HEIGHT"
                      rx="12"
                    />
                    <rect
                      class="facility-metal-line"
                      :x="FACILITY_A_CENTER_X - FACILITY_ZONE_WIDTH / 2 + 8"
                      :y="FACILITY_BASE_Y + 6"
                      :width="FACILITY_ZONE_WIDTH - 16"
                      :height="8"
                      rx="4"
                    />
                    <text
                      :x="FACILITY_A_CENTER_X"
                      :y="FACILITY_BASE_Y + 34"
                      text-anchor="middle"
                      class="facility-title"
                    >
                      A御猪口交換所
                    </text>
                  </g>


                </g>

                <rect
                  v-if="selectedBooth && !selectedBooth.isEmpty"
                  :x="selectedBooth.x"
                  :y="selectedBooth.y"
                  width="64"
                  height="64"
                  fill="none"
                  stroke="#8a744b"
                  stroke-width="2"
                  rx="6"
                  class="selected-highlight"
                  pointer-events="none"
                />
              </svg>
            </div>
          </div>
        </div>

        <transition name="pwa-fade">
          <PwaInstallCard
            v-if="!isZoomed && showPwaInstallCard"
            :top-text="pwaCardTopText"
            :bottom-text="pwaCardBottomText"
            :action-label="pwaCardActionLabel"
            @dismiss="dismissPwaInstallCard"
            @showGuide="openPwaInstallGuide"
          />
        </transition>

        <!-- ボトムカードエリア -->
        <transition name="rec-fade" mode="out-in">
          <!-- レコメンドカード -->
          <div
            v-if="!isZoomed && recommendation && !showFooterMessage"
            class="recommendation-card"
            :class="{ 'is-expanded': recExpanded }"
            key="recommendation"
          >
            <div class="rec-header" @click="recExpanded = !recExpanded">
              <span class="rec-icon">🌾</span>
              <span class="rec-title">次の一杯のご提案</span>
              <span class="rec-toggle-icon">{{ recExpanded ? '▴' : '▾' }}</span>
            </div>

            <!-- コンパクト表示（サマリー） -->
            <div v-if="!recExpanded" class="rec-summary" @click="recExpanded = true">
              <p v-if="recommendation.similarSummary" class="rec-summary-line">
                <span class="rec-bullet">・</span><span class="rec-summary-label">近いタイプ：</span>{{ recommendation.similarSummary }}
              </p>
              <p v-if="recommendation.oppositeSummary" class="rec-summary-line">
                <span class="rec-bullet">・</span><span class="rec-summary-label">対照タイプ：</span>{{ recommendation.oppositeSummary }}
              </p>
              <p v-if="recommendation.changeSummary" class="rec-summary-line">
                <span class="rec-bullet">・</span><span class="rec-summary-label">気分チェンジ：</span>{{ recommendation.changeSummary }}
              </p>
              <p class="rec-expand-hint">詳しく見る ▾</p>
            </div>

            <!-- 展開表示（詳細） -->
            <div v-else class="rec-body">
              <p v-if="recommendation.visitIntro" class="rec-visit-intro">{{ recommendation.visitIntro }}</p>
              <p v-if="recommendation.similarText" class="rec-line">
                <span class="rec-bullet">・</span>{{ recommendation.intro }}<br>
                <span class="rec-indent">{{ recommendation.similarText }}</span>
              </p>
              <p v-if="recommendation.oppositeText" class="rec-line">
                <span class="rec-bullet">・</span>{{ recommendation.oppositeText }}
              </p>
              <p v-if="recommendation.changeText" class="rec-line">
                <span class="rec-bullet">・</span>{{ recommendation.changeText }}
              </p>
              <p class="rec-footer">※AI傾向分析による参考提案です</p>
              <p class="rec-collapse-hint" @click.stop="recExpanded = false">閉じる ▴</p>
            </div>
          </div>

          <!-- フッターメッセージ -->
          <div
            v-else-if="!isZoomed && showFooterMessage"
            class="recommendation-card footer-message-card"
            key="footer-message"
          >
            <div class="rec-body static-message">
              <p class="message-intro">{{ activeFooterMessage.line1 }}</p>
              <p class="message-text">{{ activeFooterMessage.line2 }}</p>
            </div>
          </div>
        </transition>
      </main>

      <main v-else-if="currentView === 'favorites'" class="favorites-page">
        <FavoritesView
          :favorites="favoriteList"
          :regionStyles="regionStyleMap"
          @selectBooth="selectBooth"
        />
      </main>

      <main v-else class="progress-page">
        <ProgressView
          :breweries="breweries"
          :visitRecords="visitRecords"
          :visitedHistoryRecords="visitedHistoryRecords"
          :breweryCoordinates="breweryCoordinates"
          @resetVisited="resetVisited"
        />
      </main>
    </section>

    <PwaInstallGuideModal
      v-model="showPwaGuideModal"
      :steps="pwaGuideSteps"
    />

    <transition name="panel-slide">
      <div
        v-if="showDetailPanel"
        ref="bottomPanelRef"
        class="bottom-panel"
        :class="{ 'is-expanded': panelVisualExpanded, 'is-dragging': isPanelDragging }"
        :style="panelDragOffsetStyle"
        @pointerdown="onPanelPointerDown"
        @pointermove="onPanelPointerMove"
        @pointerup="onPanelPointerUp"
        @pointercancel="onPanelPointerCancel"
      >
        <div class="panel-handle" aria-hidden="true"></div>
        <div class="panel-header">
          <div class="title-row">
            <h2>{{ selectedBooth.name }}</h2>
            <span class="booth-id-badge">No.{{ selectedBooth.id }}</span>
          </div>
          <button class="close-btn" @click="closeDetailPanel">×</button>
        </div>

        <div class="panel-body">
          <div class="taste-bars">
            <div class="taste-row">
              <span class="taste-title">甘辛</span>
              <span class="bar-limit-label min">甘</span>
              <div class="bar-container">
                <div class="bar-bg sweet-dry-bg"></div>
                <div class="center-line"></div>
                <div
                  class="pointer"
                  :style="{ left: getBarPosition(selectedBooth.estimated.sweetDry, -2, 2) + '%' }"
                ></div>
              </div>
              <span class="bar-limit-label max">辛</span>
              <span class="taste-current-label">{{ getSweetDryLabel(selectedBooth.estimated.sweetDry) }}</span>
            </div>

            <div class="taste-row">
              <span class="taste-title">濃淡</span>
              <span class="bar-limit-label min">淡</span>
              <div class="bar-container">
                <div class="bar-bg light-rich-bg"></div>
                <div class="center-line"></div>
                <div
                  class="pointer"
                  :style="{ left: getBarPosition(selectedBooth.estimated.lightRich, -2, 2) + '%' }"
                ></div>
              </div>
              <span class="bar-limit-label max">濃</span>
              <span class="taste-current-label">{{ getLightRichLabel(selectedBooth.estimated.lightRich) }}</span>
            </div>

            <div class="taste-row">
              <span class="taste-title">香り</span>
              <span class="bar-limit-label min">控</span>
              <div class="bar-container no-center">
                <div class="bar-bg aroma-bg"></div>
                <div
                  class="pointer"
                  :style="{ left: getBarPosition(selectedBooth.estimated.aroma, 0, 4) + '%' }"
                ></div>
              </div>
              <span class="bar-limit-label max">華</span>
              <span class="taste-current-label">{{ getAromaLabel(selectedBooth.estimated.aroma) }}</span>
            </div>
            <div class="taste-disclaimer">※味わい傾向は独自AIによる分析をもとにした参考表示です</div>
          </div>

          <div v-if="panelVisualExpanded" class="brewery-extra">
            <dl class="extra-list">
              <div class="extra-item">
                <dt>住所</dt>
                <dd>{{ selectedBooth.address || '情報なし' }}</dd>
              </div>
              <div class="extra-item">
                <dt>代表銘柄</dt>
                <dd>{{ selectedBooth.brand || '情報なし' }}</dd>
              </div>
              <div class="extra-item">
                <dt>酒造紹介</dt>
                <dd>{{ selectedBooth.summary || '情報なし' }}</dd>
              </div>
              <div class="extra-item">
                <dt>URL</dt>
                <dd>
                  <a
                    v-if="selectedBooth.url"
                    class="extra-link"
                    :href="resolveExternalUrl(selectedBooth.url)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ displaySelectedBoothUrl }}
                  </a>
                  <span v-else>情報なし</span>
                </dd>
              </div>
            </dl>

            <div v-if="panelExpanded" class="memo-section">
              <h3 class="memo-title">メモ</h3>
              <textarea
                class="memo-textarea"
                :value="memoDraft"
                placeholder="気になった味わいや銘柄をメモ"
                @input="onMemoInput"
                @blur="onMemoBlur"
              ></textarea>
              <p class="memo-counter">{{ memoDraft.length }} / 200</p>
            </div>
          </div>

          <div class="visited-control">
            <div class="status-controls">
              <label class="visited-checkbox-label">
                <input
                  type="checkbox"
                  :checked="visitedBoothIdSet.has(selectedBooth.id)"
                  @change="toggleVisited(selectedBooth.id)"
                >
                <span class="checkbox-custom"></span>
                訪問済み
              </label>
              <button
                type="button"
                class="favorite-toggle-btn"
                :class="{
                  'is-active': favoriteBoothIdSet.has(selectedBooth.id),
                  'is-pulsing': favoritePulseBoothId === selectedBooth.id
                }"
                @click="toggleFavorite(selectedBooth.id)"
              >
                <span class="favorite-icon">{{ favoriteBoothIdSet.has(selectedBooth.id) ? '★' : '☆' }}</span>
                お気に入り
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ProgressView from '../components/ProgressView.vue'
import FavoritesView from '../components/FavoritesView.vue'
import PwaInstallCard from '../components/PwaInstallCard.vue'
import PwaInstallGuideModal from '../components/PwaInstallGuideModal.vue'
import { useRecommendation } from '../composables/useRecommendation.js'
import { loadBootstrapData } from '../services/bootstrapData.js'
import { getStorageItem, setStorageItem } from '../services/persistentStorage.js'
import { getFooterState, FOOTER_MESSAGES } from '../utils/footerMessage.js'

const BOOTH_SIZE = 64
const BLOCK_GAP_X = 24
const BLOCK_GAP_Y = 32
const BLOCKS_X = 7
const BLOCKS_Y = 3
const INNER_COLS = 2
const INNER_ROWS = 2

const OVERVIEW_SCALE = 0.6
const FOCUSED_SCALE = 1.08
const TAP_MOVE_THRESHOLD = 10
const TAP_TIME_THRESHOLD = 280
const PANEL_OVERLAP_FALLBACK_COLLAPSED = 164
const PANEL_OVERLAP_FALLBACK_EXPANDED = 310
const MAP_EXTRA_BOTTOM = 140
const MAP_MOTION_MS = 620
const DETAIL_RECALC_DELAY_MS = 360
const PANEL_HEIGHT_RATIO_COLLAPSED = 0.38
const PANEL_HEIGHT_RATIO_EXPANDED = 0.68
const PANEL_HEIGHT_CAP_COLLAPSED = 300
const PANEL_HEIGHT_CAP_EXPANDED = 560
const PANEL_DRAG_UP_PULL_LIMIT = 164
const PANEL_DRAG_CLOSE_THRESHOLD = 84
const PANEL_DRAG_EXPAND_THRESHOLD = 48
const PANEL_DRAG_PREVIEW_THRESHOLD = 20
const PANEL_DRAG_ACTIVATION_THRESHOLD = 6
const LOCAL_STATE_KEY = 'sakenojin_state_v1'
const MEMO_MAX_LENGTH = 200
const MEMO_SAVE_DEBOUNCE_MS = 500
const FAVORITE_PULSE_MS = 260
const BOOTH_TOUCH_HIGHLIGHT_MS = 180
const VISITED_BREWERIES_KEY = 'visitedBreweries'
const PWA_VISITED_BOOTH_KEY = 'hasVisitedBooth'
const PWA_PROMPT_DISMISSED_KEY = 'pwaPromptDismissed'
const REGION_NAME_SET = new Set(['上越', '中越', '下越', '佐渡'])

const mapWidth = BLOCKS_X * (INNER_COLS * BOOTH_SIZE) + (BLOCKS_X - 1) * BLOCK_GAP_X
const boothAreaHeight = BLOCKS_Y * (INNER_ROWS * BOOTH_SIZE) + (BLOCKS_Y - 1) * BLOCK_GAP_Y
const mapHeight = boothAreaHeight + MAP_EXTRA_BOTTOM

const FACILITY_BASE_Y = boothAreaHeight + 24
const FACILITY_ZONE_WIDTH = 232
const FACILITY_ZONE_HEIGHT = 56
const FACILITY_A_CENTER_X = Math.round(mapWidth * 0.56)

const regionDataList = [
  { id: 'kaetsu', name: '下越', color: '#D6A9B8', stroke: '#C293A4', patternId: 'asanoha-pattern' },
  { id: 'chuetsu', name: '中越', color: '#A9C8A9', stroke: '#8EAF8E', patternId: 'shippou-pattern' },
  { id: 'joetsu', name: '上越', color: '#AEB9C8', stroke: '#8E9BAC', patternId: 'kikkou-pattern' },
  { id: 'sado', name: '佐渡', color: '#D4B84F', stroke: '#B29739', patternId: 'seigaiha-pattern' }
]

const heatmapAxes = [
  { id: 'sweetDry', name: '甘辛' },
  { id: 'lightRich', name: '淡濃' },
  { id: 'aroma', name: '香り' }
]

const baseBooths = ref([])
const breweries = ref(new Map())
const boothStates = ref({})
const selectedBoothId = ref(null)
const lastTappedBoothId = ref(null)
const currentView = ref('map')
const heatmapAxis = ref('sweetDry')
const memoDraft = ref('')
const memoSaveTimerId = ref(null)
const favoritePulseBoothId = ref(null)
const favoritePulseTimerId = ref(null)
const boothTouchHighlightId = ref(null)
const boothTouchHighlightToken = ref(0)
const boothTouchHighlightTimerId = ref(null)
const recExpanded = ref(false)
const recommendedBoothIds = ref([])
const recommendBounceTrigger = ref(0)

const mapViewportRef = ref(null)
const bottomPanelRef = ref(null)
const mapScale = ref(OVERVIEW_SCALE)
const mapOffsetY = ref(0)
const panelOverlapPx = ref(0)
const pointerState = ref(null)
const panelExpanded = ref(false)
const panelDragOffsetPx = ref(0)
const panelDragState = ref(null)
const overviewAnchorBoothId = ref(null)
const mapAnimationRafId = ref(null)
const mapRecalcTimerId = ref(null)
const brewerySource = ref([])
const breweryScoresData = ref([])
const breweryFlavorData = ref([])
const visitedHistoryMap = ref({})
const showPwaInstallCard = ref(false)
const showPwaGuideModal = ref(false)
const deferredInstallPromptEvent = ref(null)
const pwaPromptPlatform = ref('other')
const canShowPwaCardByHistory = ref(false)
const pwaGuideSteps = [
  '1. 画面下の共有ボタンをタップ',
  '2. 「ホーム画面に追加」を選択'
]

const flavorAxes = {
  sweetDry: {
    min: -2,
    max: 2,
    colors: ['#f8c8dc', '#e9edf5', '#4a90e2']
  },
  lightRich: {
    min: -2,
    max: 2,
    colors: ['#dff5e1', '#f3e6d4', '#b36a2e']
  },
  aroma: {
    min: 0,
    max: 4,
    colors: ['#ede6f7', '#9a7bbd', '#3e2a6f']
  }
}

const isMapLikeView = computed(() => currentView.value === 'map' || currentView.value === 'heatmap')
const isZoomed = computed(() => mapScale.value > OVERVIEW_SCALE + 0.01)
const visitRecords = computed(() => boothStates.value)
const visitedBoothIdSet = computed(() => {
  const ids = new Set()
  Object.values(boothStates.value).forEach(state => {
    if (state.visited) ids.add(state.id)
  })
  return ids
})
const favoriteBoothIdSet = computed(() => {
  const ids = new Set()
  Object.values(boothStates.value).forEach(state => {
    if (state.favorite) ids.add(state.id)
  })
  return ids
})
const visitedBreweryIds = computed(() => Array.from(visitedBoothIdSet.value))
const visitedHistoryRecords = computed(() =>
  Object.values(visitedHistoryMap.value).sort((a, b) =>
    new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()
  )
)
const breweryCoordinates = computed(() => {
  const coordinates = {}

  validBooths.value.forEach((booth) => {
    if (booth.isEmpty) return
    coordinates[booth.id] = {
      x: booth.x + BOOTH_SIZE / 2,
      y: booth.y + BOOTH_SIZE / 2
    }
  })

  return coordinates
})

const footerMessageState = computed(() => {
  const total = validBooths.value.filter(b => !b.isEmpty).length
  return getFooterState(total, visitedBreweryIds.value.length)
})

const showFooterMessage = computed(() => {
  if (!recommendation.value) return true
  const state = footerMessageState.value
  return ['start', 'almost', 'late', 'complete'].includes(state)
})

const activeFooterMessage = computed(() => FOOTER_MESSAGES[footerMessageState.value])

const regionStyleMap = computed(() => {
  return regionDataList.reduce((acc, region) => {
    acc[region.id] = { color: region.color, stroke: region.stroke, name: region.name }
    return acc
  }, {})
})

const progressPercent = computed(() => {
  const total = breweries.value.size
  if (!total) return 0
  return Math.round((visitedBreweryIds.value.length / total) * 100)
})

const heatmapMinLabel = computed(() => {
  if (heatmapAxis.value === 'aroma') return '控えめ'
  if (heatmapAxis.value === 'lightRich') return '淡麗'
  return '甘口'
})

const heatmapMaxLabel = computed(() => {
  if (heatmapAxis.value === 'aroma') return '華やか'
  if (heatmapAxis.value === 'lightRich') return '濃醇'
  return '辛口'
})

const mapCanvasFrameStyle = computed(() => ({
  width: `${mapWidth * mapScale.value}px`,
  height: `${mapHeight * mapScale.value}px`
}))

const mapSvgStyle = computed(() => ({
  transform: `translate3d(0, ${mapOffsetY.value}px, 0) scale(${mapScale.value})`,
  transformOrigin: 'top left'
}))

const showDetailPanel = computed(() => {
  const inDetailEnabledView = isMapLikeView.value || currentView.value === 'favorites'
  return inDetailEnabledView && !!selectedBooth.value && !selectedBooth.value.isEmpty
})
const isPanelDragging = computed(() => !!panelDragState.value)
const panelVisualExpanded = computed(() => {
  if (panelExpanded.value) return true
  return isPanelDragging.value && panelDragOffsetPx.value <= -PANEL_DRAG_PREVIEW_THRESHOLD
})
const panelDragOffsetStyle = computed(() => ({
  '--panel-drag-offset': `${panelDragOffsetPx.value}px`
}))
const displaySelectedBoothUrl = computed(() => {
  const url = selectedBooth.value?.url
  if (!url) return ''
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
})

const sweetDryGradient = computed(() => `linear-gradient(to right, ${flavorAxes.sweetDry.colors[0]}, ${flavorAxes.sweetDry.colors[1]}, ${flavorAxes.sweetDry.colors[2]})`)
const lightRichGradient = computed(() => `linear-gradient(to right, ${flavorAxes.lightRich.colors[0]}, ${flavorAxes.lightRich.colors[1]}, ${flavorAxes.lightRich.colors[2]})`)
const aromaGradient = computed(() => `linear-gradient(to right, ${flavorAxes.aroma.colors[0]}, ${flavorAxes.aroma.colors[1]}, ${flavorAxes.aroma.colors[2]})`)

const sweetDryBarGradient = computed(() => `linear-gradient(to right, ${interpolateColor(-2, 'sweetDry', false)}, ${interpolateColor(0, 'sweetDry', false)}, ${interpolateColor(2, 'sweetDry', false)})`)
const lightRichBarGradient = computed(() => `linear-gradient(to right, ${interpolateColor(-2, 'lightRich', false)}, ${interpolateColor(0, 'lightRich', false)}, ${interpolateColor(2, 'lightRich', false)})`)
const aromaBarGradient = computed(() => `linear-gradient(to right, ${interpolateColor(0, 'aroma', false)}, ${interpolateColor(2, 'aroma', false)}, ${interpolateColor(4, 'aroma', false)})`)
const pwaCardTopText = computed(() => (
  pwaPromptPlatform.value === 'android'
    ? '会場でより快適にご利用いただくため'
    : ''
))
const pwaCardBottomText = computed(() => (
  pwaPromptPlatform.value === 'android'
    ? 'アプリとして追加できます'
    : 'ホーム画面に追加できます'
))
const pwaCardActionLabel = computed(() => (
  pwaPromptPlatform.value === 'android'
    ? 'アプリとして追加する'
    : '追加方法を見る'
))

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5)
const resolveExternalUrl = (url) => {
  if (!url) return '#'
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isiOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone
  return isDisplayModeStandalone || !!isiOSStandalone
}

const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

const isAndroidDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

const detectPwaPromptPlatform = () => {
  if (isIOSDevice()) return 'ios'
  if (isAndroidDevice()) return 'android'
  return 'other'
}

/*
表示条件フロー:
起動
 -> standalone モード? yes: 非表示
 -> pwaPromptDismissed === true ? yes: 非表示
 -> hasVisitedBooth === true ? no: 非表示（初回アクセス）
 -> 表示

ブース初回タップ時:
 -> hasVisitedBooth = true を保存
 -> この起動中は再評価しない（次回起動で表示）
*/
const evaluatePwaCardVisibilityOnLaunch = async () => {
  if (typeof window === 'undefined') return false
  const platform = detectPwaPromptPlatform()
  if (platform === 'other') return false
  if (isStandaloneMode()) return false
  const [dismissed, visitedBooth] = await Promise.all([
    getStorageItem(PWA_PROMPT_DISMISSED_KEY),
    getStorageItem(PWA_VISITED_BOOTH_KEY)
  ])
  if (dismissed === 'true') return false
  if (visitedBooth !== 'true') return false
  return true
}

const markHasVisitedBooth = async () => {
  if (typeof window === 'undefined') return
  if (await getStorageItem(PWA_VISITED_BOOTH_KEY) === 'true') return
  await setStorageItem(PWA_VISITED_BOOTH_KEY, 'true')
}

const dismissPwaInstallCard = () => {
  if (typeof window !== 'undefined') {
    void setStorageItem(PWA_PROMPT_DISMISSED_KEY, 'true')
  }
  showPwaInstallCard.value = false
  showPwaGuideModal.value = false
}

const onBeforeInstallPrompt = (event) => {
  event.preventDefault()
  deferredInstallPromptEvent.value = event
  if (pwaPromptPlatform.value === 'android' && canShowPwaCardByHistory.value) {
    showPwaInstallCard.value = true
  }
}

const onAppInstalled = () => {
  deferredInstallPromptEvent.value = null
  showPwaInstallCard.value = false
}

const openPwaInstallGuide = async () => {
  if (isIOSDevice()) {
    showPwaGuideModal.value = true
    return
  }

  if (isAndroidDevice() && deferredInstallPromptEvent.value) {
    const promptEvent = deferredInstallPromptEvent.value
    try {
      promptEvent.prompt()
      const result = await promptEvent.userChoice
      if (result?.outcome === 'accepted') {
        dismissPwaInstallCard()
        deferredInstallPromptEvent.value = null
        return
      }
      showPwaInstallCard.value = false
    } catch {
      // noop
    }
    deferredInstallPromptEvent.value = null
    return
  }
}

const interpolateColor = (val, axis, forHeatmap = true) => {
  const config = flavorAxes[axis]
  const normalized = (Math.max(config.min, Math.min(config.max, val)) - config.min) / (config.max - config.min)

  let hex
  if (normalized <= 0.5) {
    const t = normalized * 2
    hex = interpolateHex(config.colors[0], config.colors[1], t)
  } else {
    const t = (normalized - 0.5) * 2
    hex = interpolateHex(config.colors[1], config.colors[2], t)
  }

  if (forHeatmap) {
    return adjustSaturation(hex, 1.5)
  }
  return adjustSaturation(hex, 0.7)
}

const interpolateHex = (color1, color2, factor) => {
  const r1 = parseInt(color1.substring(1, 3), 16)
  const g1 = parseInt(color1.substring(3, 5), 16)
  const b1 = parseInt(color1.substring(5, 7), 16)

  const r2 = parseInt(color2.substring(1, 3), 16)
  const g2 = parseInt(color2.substring(3, 5), 16)
  const b2 = parseInt(color2.substring(5, 7), 16)

  const r = Math.round(r1 + factor * (r2 - r1))
  const g = Math.round(g1 + factor * (g2 - g1))
  const b = Math.round(b1 + factor * (b2 - b1))

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const adjustSaturation = (hex, factor) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255
  let g = parseInt(hex.substring(3, 5), 16) / 255
  let b = parseInt(hex.substring(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h
  let s
  const l = (max + min) / 2

  if (max === min) {
    h = 0
    s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }

  s = Math.min(1, s * factor)

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const hue2rgb = (pv, qv, t) => {
    let temp = t
    if (temp < 0) temp += 1
    if (temp > 1) temp -= 1
    if (temp < 1 / 6) return pv + (qv - pv) * 6 * temp
    if (temp < 1 / 2) return qv
    if (temp < 2 / 3) return pv + (qv - pv) * (2 / 3 - temp) * 6
    return pv
  }

  r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
  g = Math.round(hue2rgb(p, q, h) * 255)
  b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const getBoothPatternUrl = (booth) => {
  if (booth.isEmpty) return 'none'
  const regionDef = regionDataList.find(r => r.id === booth.region)
  return regionDef && regionDef.patternId ? `url(#${regionDef.patternId})` : 'url(#shippou-pattern)'
}

const getBoothStyle = (booth) => {
  if (booth.isEmpty) return {}

  const isVisited = visitedBoothIdSet.value.has(booth.id)
  let fill = '#e5e7eb'
  let stroke = '#ffffff'

  if (currentView.value === 'map') {
    const regionDef = regionDataList.find(r => r.id === booth.region)
    if (regionDef) {
      fill = regionDef.color
      stroke = regionDef.stroke
    }
  } else {
    fill = interpolateColor(booth.estimated[heatmapAxis.value], heatmapAxis.value, true)
    stroke = adjustSaturation(fill, 1.2)
  }

  return {
    fill,
    stroke,
    strokeWidth: '2px',
    opacity: currentView.value === 'map' ? (isVisited ? 1 : 0.42) : 1
  }
}

const formatNameWithLineBreaks = (rawName) => {
  const clean = rawName
    .replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '')
    .trim()

  if (clean.includes(' ')) return clean.split(' ')
  if (clean.includes('　')) return clean.split('　')
  if (clean === 'よしかわ杜氏の郷') return ['よしかわ', '杜氏の郷']

  const suffixes = ['酒造場', '酒造店', '醸造所', '酒造', '醸造', 'ブリュワリー']
  for (const suffix of suffixes) {
    if (clean.endsWith(suffix) && clean !== suffix) {
      const prefix = clean.slice(0, -suffix.length)
      return [prefix, suffix]
    }
  }

  if (clean.length >= 7) {
    const mid = Math.ceil(clean.length / 2)
    return [clean.slice(0, mid), clean.slice(mid)]
  }

  return [clean]
}

const generateGridCoordinates = () => {
  const COLS = BLOCKS_X * INNER_COLS
  const ROWS = BLOCKS_Y * INNER_ROWS

  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const bx = Math.floor(c / INNER_COLS)
      const by = Math.floor(r / INNER_ROWS)
      const x = bx * (INNER_COLS * BOOTH_SIZE + BLOCK_GAP_X) + (c % INNER_COLS) * BOOTH_SIZE
      const y = by * (INNER_ROWS * BOOTH_SIZE + BLOCK_GAP_Y) + (r % INNER_ROWS) * BOOTH_SIZE
      grid[r][c] = { x, y }
    }
  }

  return { grid, ROWS, COLS }
}

const generateBooths = (grid, ROWS, COLS) => {
  const generatedBooths = []
  let currentId = 1
  let cellCount = 0

  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = COLS - 1; c >= 0; c--) {
      const { x, y } = grid[r][c]
      let isEmptyBooth = false

      if (cellCount === 34 && currentId === 35) {
        isEmptyBooth = true
      } else if (cellCount === 48 && currentId === 48) {
        isEmptyBooth = true
      }

      if (isEmptyBooth) {
        generatedBooths.push({ id: `empty-${cellCount}`, x, y, isEmpty: true })
      } else if (currentId <= 82) {
        generatedBooths.push({ id: String(currentId), x, y, isEmpty: false })
        currentId++
      }
      cellCount++
    }
  }

  return generatedBooths
}

const prepareDataSources = async () => {
  const loaded = await loadBootstrapData()
  brewerySource.value = Array.isArray(loaded.breweriesData) ? loaded.breweriesData : []
  breweryScoresData.value = Array.isArray(loaded.breweryScores) ? loaded.breweryScores : []
  breweryFlavorData.value = Array.isArray(loaded.breweryFlavor) ? loaded.breweryFlavor : []
}

const attachBreweries = () => {
  const breweryMap = new Map()
  const scoreMap = new Map()
  const summaryMap = new Map()

  breweryScoresData.value.forEach(s => {
    scoreMap.set(s.id, s)
  })
  breweryFlavorData.value.forEach(f => {
    if (f && f.id) {
      summaryMap.set(f.id, f.summary || '')
    }
  })

  for (const b of brewerySource.value) {
    const rawName = b['酒造名']
    const cleanName = rawName
      .replace(/(株式会社|\(株\)|有限会社|\(有\)|合名会社|\(名\)|合資会社|\(資\)|合同会社|\(同\))/g, '')
      .trim()

    const regionNameJa = b['地域'] || b['地区'] || null
    let regionId = regionNameJa
    if (regionId === '下越') regionId = 'kaetsu'
    else if (regionId === '中越') regionId = 'chuetsu'
    else if (regionId === '上越') regionId = 'joetsu'
    else if (regionId === '佐渡') regionId = 'sado'

    const score = scoreMap.get(b.id)
    const taste = score
      ? {
          sweetDry: score.relative.sweetDry_z,
          lightRich: score.relative.lightRich_z,
          aroma: score.relative.aroma_z
        }
      : { sweetDry: 0, lightRich: 0, aroma: 0 }

    breweryMap.set(b.id, {
      id: b.id,
      name: cleanName,
      rawName,
      region: regionId,
      regionName: regionNameJa,
      municipality: b['市町村'] || '',
      taste,
      address: b['住所'] || '',
      brand: b['代表銘柄'] || '',
      url: b.URL || '',
      summary: summaryMap.get(b.id) || ''
    })
  }

  breweries.value = breweryMap
}

const initMap = () => {
  const { grid, ROWS, COLS } = generateGridCoordinates()
  baseBooths.value = generateBooths(grid, ROWS, COLS)
  attachBreweries()
}

const createDefaultBoothState = (id) => ({
  id: String(id),
  visited: false,
  favorite: false,
  memo: ''
})

const ensureBoothState = (id) => {
  const key = String(id)
  if (!boothStates.value[key]) {
    boothStates.value[key] = createDefaultBoothState(key)
  }
  return boothStates.value[key]
}

const ensureAllBoothStates = () => {
  let added = false
  const next = { ...boothStates.value }
  for (const [id] of breweries.value) {
    if (!next[id]) {
      next[id] = createDefaultBoothState(id)
      added = true
    }
  }
  if (added) {
    boothStates.value = next
  }
  return added
}

const normalizeStateMap = (parsed) => {
  const normalized = {}
  let shouldRewrite = false

  const assignNormalized = (id, raw) => {
    const key = String(id)
    if (!key) return

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const memoRaw = typeof raw.memo === 'string' ? raw.memo : ''
      const memo = memoRaw.slice(0, MEMO_MAX_LENGTH)
      normalized[key] = {
        id: key,
        visited: !!raw.visited,
        favorite: typeof raw.favorite === 'boolean' ? raw.favorite : false,
        memo
      }
      if (
        String(raw.id ?? key) !== key ||
        typeof raw.favorite !== 'boolean' ||
        typeof raw.memo !== 'string' ||
        raw.memo !== memo
      ) {
        shouldRewrite = true
      }
      return
    }

    shouldRewrite = true
    normalized[key] = {
      id: key,
      visited: !!raw,
      favorite: false,
      memo: ''
    }
  }

  if (Array.isArray(parsed)) {
    shouldRewrite = true
    parsed.forEach((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        if (entry.id != null) {
          assignNormalized(entry.id, entry)
        }
      } else if (entry != null) {
        assignNormalized(String(entry), { id: String(entry), visited: true })
      }
    })
  } else if (parsed && typeof parsed === 'object') {
    Object.entries(parsed).forEach(([id, raw]) => assignNormalized(id, raw))
  } else {
    shouldRewrite = true
  }

  return { normalized, shouldRewrite }
}

const buildLegacyStateMap = async () => {
  const visitedIds = new Set()

  const visitedBreweries = await getStorageItem(VISITED_BREWERIES_KEY)
  if (visitedBreweries) {
    try {
      const parsed = JSON.parse(visitedBreweries)
      if (Array.isArray(parsed)) {
        parsed.forEach((entry) => {
          if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
            const legacyId = entry.breweryId ?? entry.id
            if (legacyId != null) visitedIds.add(String(legacyId))
            return
          }
          if (entry != null) visitedIds.add(String(entry))
        })
      }
    } catch {
      // noop
    }
  }

  const sakeVisited = await getStorageItem('sake_visited')
  if (sakeVisited) {
    try {
      const parsed = JSON.parse(sakeVisited)
      if (Array.isArray(parsed)) {
        parsed.forEach(id => visitedIds.add(String(id)))
      } else if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach((id) => {
          if (parsed[id]?.visited) visitedIds.add(String(id))
        })
      }
    } catch {
      // noop
    }
  }

  const legacy = {}
  visitedIds.forEach((id) => {
    legacy[id] = {
      id,
      visited: true,
      favorite: false,
      memo: ''
    }
  })
  return legacy
}

const normalizeVisitedHistoryRecords = (parsed) => {
  const normalized = {}
  let shouldRewrite = false

  if (!Array.isArray(parsed)) {
    return { normalized, shouldRewrite: true }
  }

  parsed.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      shouldRewrite = true
      return
    }

    const breweryIdRaw = entry.breweryId ?? entry.id
    if (breweryIdRaw == null) {
      shouldRewrite = true
      return
    }

    const breweryId = String(breweryIdRaw)
    const brew = breweries.value.get(breweryId)
    const name = typeof entry.breweryName === 'string' && entry.breweryName
      ? entry.breweryName
      : (brew?.name || `不明 ${breweryId}`)
    const region = REGION_NAME_SET.has(entry.region)
      ? entry.region
      : (REGION_NAME_SET.has(brew?.regionName) ? brew.regionName : null)

    if (!region) {
      shouldRewrite = true
      return
    }

    const time = new Date(entry.visitedAt)
    const hasValidTimestamp = !Number.isNaN(time.getTime())
    const visitedAt = hasValidTimestamp ? time.toISOString() : new Date().toISOString()
    if (!hasValidTimestamp) {
      shouldRewrite = true
    }

    normalized[breweryId] = {
      breweryId,
      breweryName: name,
      region,
      visitedAt
    }
  })

  if (Object.keys(normalized).length !== parsed.length) {
    shouldRewrite = true
  }

  return { normalized, shouldRewrite }
}

const saveVisitedHistory = () => {
  const records = Object.values(visitedHistoryMap.value).sort((a, b) =>
    new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()
  )
  void setStorageItem(VISITED_BREWERIES_KEY, JSON.stringify(records))
}

const loadVisitedHistory = async () => {
  const raw = await getStorageItem(VISITED_BREWERIES_KEY)
  if (!raw) {
    visitedHistoryMap.value = {}
    return false
  }

  try {
    const parsed = JSON.parse(raw)
    const { normalized, shouldRewrite } = normalizeVisitedHistoryRecords(parsed)
    visitedHistoryMap.value = normalized
    return shouldRewrite
  } catch {
    visitedHistoryMap.value = {}
    return true
  }
}

const syncVisitedHistoryWithState = () => {
  const next = {}
  let changed = false

  for (const [id, state] of Object.entries(boothStates.value)) {
    if (!state?.visited) continue

    const brewery = breweries.value.get(id)
    if (!brewery) continue
    if (!REGION_NAME_SET.has(brewery.regionName)) continue

    const existing = visitedHistoryMap.value[id]
    const visitedAt = existing?.visitedAt || new Date().toISOString()
    const record = {
      breweryId: id,
      breweryName: brewery.name || existing?.breweryName || `不明 ${id}`,
      region: brewery.regionName,
      visitedAt
    }

    next[id] = record

    if (
      !existing ||
      existing.breweryName !== record.breweryName ||
      existing.region !== record.region ||
      existing.visitedAt !== record.visitedAt
    ) {
      changed = true
    }
  }

  if (!changed) {
    const currentKeys = Object.keys(visitedHistoryMap.value)
    const nextKeys = Object.keys(next)
    if (currentKeys.length !== nextKeys.length) {
      changed = true
    } else {
      for (const key of nextKeys) {
        if (!visitedHistoryMap.value[key]) {
          changed = true
          break
        }
      }
    }
  }

  visitedHistoryMap.value = next
  return changed
}

const setVisitedHistoryForBooth = (id) => {
  const key = String(id)
  const brewery = breweries.value.get(key)
  if (!brewery || !REGION_NAME_SET.has(brewery.regionName)) return

  const existing = visitedHistoryMap.value[key]
  const next = {
    ...visitedHistoryMap.value,
    [key]: {
      breweryId: key,
      breweryName: brewery.name || existing?.breweryName || `不明 ${key}`,
      region: brewery.regionName,
      visitedAt: existing?.visitedAt || new Date().toISOString()
    }
  }
  visitedHistoryMap.value = next
}

const removeVisitedHistoryForBooth = (id) => {
  const key = String(id)
  if (!visitedHistoryMap.value[key]) return

  const next = { ...visitedHistoryMap.value }
  delete next[key]
  visitedHistoryMap.value = next
}

const triggerLightHaptic = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(10)
  }
}

const saveBoothStates = ({ withHaptics = false } = {}) => {
  void setStorageItem(LOCAL_STATE_KEY, JSON.stringify(boothStates.value))
  if (withHaptics) {
    triggerLightHaptic()
  }
}

const loadBoothStates = async () => {
  let loaded = {}
  let shouldRewrite = false

  const stored = await getStorageItem(LOCAL_STATE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const result = normalizeStateMap(parsed)
      loaded = result.normalized
      shouldRewrite = result.shouldRewrite
    } catch {
      shouldRewrite = true
    }
  }

  if (!Object.keys(loaded).length) {
    const legacy = await buildLegacyStateMap()
    if (Object.keys(legacy).length) {
      loaded = legacy
      shouldRewrite = true
    }
  }

  boothStates.value = loaded
  if (ensureAllBoothStates()) {
    shouldRewrite = true
  }
  const shouldRewriteHistory = await loadVisitedHistory()
  const syncedHistory = syncVisitedHistoryWithState()
  if (shouldRewrite) {
    saveBoothStates()
  }
  if (shouldRewriteHistory || syncedHistory) {
    saveVisitedHistory()
  }
}

const mapBoothsWithBreweryData = computed(() => {
  return baseBooths.value.map(booth => {
    if (booth.isEmpty) {
      return { ...booth }
    }

    const brewery = breweries.value.get(booth.id)
    const name = brewery ? brewery.name : `不明 ${booth.id}`
    const rawName = brewery ? brewery.rawName : `不明 ${booth.id}`

    return {
      ...booth,
      name,
      nameLines: formatNameWithLineBreaks(rawName),
      estimated: brewery ? brewery.taste : { sweetDry: 0, lightRich: 0, aroma: 0 },
      region: brewery ? brewery.region : null,
      address: brewery ? brewery.address : '',
      brand: brewery ? brewery.brand : '',
      url: brewery ? brewery.url : '',
      summary: brewery ? brewery.summary : ''
    }
  })
})

const favoriteList = computed(() => {
  const favorites = []
  for (const booth of mapBoothsWithBreweryData.value) {
    if (booth.isEmpty) continue
    const state = boothStates.value[booth.id]
    if (!state?.favorite) continue
    favorites.push({
      ...booth,
      visited: !!state.visited
    })
  }
  return favorites
})

const validBooths = computed(() => mapBoothsWithBreweryData.value)

const selectedBooth = computed(() => {
  return mapBoothsWithBreweryData.value.find(b => b.id === selectedBoothId.value) || null
})

const { recommendation } = useRecommendation(validBooths, boothStates, lastTappedBoothId)

watch(recommendation, () => { recExpanded.value = false })

watch(recExpanded, (expanded) => {
  if (!expanded || !recommendation.value) {
    recommendedBoothIds.value = []
    return
  }

  const ids = []
  const recs = [
    recommendation.value.similarBooth,
    recommendation.value.oppositeBooth,
    recommendation.value.changeBooth
  ]
  const targetBooths = []
  
  for (const b of recs) {
    if (b) {
      ids.push(b.id)
      targetBooths.push(b)
    }
  }
  
  recommendedBoothIds.value = ids
  recommendBounceTrigger.value = performance.now()

  if (targetBooths.length > 0) {
    const viewport = mapViewportRef.value
    if (!viewport) return

    const targetScale = OVERVIEW_SCALE
    const scaledWidth = mapWidth * targetScale
    const scaledHeight = mapHeight * targetScale

    let sumX = 0
    let sumY = 0
    for (const b of targetBooths) {
      sumX += b.x + BOOTH_SIZE / 2
      sumY += b.y + BOOTH_SIZE / 2
    }
    const centerX = (sumX / targetBooths.length) * targetScale
    const centerY = (sumY / targetBooths.length) * targetScale

    const maxScrollLeft = Math.max(0, scaledWidth - viewport.clientWidth)
    const maxScrollTop = Math.max(0, scaledHeight - viewport.clientHeight)
    const targetLeft = clamp(centerX - viewport.clientWidth / 2, 0, maxScrollLeft)

    const estimatedPanelOverlap = estimatePanelOverlap()
    const safeBottom = Math.max(panelOverlapPx.value, estimatedPanelOverlap) + 16
    const topPadding = 24
    const maxVisibleY = Math.max(topPadding + 24, viewport.clientHeight - safeBottom - 24)
    const targetY = (topPadding + maxVisibleY) / 2

    const unclampedOffset = targetY - centerY
    let targetOffsetY = 0
    let targetTop = 0

    if (scaledHeight > viewport.clientHeight) {
      targetTop = clamp(centerY - targetY, 0, maxScrollTop)
      targetOffsetY = 0
    } else {
      const centeredOffset = (viewport.clientHeight - scaledHeight) / 2
      const travel = Math.max(24, panelOverlapPx.value * 0.75)
      const minOffset = centeredOffset - travel
      const maxOffset = centeredOffset + 24
      targetOffsetY = clamp(unclampedOffset, minOffset, maxOffset)
      targetTop = 0
    }

    const isVisible = (b) => {
      const bScreenY = (b.y + BOOTH_SIZE / 2) * targetScale + targetOffsetY - targetTop
      const bScreenX = (b.x + BOOTH_SIZE / 2) * targetScale - targetLeft
      return bScreenY >= topPadding && bScreenY <= (viewport.clientHeight - safeBottom) &&
             bScreenX >= 0 && bScreenX <= viewport.clientWidth
    }

    const anyVisible = targetBooths.some(isVisible)
    
    if (!anyVisible) {
      centerOnBooth(targetBooths[0], {
        smooth: true,
        targetScale: OVERVIEW_SCALE,
        panelAware: true
      })
    } else {
      animateMapState({
        targetScale,
        targetLeft,
        targetTop,
        targetOffsetY,
        smooth: true
      })
    }
  }
})

const findNearestBooth = (mapX, mapY) => {
  let nearest = null
  let minDistanceSq = Number.POSITIVE_INFINITY

  for (const booth of validBooths.value) {
    if (booth.isEmpty) continue

    const centerX = booth.x + BOOTH_SIZE / 2
    const centerY = booth.y + BOOTH_SIZE / 2
    const dx = centerX - mapX
    const dy = centerY - mapY
    const distanceSq = dx * dx + dy * dy

    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq
      nearest = booth
    }
  }

  return nearest
}

const findNearestBoothFromEvent = (event) => {
  const viewport = mapViewportRef.value
  if (!viewport) return null

  const viewportRect = viewport.getBoundingClientRect()
  const localX = clamp(event.clientX - viewportRect.left, 0, viewportRect.width)
  const localY = clamp(event.clientY - viewportRect.top, 0, viewportRect.height)

  const mapX = (viewport.scrollLeft + localX) / mapScale.value
  const mapY = (viewport.scrollTop + localY - mapOffsetY.value) / mapScale.value

  if (mapY < 0 || mapY > boothAreaHeight) return null

  return findNearestBooth(mapX, mapY)
}

const refreshPanelOverlap = () => {
  if (!showDetailPanel.value) {
    panelOverlapPx.value = 0
    return
  }

  const viewport = mapViewportRef.value
  const panel = bottomPanelRef.value
  if (!viewport || !panel) return

  const viewportRect = viewport.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()

  panelOverlapPx.value = Math.max(0, viewportRect.bottom - panelRect.top)
}

const estimatePanelOverlap = () => {
  const viewport = mapViewportRef.value
  const fallback = panelExpanded.value ? PANEL_OVERLAP_FALLBACK_EXPANDED : PANEL_OVERLAP_FALLBACK_COLLAPSED
  if (!viewport) return fallback

  const ratio = panelExpanded.value ? PANEL_HEIGHT_RATIO_EXPANDED : PANEL_HEIGHT_RATIO_COLLAPSED
  const cap = panelExpanded.value ? PANEL_HEIGHT_CAP_EXPANDED : PANEL_HEIGHT_CAP_COLLAPSED
  const estimatedPanelHeight = Math.min(window.innerHeight * ratio, cap)
  const boundedHeight = Math.min(viewport.clientHeight - 24, estimatedPanelHeight + 18)
  return Math.max(fallback, boundedHeight)
}

const cancelMapAnimation = () => {
  if (mapAnimationRafId.value !== null) {
    cancelAnimationFrame(mapAnimationRafId.value)
    mapAnimationRafId.value = null
  }
}

const cancelRecalcTimer = () => {
  if (mapRecalcTimerId.value !== null) {
    clearTimeout(mapRecalcTimerId.value)
    mapRecalcTimerId.value = null
  }
}

const animateMapState = ({ targetScale, targetLeft, targetTop, targetOffsetY, smooth = true }) => {
  const viewport = mapViewportRef.value
  if (!viewport) return

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finalMaxScrollLeft = Math.max(0, mapWidth * targetScale - viewport.clientWidth)
  const finalMaxScrollTop = Math.max(0, mapHeight * targetScale - viewport.clientHeight)
  const resolvedTargetLeft = clamp(targetLeft, 0, finalMaxScrollLeft)
  const resolvedTargetTop = clamp(targetTop, 0, finalMaxScrollTop)

  if (!smooth || reduced) {
    cancelMapAnimation()
    mapScale.value = targetScale
    mapOffsetY.value = targetOffsetY
    viewport.scrollLeft = resolvedTargetLeft
    viewport.scrollTop = resolvedTargetTop
    return
  }

  cancelMapAnimation()

  const startScale = mapScale.value
  const startLeft = viewport.scrollLeft
  const startTop = viewport.scrollTop
  const startOffsetY = mapOffsetY.value
  const startedAt = performance.now()

  const tick = (now) => {
    const elapsed = now - startedAt
    const progress = clamp(elapsed / MAP_MOTION_MS, 0, 1)
    const eased = easeOutQuint(progress)

    const nextScale = startScale + (targetScale - startScale) * eased
    const nextOffsetY = startOffsetY + (targetOffsetY - startOffsetY) * eased
    const nextLeftRaw = startLeft + (resolvedTargetLeft - startLeft) * eased
    const nextTopRaw = startTop + (resolvedTargetTop - startTop) * eased
    const currentMaxScrollLeft = Math.max(0, mapWidth * nextScale - viewport.clientWidth)
    const currentMaxScrollTop = Math.max(0, mapHeight * nextScale - viewport.clientHeight)

    mapScale.value = nextScale
    mapOffsetY.value = nextOffsetY
    viewport.scrollLeft = clamp(nextLeftRaw, 0, currentMaxScrollLeft)
    viewport.scrollTop = clamp(nextTopRaw, 0, currentMaxScrollTop)

    if (progress < 1) {
      mapAnimationRafId.value = requestAnimationFrame(tick)
    } else {
      mapScale.value = targetScale
      mapOffsetY.value = targetOffsetY
      viewport.scrollLeft = resolvedTargetLeft
      viewport.scrollTop = resolvedTargetTop
      mapAnimationRafId.value = null
    }
  }

  mapAnimationRafId.value = requestAnimationFrame(tick)
}

const centerOverview = (smooth = true) => {
  const viewport = mapViewportRef.value
  if (!viewport) return

  const scaledWidth = mapWidth * OVERVIEW_SCALE
  const scaledHeight = mapHeight * OVERVIEW_SCALE
  const maxScrollLeft = Math.max(0, scaledWidth - viewport.clientWidth)
  const maxScrollTop = Math.max(0, scaledHeight - viewport.clientHeight)
  const targetLeft = maxScrollLeft / 2
  const targetTop = maxScrollTop / 2
  const centeredOffsetY = scaledHeight <= viewport.clientHeight
    ? Math.max(0, (viewport.clientHeight - scaledHeight) / 2)
    : 0

  animateMapState({
    targetScale: OVERVIEW_SCALE,
    targetLeft,
    targetTop,
    targetOffsetY: centeredOffsetY,
    smooth
  })
}

const centerOnBooth = (booth, { smooth = true, targetScale = FOCUSED_SCALE, panelAware = true } = {}) => {
  const viewport = mapViewportRef.value
  if (!viewport || !booth) return

  const scaledWidth = mapWidth * targetScale
  const scaledHeight = mapHeight * targetScale

  const centerX = (booth.x + BOOTH_SIZE / 2) * targetScale
  const centerY = (booth.y + BOOTH_SIZE / 2) * targetScale

  const maxScrollLeft = Math.max(0, scaledWidth - viewport.clientWidth)
  const maxScrollTop = Math.max(0, scaledHeight - viewport.clientHeight)
  const targetLeft = clamp(centerX - viewport.clientWidth / 2, 0, maxScrollLeft)

  const estimatedPanelOverlap = estimatePanelOverlap()
  const safeBottom = panelAware
    ? Math.max(panelOverlapPx.value, estimatedPanelOverlap) + 16
    : 16
  const topPadding = 24
  const maxVisibleY = Math.max(topPadding + 24, viewport.clientHeight - safeBottom - 24)
  const targetY = (topPadding + maxVisibleY) / 2

  const unclampedOffset = targetY - centerY
  let targetOffsetY = 0
  let targetTop = 0

  if (scaledHeight > viewport.clientHeight) {
    targetTop = clamp(centerY - targetY, 0, maxScrollTop)
    targetOffsetY = 0
  } else {
    const centeredOffset = (viewport.clientHeight - scaledHeight) / 2
    const travel = panelAware ? Math.max(24, panelOverlapPx.value * 0.75) : 100
    const minOffset = centeredOffset - travel
    const maxOffset = centeredOffset + 24
    targetOffsetY = clamp(unclampedOffset, minOffset, maxOffset)
    targetTop = 0
  }

  animateMapState({
    targetScale,
    targetLeft,
    targetTop,
    targetOffsetY,
    smooth
  })
}

const focusCurrentSelection = (smooth = true) => {
  if (!isMapLikeView.value) return

  if (selectedBooth.value && !selectedBooth.value.isEmpty) {
    centerOnBooth(selectedBooth.value, {
      smooth,
      targetScale: FOCUSED_SCALE,
      panelAware: true
    })
    return
  }

  if (overviewAnchorBoothId.value) {
    const anchoredBooth = validBooths.value.find(b => b.id === overviewAnchorBoothId.value && !b.isEmpty)
    if (anchoredBooth) {
      centerOnBooth(anchoredBooth, {
        smooth,
        targetScale: OVERVIEW_SCALE,
        panelAware: false
      })
      return
    }
  }

  centerOverview(smooth)
}

const scheduleFocusRecalc = (smooth = false) => {
  requestAnimationFrame(() => {
    refreshPanelOverlap()
    focusCurrentSelection(smooth)
  })
}

const selectBooth = (booth) => {
  if (!booth || booth.isEmpty) return

  void markHasVisitedBooth()
  triggerBoothTouchHighlight(booth.id)
  overviewAnchorBoothId.value = null
  const sameBooth = selectedBoothId.value === booth.id
  if (!sameBooth) {
    panelExpanded.value = false
  }
  panelDragOffsetPx.value = 0
  panelDragState.value = null
  selectedBoothId.value = booth.id
  lastTappedBoothId.value = booth.id

  if (sameBooth) {
    scheduleFocusRecalc(true)
  }
}

const closeDetailPanel = () => {
  panelExpanded.value = false
  panelDragOffsetPx.value = 0
  panelDragState.value = null
  overviewAnchorBoothId.value = selectedBoothId.value
  selectedBoothId.value = null
}

const onPanelPointerDown = (event) => {
  if (!showDetailPanel.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  panelDragState.value = {
    pointerId: event.pointerId,
    startY: event.clientY,
    active: false
  }
  panelDragOffsetPx.value = 0
}

const onPanelPointerMove = (event) => {
  const drag = panelDragState.value
  if (!drag || drag.pointerId !== event.pointerId) return

  const deltaY = event.clientY - drag.startY
  if (!drag.active) {
    if (Math.abs(deltaY) < PANEL_DRAG_ACTIVATION_THRESHOLD) return
    drag.active = true
    const panel = bottomPanelRef.value
    if (panel && panel.setPointerCapture) {
      panel.setPointerCapture(event.pointerId)
    }
  }

  if (deltaY >= 0) {
    panelDragOffsetPx.value = Math.min(deltaY, 420)
  } else if (panelExpanded.value) {
    panelDragOffsetPx.value = Math.max(deltaY * 0.45, -72)
  } else {
    panelDragOffsetPx.value = Math.max(deltaY, -PANEL_DRAG_UP_PULL_LIMIT)
  }

  if (event.cancelable) {
    event.preventDefault()
  }
}

const settlePanelDrag = (event, cancelled = false) => {
  const drag = panelDragState.value
  if (!drag || drag.pointerId !== event.pointerId) return

  const panel = bottomPanelRef.value
  if (panel && panel.hasPointerCapture && panel.hasPointerCapture(event.pointerId)) {
    panel.releasePointerCapture(event.pointerId)
  }

  const wasActiveDrag = drag.active
  const deltaY = panelDragOffsetPx.value
  panelDragState.value = null
  panelDragOffsetPx.value = 0

  if (!wasActiveDrag) return
  if (cancelled) return

  if (deltaY >= PANEL_DRAG_CLOSE_THRESHOLD) {
    closeDetailPanel()
    return
  }

  if (deltaY <= -PANEL_DRAG_EXPAND_THRESHOLD && !panelExpanded.value) {
    panelExpanded.value = true
  }
}

const onPanelPointerUp = (event) => {
  settlePanelDrag(event, false)
}

const onPanelPointerCancel = (event) => {
  settlePanelDrag(event, true)
}

const onMapPointerDown = (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  // Prioritize user drag/scroll over pending auto-focus motion.
  cancelMapAnimation()
  cancelRecalcTimer()

  pointerState.value = {
    x: event.clientX,
    y: event.clientY,
    time: Date.now()
  }
}

const onMapPointerUp = (event) => {
  const start = pointerState.value
  pointerState.value = null
  if (!start) return

  const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)
  const elapsed = Date.now() - start.time
  if (moved > TAP_MOVE_THRESHOLD || elapsed > TAP_TIME_THRESHOLD) return

  const nearest = findNearestBoothFromEvent(event)
  if (nearest) {
    selectBooth(nearest)
  }
}

const clearPointerState = () => {
  pointerState.value = null
}

const clearFavoritePulseTimer = () => {
  if (favoritePulseTimerId.value !== null) {
    clearTimeout(favoritePulseTimerId.value)
    favoritePulseTimerId.value = null
  }
}

const clearBoothTouchHighlightTimer = () => {
  if (boothTouchHighlightTimerId.value !== null) {
    clearTimeout(boothTouchHighlightTimerId.value)
    boothTouchHighlightTimerId.value = null
  }
}

const triggerBoothTouchHighlight = (id) => {
  clearBoothTouchHighlightTimer()
  boothTouchHighlightId.value = id
  boothTouchHighlightToken.value += 1
  boothTouchHighlightTimerId.value = setTimeout(() => {
    boothTouchHighlightId.value = null
    boothTouchHighlightTimerId.value = null
  }, BOOTH_TOUCH_HIGHLIGHT_MS)
}

const startFavoritePulse = (id) => {
  clearFavoritePulseTimer()
  favoritePulseBoothId.value = id
  favoritePulseTimerId.value = setTimeout(() => {
    favoritePulseBoothId.value = null
    favoritePulseTimerId.value = null
  }, FAVORITE_PULSE_MS)
}

const clearMemoSaveTimer = () => {
  if (memoSaveTimerId.value !== null) {
    clearTimeout(memoSaveTimerId.value)
    memoSaveTimerId.value = null
  }
}

const scheduleMemoSave = () => {
  clearMemoSaveTimer()
  memoSaveTimerId.value = setTimeout(() => {
    memoSaveTimerId.value = null
    saveBoothStates({ withHaptics: true })
  }, MEMO_SAVE_DEBOUNCE_MS)
}

const toggleVisited = (id) => {
  const state = ensureBoothState(id)
  const nextVisited = !state.visited
  state.visited = nextVisited
  if (nextVisited) {
    setVisitedHistoryForBooth(id)
  } else {
    removeVisitedHistoryForBooth(id)
  }
  saveBoothStates({ withHaptics: true })
  saveVisitedHistory()
}

const toggleFavorite = (id) => {
  const state = ensureBoothState(id)
  state.favorite = !state.favorite
  startFavoritePulse(id)
  saveBoothStates({ withHaptics: true })
}

const onMemoBlur = () => {
  // iPhone Safari focus/scroll adjustment
  window.scrollTo(0, window.scrollY)
}

const onMemoInput = (event) => {
  if (!selectedBoothId.value) return

  const value = String(event.target.value || '').slice(0, MEMO_MAX_LENGTH)
  memoDraft.value = value
  const state = ensureBoothState(selectedBoothId.value)
  state.memo = value
  scheduleMemoSave()
}

const getBarPosition = (z, min, max) => {
  const clipped = Math.max(min, Math.min(max, z))
  return ((clipped - min) / (max - min)) * 100
}

const getSweetDryLabel = (z) => {
  if (z >= 1.5) return '超辛口'
  if (z >= 0.8) return '辛口'
  if (z >= 0.3) return 'やや辛口'
  if (z >= -0.3) return '中間'
  if (z >= -0.8) return 'やや甘口'
  if (z >= -1.5) return '甘口'
  return '超甘口'
}

const getLightRichLabel = (z) => {
  if (z >= 1.5) return '超濃醇'
  if (z >= 0.8) return '濃醇'
  if (z >= 0.3) return 'やや濃醇'
  if (z >= -0.3) return '中間'
  if (z >= -0.8) return 'やや淡麗'
  if (z >= -1.5) return '淡麗'
  return '超淡麗'
}

const getAromaLabel = (z) => {
  if (z >= 1.5) return '華やか'
  if (z >= 0.8) return 'やや華やか'
  if (z >= 0.3) return 'ほどよい'
  return '控えめ'
}

const resetVisited = () => {
  if (confirm('訪問履歴をすべてリセットしますか？')) {
    Object.values(boothStates.value).forEach((state) => {
      state.visited = false
    })
    visitedHistoryMap.value = {}
    saveBoothStates({ withHaptics: true })
    saveVisitedHistory()
    overviewAnchorBoothId.value = null
    selectedBoothId.value = null
  }
}

const onResize = () => {
  scheduleFocusRecalc(false)
}

watch(selectedBoothId, async (id) => {
  clearMemoSaveTimer()
  memoDraft.value = id ? (boothStates.value[id]?.memo || '') : ''
  await nextTick()
  scheduleFocusRecalc(true)
})

watch(currentView, async (view) => {
  if (view !== 'map' && view !== 'heatmap') return
  await nextTick()
  scheduleFocusRecalc(false)
})

watch(panelExpanded, async () => {
  if (!showDetailPanel.value) return
  await nextTick()
  scheduleFocusRecalc(true)
})

watch(showDetailPanel, async () => {
  await nextTick()
  cancelRecalcTimer()
  if (!showDetailPanel.value) {
    clearMemoSaveTimer()
    panelExpanded.value = false
    panelDragOffsetPx.value = 0
    panelDragState.value = null
    return
  }
  mapRecalcTimerId.value = setTimeout(() => {
    scheduleFocusRecalc(true)
    mapRecalcTimerId.value = null
  }, DETAIL_RECALC_DELAY_MS)
})

onMounted(async () => {
  pwaPromptPlatform.value = detectPwaPromptPlatform()
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)

  await prepareDataSources()
  initMap()
  await loadBoothStates()
  await nextTick()
  centerOverview(false)
  canShowPwaCardByHistory.value = await evaluatePwaCardVisibilityOnLaunch()
  showPwaInstallCard.value = pwaPromptPlatform.value === 'ios' && canShowPwaCardByHistory.value
  if (pwaPromptPlatform.value === 'android' && canShowPwaCardByHistory.value && deferredInstallPromptEvent.value) showPwaInstallCard.value = true
  window.addEventListener('resize', onResize, { passive: true })
})

onUnmounted(() => {
  cancelMapAnimation()
  cancelRecalcTimer()
  clearMemoSaveTimer()
  clearFavoritePulseTimer()
  clearBoothTouchHighlightTimer()
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.app-shell {
  --ink: #2A2A2A;
  --ink-subtle: #5C5C5C;
  --ink-muted: #8F8F8F;
  --accent: #1D2A4B; /* Indigo */
  --accent-red: #9C2A31; /* Madder Red */
  --paper-base: #FDFBEE; /* Washi Off-white */
  --paper-elevated: #FFFFFF;
  --paper-modal: #FAFAEA;
  --line-soft: rgba(184, 153, 71, 0.2);
  --line-faint: rgba(184, 153, 71, 0.1);
  --gold-light: #E8D399;
  --gold-mid: #B89947; /* Muted Gold */
  --gold-dark: #8A7335;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --safe-top: env(safe-area-inset-top, 0px);
  --header-height: 62px;
  --tab-height: 50px;
  position: relative;
  height: 100dvh;
  color: var(--ink);
  overflow: hidden;
  font-family: "Noto Sans JP", sans-serif;
}

.map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--paper-base);
}

.map-container::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.15; /* Increased opacity for Washi texture */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}

.map-container::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 75%);
}

.app-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 40;
  background: linear-gradient(180deg, rgba(253, 251, 238, 0.98) 0%, rgba(253, 251, 238, 0.92) 100%);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(8px);
}

.app-header::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(173, 148, 97, 0.48), transparent);
}

.header-inner {
  height: calc(var(--header-height) + var(--safe-top));
  padding: var(--safe-top) var(--space-16) 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}

.title-block h1 {
  margin: 0;
  font-size: clamp(18px, 5.5vw, 28px);
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--ink);
  min-width: 0;
  white-space: nowrap;
}

.title-block p {
  margin: 4px 0 0;
  font-size: 15px;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  color: var(--gold-dark);
  letter-spacing: 0.15em;
}

.header-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.metric-row {
  display: flex;
  gap: var(--space-8);
  font-size: 13px;
  line-height: 1.2;
}

.metric-label {
  color: var(--ink-subtle);
}

.metric-value {
  color: var(--ink);
  font-weight: 600;
}

.tab-bar {
  position: fixed;
  top: calc(var(--safe-top) + var(--header-height));
  inset-inline: 0;
  height: var(--tab-height);
  z-index: 39;
  display: flex;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  background: rgba(248, 243, 232, 0.9);
  border-bottom: 1px solid var(--line-soft);
  -webkit-overflow-scrolling: touch;
}

.tab-bar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.tab-btn {
  position: relative;
  border: 0;
  margin: 0;
  padding: 0 16px;
  font-size: 15px;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--ink-subtle);
  background: transparent;
  transition: color 0.2s ease;
  flex: 1 0 auto;
  white-space: nowrap;
  min-width: fit-content;
}

.tab-btn::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 3px;
  border-radius: 2px;
  /* Brush stroke effect */
  background: var(--accent-red);
  clip-path: polygon(0 40%, 100% 0, 95% 100%, 5% 80%);
  opacity: 0;
  transform: translateY(2px);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tab-btn.is-active {
  color: var(--ink);
  font-weight: 600;
}

.tab-btn.is-active::after {
  opacity: 1;
  transform: translateY(0);
}

.content-area {
  position: absolute;
  inset: calc(var(--safe-top) + var(--header-height) + var(--tab-height)) 0 0;
  overflow: hidden;
}

.map-page {
  height: 100%;
  padding: 4px var(--space-16) var(--space-16);
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  animation: tabFadeIn 0.3s ease;
}

.map-topbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  min-height: 84px; /* Fix height to prevent jumping */
  justify-content: center;
}

.legend-row {
  display: flex;
  gap: var(--space-8);
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  animation: tabFadeIn 0.28s ease;
  -webkit-overflow-scrolling: touch;
}

.legend-row::-webkit-scrollbar {
  display: none;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(184, 153, 71, 0.6);
  background: linear-gradient(180deg, rgba(253, 251, 238, 0.95) 0%, rgba(246, 240, 227, 0.95) 100%);
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, 0.9),
    inset 0 -2px 3px rgba(184, 153, 71, 0.25),
    0 4px 8px rgba(42, 42, 42, 0.15);
  font-size: 13px;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: 0.05em;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  white-space: nowrap;
  flex: 0 0 auto;
  min-width: 82px;
  justify-content: center;
}

.pattern-kaetsu {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='17.32' viewBox='0 0 30 17.32'%3E%3Cpath d='M0,8.66 L15,0 L30,8.66 L15,17.32 Z' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3Cpath d='M15,0 L15,17.32 M0,8.66 L30,8.66 M7.5,4.33 L22.5,12.99 M22.5,4.33 L7.5,12.99' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3C/svg%3E"), linear-gradient(180deg, rgba(253, 251, 238, 0.95) 0%, rgba(246, 240, 227, 0.95) 100%);
  background-size: 20px 11.55px, 100% 100%;
}

.pattern-chuetsu {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='0' cy='12' r='10' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3Ccircle cx='24' cy='12' r='10' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='0' r='10' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='24' r='10' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3C/svg%3E"), linear-gradient(180deg, rgba(253, 251, 238, 0.95) 0%, rgba(246, 240, 227, 0.95) 100%);
  background-size: 16px 16px, 100% 100%;
}

.pattern-joetsu {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='34.64' viewBox='0 0 20 34.64'%3E%3Cpath d='M10,0 L20,5.77 L20,11.55 L10,17.32 L0,11.55 L0,5.77 Z' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3Cpath d='M10,17.32 L20,23.09 L20,28.87 L10,34.64 L0,28.87 L0,23.09 Z' fill='none' stroke='%23B89947' stroke-opacity='0.15' stroke-width='1.5'/%3E%3C/svg%3E"), linear-gradient(180deg, rgba(253, 251, 238, 0.95) 0%, rgba(246, 240, 227, 0.95) 100%);
  background-size: 10px 17.32px, 100% 100%;
}

.pattern-sado {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath d='M0,20 A10,10 0 0,1 20,20 A10,10 0 0,1 40,20 M0,20 A6,6 0 0,1 20,20 A6,6 0 0,1 40,20' fill='none' stroke='%23B89947' stroke-opacity='0.1' stroke-width='1.5'/%3E%3Cpath d='M10,10 A10,10 0 0,1 30,10 A10,10 0 0,1 50,10 M10,10 A6,6 0 0,1 30,10 A6,6 0 0,1 50,10' fill='none' stroke='%23B89947' stroke-opacity='0.1' stroke-width='1.5'/%3E%3C/svg%3E"), linear-gradient(180deg, rgba(253, 251, 238, 0.95) 0%, rgba(246, 240, 227, 0.95) 100%);
  background-size: 20px 10px, 100% 100%;
}

.legend-chip:active {
  transform: translateY(2px);
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    0 1px 3px rgba(42, 42, 42, 0.1);
}

.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border-width: 1.5px;
  border-color: rgba(255, 255, 255, 0.9);
  border-style: solid;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.heatmap-control-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  animation: tabFadeIn 0.28s ease;
}

.axis-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-8);
}

.axis-btn {
  position: relative;
  border: 1px solid rgba(141, 119, 80, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 252, 245, 0.8) 0%, rgba(240, 232, 215, 0.6) 100%);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-subtle);
  padding: 8px 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.axis-btn.is-active {
  color: var(--accent-red);
  font-weight: 700;
  border-color: rgba(156, 42, 49, 0.4);
  background: 
    linear-gradient(180deg, rgba(253, 251, 238, 0.98) 0%, rgba(245, 235, 210, 0.95) 100%);
  box-shadow:
    inset 0 2px 4px rgba(156, 42, 49, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05);
}

.axis-btn.is-active::after {
  content: "";
  position: absolute;
  left: 30%;
  right: 30%;
  bottom: 2px;
  height: 2px;
  background: var(--accent-red);
  opacity: 0.8;
  clip-path: polygon(0 50%, 100% 0, 95% 100%, 5% 85%);
  animation: tabFadeIn 0.3s ease;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.legend-label {
  width: 42px;
  font-size: 11px;
  color: var(--ink-subtle);
  font-weight: 600;
}

.legend-label.min {
  text-align: right;
}

.legend-gradient {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  filter: saturate(0.66) brightness(0.96);
}

.sweetDry-gradient {
  background: v-bind(sweetDryGradient);
}

.lightRich-gradient {
  background: v-bind(lightRichGradient);
}

.aroma-gradient {
  background: v-bind(aromaGradient);
}

.map-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 24px;
  border: 1px solid rgba(157, 136, 96, 0.34);
  background:
    linear-gradient(180deg, rgba(255, 255, 254, 0.92) 0%, rgba(250, 246, 237, 0.9) 100%);
  box-shadow:
    0 14px 26px rgba(70, 58, 36, 0.09),
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(125, 103, 67, 0.12);
  overflow: hidden;
}

.map-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 24px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.72);
}

.map-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 35%);
}

.map-viewport {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
  background:
    linear-gradient(180deg, rgba(254, 253, 250, 0.96) 0%, rgba(250, 247, 241, 0.94) 100%);
  scroll-behavior: auto;
  overscroll-behavior: contain;
}

.map-viewport.is-zoomed {
  cursor: grab;
}

.map-canvas {
  position: relative;
}

.booth-map {
  display: block;
  pointer-events: none;
  transition: none;
  will-change: transform;
}

.pine-atmosphere {
  fill: #bca885;
  opacity: 0.12;
}

.booth-rect {
  fill: var(--paper-base);
  stroke: var(--gold-dark);
  stroke-opacity: 0.4;
  stroke-width: 1px;
  rx: 8px; /* Slightly rounder corners */
  filter: drop-shadow(0 4px 6px rgba(50,40,20,0.18)) drop-shadow(0 1px 3px rgba(50,40,20,0.12));
  transition: fill 0.2s ease, filter 0.2s ease, stroke-width 0.2s ease;
}

.booth-rect.is-empty {
  fill: transparent;
  stroke: var(--gold-light);
  stroke-width: 1px;
  stroke-dasharray: 4;
  filter: none;
}

.booth-pattern-overlay {
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.8;
}

.booth-gradient-overlay {
  fill: url(#booth-sheen);
  pointer-events: none;
  mix-blend-mode: overlay;
}

.booth-touch-sheen {
  fill: url(#booth-touch-glow);
  opacity: 0;
  transform-origin: center;
  animation: boothTouchSheen 0.18s ease-out forwards;
  pointer-events: none;
}

.booth-border-overlay {
  fill: none;
  stroke: rgba(255, 255, 255, 0.95); /* Inner white highlight border for bevel */
  stroke-width: 1.5;
  pointer-events: none;
  rx: 8px;
}

.booth-text {
  font-size: 11px;
  font-family: "Noto Sans JP", sans-serif;
  fill: var(--ink-subtle);
  font-weight: 500;
  letter-spacing: 0.03em;
  pointer-events: none;
}

.booth-name-text {
  font-size: 13px;
  font-family: "Noto Serif JP", serif; /* Modern Serif for brewery names */
  fill: var(--ink);
  font-weight: 600;
  pointer-events: none;
}

.booth-name-text.is-small-text {
  font-size: 10px;
}

.booth-name-text.is-medium-text {
  font-size: 12px;
}

.visited-check {
  font-size: 12px;
  fill: #7d5a65;
  font-weight: 700;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.favorite-star {
  font-size: 12px;
  fill: #94743b;
  font-weight: 700;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.visited-check.is-visible,
.favorite-star.is-visible {
  opacity: 1;
}

.selected-highlight {
  filter: drop-shadow(0 0 8px rgba(184, 153, 71, 0.5));
  stroke: var(--gold-mid);
  stroke-width: 2.5px;
  rx: 8px;
}

.facility-layer {
  pointer-events: none;
}

.facility-zone-bg {
  fill: url(#metal-plaque);
  stroke: #9f8558;
  stroke-width: 1.3;
}

.facility-metal-line {
  fill: url(#metal-line);
  opacity: 0.9;
}

.facility-title {
  fill: #4F3A21;
  font-size: 20px;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 700;
  letter-spacing: 0.05em;
}



.progress-page {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-16);
  animation: tabFadeIn 0.3s ease;
}

.favorites-page {
  height: 100%;
  overflow: hidden;
  padding: var(--space-16);
  animation: tabFadeIn 0.3s ease;
}

.bottom-panel {
  --panel-base-translate: 0px;
  --panel-drag-offset: 0px;
  --taste-value-width: clamp(64px, 20vw, 82px);
  position: fixed;
  inset: auto 0 0 0;
  z-index: 50;
  transform: translate3d(0, calc(var(--panel-base-translate) + var(--panel-drag-offset)), 0);
  background:
    linear-gradient(180deg, rgba(253, 251, 238, 0.98) 0%, rgba(246, 240, 227, 0.98) 100%);
  border-radius: 24px 24px 0 0;
  border-top: 1px solid rgba(184, 153, 71, 0.4);
  box-shadow:
    0 -8px 28px rgba(42, 42, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  padding: 10px var(--space-16) calc(var(--space-16) + env(safe-area-inset-bottom, 0px));
  max-height: min(40dvh, 300px);
  overflow-y: auto;
  touch-action: none;
}

.bottom-panel.is-expanded {
  max-height: min(72dvh, 560px);
}

.bottom-panel.is-dragging {
  transition: none !important;
}

.panel-handle {
  width: 42px;
  height: 4px;
  border-radius: 999px;
  margin: 0 auto 10px;
  background: rgba(123, 99, 60, 0.34);
  cursor: grab;
  touch-action: none;
}

.bottom-panel.is-dragging .panel-handle {
  cursor: grabbing;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-family: "Shippori Mincho", "Noto Serif JP", serif;
  font-weight: 700;
  line-height: 1.3;
  color: var(--ink);
  letter-spacing: 0.05em;
}

.booth-id-badge {
  font-size: 12px;
  color: var(--ink-muted);
  font-weight: 500;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(137, 115, 78, 0.26);
  border-radius: 999px;
  background: linear-gradient(180deg, #fffdfa, #efe5d1);
  color: #7e6846;
  font-size: 1.08rem;
  line-height: 1;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.taste-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.taste-row {
  display: grid;
  grid-template-columns: 34px 16px minmax(0, 1fr) 16px var(--taste-value-width);
  align-items: center;
  gap: 8px;
}

.taste-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-subtle);
}

.taste-current-label {
  width: var(--taste-value-width);
  justify-self: end;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  text-align: right;
}

.taste-disclaimer {
  font-size: 11px;
  color: #8c8679;
  line-height: 1.6;
  margin-top: 6px;
  text-align: right;
}

.bar-limit-label {
  font-size: 11px;
  color: var(--ink-subtle);
  font-weight: 500;
  text-align: center;
}

.bar-container {
  position: relative;
  min-width: 0;
  height: 10px;
  display: flex;
  align-items: center;
}

.bar-bg {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  opacity: 0.72;
  filter: saturate(0.62) brightness(0.94);
}

.sweet-dry-bg {
  background: v-bind(sweetDryBarGradient);
}

.light-rich-bg {
  background: v-bind(lightRichBarGradient);
}

.aroma-bg {
  background: v-bind(aromaBarGradient);
}

.center-line {
  position: absolute;
  left: 50%;
  top: -1px;
  bottom: -1px;
  width: 2px;
  background: var(--accent);
  opacity: 0.32;
  z-index: 1;
}

.pointer {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: #fffdf9;
  border: 1px solid rgba(132, 106, 62, 0.72);
  box-shadow: 0 2px 5px rgba(70, 54, 29, 0.22);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.visited-control {
  padding-top: 10px;
  border-top: 1px solid var(--line-soft);
}

.status-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-12);
}

.brewery-extra {
  padding-top: 10px;
  border-top: 1px solid var(--line-soft);
  animation: tabFadeIn 0.18s ease;
}

.extra-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.extra-item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.extra-item dt {
  font-size: 12px;
  color: var(--ink-muted);
  font-weight: 600;
}

.extra-item dd {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink);
  word-break: break-word;
}

.extra-link {
  color: #5f4d30;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.visited-checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.visited-checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 44px;
  height: 26px;
  border: 1px solid rgba(118, 95, 60, 0.3);
  border-radius: 999px;
  position: relative;
  background: rgba(110, 90, 58, 0.12);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.56);
  transition: all 0.18s ease;
}

.checkbox-custom::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fffdfa;
  box-shadow: 0 1px 3px rgba(54, 40, 19, 0.2);
  transition: transform 0.18s ease;
}

.visited-checkbox-label input:checked + .checkbox-custom {
  background: linear-gradient(180deg, #b59a67, #8d7448);
  border-color: rgba(110, 84, 44, 0.58);
}

.visited-checkbox-label input:checked + .checkbox-custom::after {
  transform: translateX(18px);
}

.visited-checkbox-label input:focus-visible + .checkbox-custom {
  outline: 2px solid rgba(110, 88, 49, 0.36);
  outline-offset: 2px;
}

.favorite-toggle-btn {
  border: 1px solid rgba(132, 109, 71, 0.34);
  background: linear-gradient(180deg, #fffdf9, #ece2ce);
  color: #5d4a2c;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.favorite-toggle-btn.is-active {
  color: #5a451f;
  border-color: rgba(145, 120, 72, 0.52);
  box-shadow:
    inset 0 1px 0 rgba(255, 251, 240, 0.9),
    inset 0 -1px 0 rgba(148, 124, 77, 0.22);
}

.favorite-toggle-btn.is-pulsing {
  animation: favoritePulse 0.24s ease;
}

.favorite-icon {
  width: 14px;
  text-align: center;
}

.memo-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memo-title {
  margin: 0;
  font-size: 13px;
  color: var(--ink-subtle);
  font-weight: 700;
}

.memo-textarea {
  width: 100%;
  min-height: 88px;
  max-height: 150px;
  border: 1px solid rgba(126, 105, 69, 0.22);
  border-radius: 10px;
  background: #fffdf8;
  color: var(--ink);
  padding: 8px 10px;
  font-size: 16px;
  line-height: 1.45;
  resize: vertical;
}

.memo-textarea:focus-visible {
  outline: 2px solid rgba(112, 90, 49, 0.24);
  outline-offset: 1px;
}

.memo-counter {
  margin: 0;
  text-align: right;
  font-size: 11px;
  color: var(--ink-muted);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  --panel-base-translate: 18px;
  opacity: 0;
}

@keyframes boothTouchSheen {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  36% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translateY(14px);
  }
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes favoritePulse {
  0% {
    transform: scale(0.96);
  }
  55% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 420px) {
  .title-block h1 {
    font-size: 28px;
  }

  .title-block p {
    font-size: 15px;
  }

  .tab-btn {
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .booth-map,
  .map-page,
  .progress-page,
  .legend-row,
  .heatmap-control-block,
  .panel-slide-enter-active,
  .panel-slide-leave-active,
  .booth-touch-sheen {
    transition: none;
    animation: none;
  }
}

/* ── レコメンドハイライト ── */
.recommend-highlight-group {
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
  pointer-events: none;
}

.recommend-highlight-group.is-recommended {
  opacity: 1;
}

.recommend-highlight-group.is-flickering {
  animation: recommend-flicker 2.5s ease-in-out infinite;
}

@keyframes recommend-flicker {
  0%, 100% { opacity: 1; }
  30% { opacity: 0.7; }
  50% { opacity: 0.95; }
  70% { opacity: 0.6; }
  85% { opacity: 0.9; }
}

/* ── レコメンドカード ── */
.recommendation-card {
  margin: 12px 12px 8px;
  padding: 14px 16px 10px;
  background: linear-gradient(135deg, rgba(253, 251, 238, 0.95), rgba(250, 246, 230, 0.92));
  border: 1px solid rgba(184, 153, 71, 0.28);
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(140, 110, 50, 0.08);
  position: relative;
  overflow: hidden;
}

.recommendation-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(184, 153, 71, 0.35), transparent);
}

/* ── フッターメッセージ ── */
.footer-message-card {
  padding: 18px 16px;
  display: flex;
  justify-content: center;
}

.static-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.message-intro {
  margin: 0;
  font-size: 13.5px;
  color: #B89947;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.message-text {
  margin: 0;
  font-size: 13px;
  color: #5C4A2A;
  line-height: 1.6;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(184, 153, 71, 0.15);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.rec-icon {
  font-size: 15px;
  line-height: 1;
}

.rec-title {
  font-size: 13px;
  font-weight: 600;
  color: #5C4A2A;
  letter-spacing: 0.04em;
  flex: 1;
}

.rec-toggle-icon {
  font-size: 11px;
  color: #B89947;
  margin-left: auto;
}

/* ── コンパクト表示（サマリー） ── */
.rec-summary {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.rec-summary-line {
  margin: 2px 0;
  font-size: 12px;
  line-height: 1.5;
  color: #3A3A3A;
}

.rec-summary-label {
  font-weight: 600;
  color: #5C4A2A;
  font-size: 11.5px;
}

.rec-expand-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: #B89947;
  text-align: center;
  letter-spacing: 0.06em;
}

/* ── 展開表示（詳細） ── */
.rec-body {
  font-size: 12.5px;
  line-height: 1.7;
  color: #3A3A3A;
}

.rec-visit-intro {
  margin: 0 0 4px;
  font-size: 11.5px;
  color: #8F8F8F;
  font-style: italic;
}

.rec-line {
  margin: 3px 0;
}

.rec-bullet {
  color: #B89947;
  font-weight: 600;
}

.rec-indent {
  padding-left: 14px;
  display: inline-block;
}

.rec-footer {
  margin: 8px 0 0;
  font-size: 10px;
  color: #B0A88A;
  text-align: right;
}

.rec-collapse-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: #B89947;
  text-align: center;
  letter-spacing: 0.06em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.rec-fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.rec-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.rec-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.rec-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.pwa-fade-enter-active,
.pwa-fade-leave-active {
  transition: opacity 0.26s ease, transform 0.26s ease;
}

.pwa-fade-enter-from,
.pwa-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
