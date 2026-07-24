<template>
  <div class="smart-workshop">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">当前扫码包裹信息</div>
          <div class="scrollable-content">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">
                    大包号
                  </div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.packageNo || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">渠道</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.channel || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">包装重量</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.packingWeight || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">小包数量</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.expectedQty || '--' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="operation-panel">
          <div class="section-header">
            <span>操作</span>
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-search"
              @click="showOrderQueryDialog"
            >
              查询历史订单
            </el-button>
          </div>
          <div class="operation-buttons">
            <button
              class="btn-start"
              @click="toggleButtonState('start')"
              :class="{ pressed: buttonStates.start }"
            >
              <i class="el-icon-switch-button"></i><span>全线启动</span>
            </button>
            <button
              class="btn-stop"
              @click="toggleButtonState('stop')"
              :class="{ pressed: buttonStates.stop }"
            >
              <i class="el-icon-error"></i><span>全线停止</span>
            </button>
            <button
              v-show="false"
              class="btn-reset"
              @click="toggleButtonState('reset')"
              :class="{ pressed: buttonStates.reset }"
            >
              <i class="el-icon-video-pause"></i><span>全线暂停</span>
            </button>
            <button @click="toggleButtonState('fault_reset')">
              <i class="el-icon-refresh"></i><span>故障复位</span>
            </button>
            <button @click="toggleButtonState('clear')">
              <i class="el-icon-delete"></i><span>全线清空</span>
            </button>
            <button
              class="btn-disable-cainiao"
              @click="toggleDisableCainiao"
              :class="{ pressed: disableCainiao }"
            >
              <i class="el-icon-close"></i
              ><span>{{ disableCainiao ? '启用菜鸟' : '停用菜鸟' }}</span>
            </button>
          </div>
        </div>

        <!-- 日志区域 -->
        <div class="log-section">
          <div class="section-header">
            日志记录
            <div class="log-tabs">
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'running' }"
                @click="activeLogType = 'running'"
              >
                运行日志
              </div>
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'alarm' }"
                @click="switchToAlarmLog"
              >
                报警日志
                <div v-if="unreadAlarms > 0" class="alarm-badge">
                  {{ unreadAlarms }}
                </div>
              </div>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="log-list">
              <template v-if="currentLogs.length > 0">
                <div
                  v-for="log in currentLogs"
                  :key="log.id"
                  :class="[
                    'log-item',
                    { alarm: log.type === 'alarm', unread: log.unread }
                  ]"
                >
                  <div class="log-time">{{ log.timeStr }}</div>
                  <div class="log-item-content">{{ log.message }}</div>
                </div>
              </template>
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-square"></i>
                <p>
                  {{
                    activeLogType === 'running'
                      ? '暂无运行日志'
                      : '暂无报警日志'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧内容区域 -->
      <div class="main-content">
        <div class="floor-container">
          <!-- 左侧区域 -->
          <div class="floor-left">
            <div class="floor-title">生产线监控</div>
            <div class="floor-image-container">
              <div class="floor-map-legend">
                <span class="legend-item">
                  <i class="legend-dot legend-dot--photo"></i>
                  <span class="legend-text">
                    <span class="legend-name">光电</span>
                    <span class="legend-desc">圆形，触发为红色</span>
                  </span>
                </span>
                <span class="legend-item">
                  <i class="legend-dot legend-dot--motor"></i>
                  <span class="legend-text">
                    <span class="legend-name">电机</span>
                    <span class="legend-desc">方形，运行为绿色</span>
                  </span>
                </span>
                <span class="legend-item">
                  <i class="legend-arrow"></i>
                  <span class="legend-text">
                    <span class="legend-name">箭头</span>
                    <span class="legend-desc">输送线物料流向</span>
                  </span>
                </span>
              </div>
              <div class="image-wrapper">
                <img
                  src="@/assets/changzhou-img/image.png"
                  alt="一楼平面图"
                  class="floor-image"
                  @load="updateMarkerPositions"
                />
                <!-- 修改队列标识 -->
                <div
                  v-for="marker in queueMarkers"
                  :key="marker.id"
                  class="queue-marker"
                  :class="getQueueMarkerClass(marker.queueId)"
                  :data-x="marker.x"
                  :data-y="marker.y"
                  @click="handleQueueMarkerClick(marker.queueId)"
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">
                      <span class="queue-marker-count__queue">{{
                        getQueueTrayCount(marker.queueId)
                      }}</span>
                      <span
                        v-if="isSortPortQueue(marker.queueId)"
                        class="queue-marker-count__plc"
                        >/{{ getSortPortPlcCount(marker.queueId) }}</span
                      >
                    </span>
                    <span class="queue-marker-name">{{ marker.name }}</span>
                  </div>
                  <div
                    v-if="
                      queues.find((q) => q.id === marker.queueId)?.isLock ===
                      '1'
                    "
                    class="queue-marker-lock-overlay"
                    @click.stop="handleUnlockQueue(marker.queueId)"
                  >
                    <i class="el-icon-lock"></i>
                  </div>
                  <div
                    v-if="
                      queues.find((q) => q.id === marker.queueId)
                        ?.trayStatus === '3'
                    "
                    class="queue-marker-fail-overlay"
                  >
                    <i class="el-icon-info"></i>
                  </div>
                </div>
                <!-- DBW12 光电信号--1 -->
                <!-- 01001 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: photoelectricSignal1.bit0 === '1' }"
                  data-x="600"
                  data-y="190"
                  @click="toggleBitValue(photoelectricSignal1, 'bit0')"
                >
                  <div class="marker-label">01001</div>
                </div>
                <!-- 01002 -->
                <!-- <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit1 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(photoelectricSignal1, 'bit1')"
                >
                  <div class="marker-label">01002</div>
                </div> -->
                <!-- 01013光电1 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit2 === '1' }"
                  data-x="1200"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal1, 'bit2')"
                >
                  <div class="marker-label">01013-1</div>
                </div>
                <!-- 01004 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal1.bit3 === '1' }"
                  data-x="605"
                  data-y="870"
                  @click="toggleBitValue(photoelectricSignal1, 'bit3')"
                >
                  <div class="marker-label">01004</div>
                </div>
                <!-- 01005 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal1.bit4 === '1' }"
                  data-x="603"
                  data-y="945"
                  @click="toggleBitValue(photoelectricSignal1, 'bit4')"
                >
                  <div class="marker-label">01005</div>
                </div>
                <!-- 01006 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal1.bit5 === '1' }"
                  data-x="600"
                  data-y="1015"
                  @click="toggleBitValue(photoelectricSignal1, 'bit5')"
                >
                  <div class="marker-label">01006</div>
                </div>
                <!-- 01007 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal1.bit6 === '1' }"
                  data-x="595"
                  data-y="1090"
                  @click="toggleBitValue(photoelectricSignal1, 'bit6')"
                >
                  <div class="marker-label">01007</div>
                </div>
                <!-- 01008 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal1.bit7 === '1' }"
                  data-x="590"
                  data-y="1155"
                  @click="toggleBitValue(photoelectricSignal1, 'bit7')"
                >
                  <div class="marker-label">01008</div>
                </div>
                <!-- 01009 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: photoelectricSignal1.bit8 === '1' }"
                  data-x="760"
                  data-y="1210"
                  @click="toggleBitValue(photoelectricSignal1, 'bit8')"
                >
                  <div class="marker-label">01009</div>
                </div>
                <!-- 01010 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal1.bit9 === '1' }"
                  data-x="593"
                  data-y="1338"
                  @click="toggleBitValue(photoelectricSignal1, 'bit9')"
                >
                  <div class="marker-label">01010</div>
                </div>
                <!-- 01011 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit10 === '1' }"
                  data-x="760"
                  data-y="1400"
                  @click="toggleBitValue(photoelectricSignal1, 'bit10')"
                >
                  <div class="marker-label">01011</div>
                </div>
                <!-- 01012 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit11 === '1' }"
                  data-x="860"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal1, 'bit11')"
                >
                  <div class="marker-label">01012</div>
                </div>
                <!-- 01013光电2 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit12 === '1' }"
                  data-x="1350"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal1, 'bit12')"
                >
                  <div class="marker-label">01013-2</div>
                </div>
                <!-- 01014 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit13 === '1' }"
                  data-x="1490"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal1, 'bit13')"
                >
                  <div class="marker-label">01014</div>
                </div>
                <!-- 01015 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit14 === '1' }"
                  data-x="1620"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal1, 'bit14')"
                >
                  <div class="marker-label">01015</div>
                </div>
                <!-- 01016 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal1.bit15 === '1' }"
                  data-x="1820"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal1, 'bit15')"
                >
                  <div class="marker-label">01016</div>
                </div>
                <!-- DBW14 光电信号--2 -->
                <!-- 01017 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal2.bit0 === '1' }"
                  data-x="2010"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal2, 'bit0')"
                >
                  <div class="marker-label">01017</div>
                </div>
                <!-- 01018 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal2.bit1 === '1' }"
                  data-x="2190"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal2, 'bit1')"
                >
                  <div class="marker-label">01018</div>
                </div>
                <!-- 01019 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal2.bit2 === '1' }"
                  data-x="2368"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal2, 'bit2')"
                >
                  <div class="marker-label">01019</div>
                </div>
                <!-- 01020 -->
                <div
                  class="marker"
                  :class="{ scanning: photoelectricSignal2.bit3 === '1' }"
                  data-x="2555"
                  data-y="1402"
                  @click="toggleBitValue(photoelectricSignal2, 'bit3')"
                >
                  <div class="marker-label">01020</div>
                </div>
                <!-- 01021 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit4 === '1' }"
                  data-x="1660"
                  data-y="1120"
                  @click="toggleBitValue(photoelectricSignal2, 'bit4')"
                >
                  <div class="marker-label">01021</div>
                </div>
                <!-- 01022 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit5 === '1' }"
                  data-x="1660"
                  data-y="1530"
                  @click="toggleBitValue(photoelectricSignal2, 'bit5')"
                >
                  <div class="marker-label">01022</div>
                </div>
                <!-- 01023 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit6 === '1' }"
                  data-x="1840"
                  data-y="1120"
                  @click="toggleBitValue(photoelectricSignal2, 'bit6')"
                >
                  <div class="marker-label">01023</div>
                </div>
                <!-- 01024 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit7 === '1' }"
                  data-x="1840"
                  data-y="1530"
                  @click="toggleBitValue(photoelectricSignal2, 'bit7')"
                >
                  <div class="marker-label">01024</div>
                </div>
                <!-- 01025 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit8 === '1' }"
                  data-x="2025"
                  data-y="1120"
                  @click="toggleBitValue(photoelectricSignal2, 'bit8')"
                >
                  <div class="marker-label">01025</div>
                </div>
                <!-- 01026 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit9 === '1' }"
                  data-x="2025"
                  data-y="1530"
                  @click="toggleBitValue(photoelectricSignal2, 'bit9')"
                >
                  <div class="marker-label">01026</div>
                </div>
                <!-- 01027 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit10 === '1' }"
                  data-x="2210"
                  data-y="1120"
                  @click="toggleBitValue(photoelectricSignal2, 'bit10')"
                >
                  <div class="marker-label">01027</div>
                </div>
                <!-- 01028 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit11 === '1' }"
                  data-x="2210"
                  data-y="1530"
                  @click="toggleBitValue(photoelectricSignal2, 'bit11')"
                >
                  <div class="marker-label">01028</div>
                </div>
                <!-- 01029 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit12 === '1' }"
                  data-x="2390"
                  data-y="1120"
                  @click="toggleBitValue(photoelectricSignal2, 'bit12')"
                >
                  <div class="marker-label">01029</div>
                </div>
                <!-- 01030 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit13 === '1' }"
                  data-x="2390"
                  data-y="1530"
                  @click="toggleBitValue(photoelectricSignal2, 'bit13')"
                >
                  <div class="marker-label">01030</div>
                </div>
                <!-- 01031 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit14 === '1' }"
                  data-x="2575"
                  data-y="1120"
                  @click="toggleBitValue(photoelectricSignal2, 'bit14')"
                >
                  <div class="marker-label">01031</div>
                </div>
                <!-- 01032 -->
                <div
                  class="marker label-left"
                  :class="{ scanning: photoelectricSignal2.bit15 === '1' }"
                  data-x="2575"
                  data-y="1530"
                  @click="toggleBitValue(photoelectricSignal2, 'bit15')"
                >
                  <div class="marker-label">01032</div>
                </div>
                <!-- DBW6 电机运行信号 01001-01016 -->
                <!-- 01001 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit0 === '1' }"
                  data-x="400"
                  data-y="245"
                  @click="toggleBitValue(motorRunningWord6, 'bit0')"
                >
                  <div class="marker-label">01001</div>
                </div>
                <!-- 01002 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: motorRunningWord6.bit1 === '1' }"
                  data-x="650"
                  data-y="260"
                  @click="toggleBitValue(motorRunningWord6, 'bit1')"
                >
                  <div class="marker-label">01002</div>
                </div>
                <!-- 01003 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit2 === '1' }"
                  data-x="665"
                  data-y="445"
                  @click="toggleBitValue(motorRunningWord6, 'bit2')"
                >
                  <div class="marker-label">01003</div>
                </div>
                <!-- 01004 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit3 === '1' }"
                  data-x="660"
                  data-y="660"
                  @click="toggleBitValue(motorRunningWord6, 'bit3')"
                >
                  <div class="marker-label">01004</div>
                </div>
                <!-- 01005 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: motorRunningWord6.bit4 === '1' }"
                  data-x="650"
                  data-y="900"
                  @click="toggleBitValue(motorRunningWord6, 'bit4')"
                >
                  <div class="marker-label">01005</div>
                </div>
                <!-- 01006 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: motorRunningWord6.bit5 === '1' }"
                  data-x="648"
                  data-y="980"
                  @click="toggleBitValue(motorRunningWord6, 'bit5')"
                >
                  <div class="marker-label">01006</div>
                </div>
                <!-- 01007 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: motorRunningWord6.bit6 === '1' }"
                  data-x="646"
                  data-y="1060"
                  @click="toggleBitValue(motorRunningWord6, 'bit6')"
                >
                  <div class="marker-label">01007</div>
                </div>
                <!-- 01008 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: motorRunningWord6.bit7 === '1' }"
                  data-x="642"
                  data-y="1140"
                  @click="toggleBitValue(motorRunningWord6, 'bit7')"
                >
                  <div class="marker-label">01008</div>
                </div>
                <!-- 01009 -->
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: motorRunningWord6.bit8 === '1' }"
                  data-x="639"
                  data-y="1210"
                  @click="toggleBitValue(motorRunningWord6, 'bit8')"
                >
                  <div class="marker-label">01009</div>
                </div>
                <!-- 01010 -->
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: motorRunningWord6.bit9 === '1' }"
                  data-x="637"
                  data-y="1278"
                  @click="toggleBitValue(motorRunningWord6, 'bit9')"
                >
                  <div class="marker-label">01010</div>
                </div>
                <!-- 01011 -->
                <div
                  class="motor-marker marker-show-label label-bottom"
                  :class="{ running: motorRunningWord6.bit10 === '1' }"
                  data-x="662"
                  data-y="1330"
                  @click="toggleBitValue(motorRunningWord6, 'bit10')"
                >
                  <div class="marker-label">01011</div>
                </div>
                <!-- 01012 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit11 === '1' }"
                  data-x="760"
                  data-y="1345"
                  @click="toggleBitValue(motorRunningWord6, 'bit11')"
                >
                  <div class="marker-label">01012</div>
                </div>
                <!-- 01013 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit12 === '1' }"
                  data-x="1260"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord6, 'bit12')"
                >
                  <div class="marker-label">01013</div>
                </div>
                <!-- 01014 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit13 === '1' }"
                  data-x="1420"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord6, 'bit13')"
                >
                  <div class="marker-label">01014</div>
                </div>
                <!-- 01015 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit14 === '1' }"
                  data-x="1580"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord6, 'bit14')"
                >
                  <div class="marker-label">01015</div>
                </div>
                <!-- 01016 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord6.bit15 === '1' }"
                  data-x="1820"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord6, 'bit15')"
                >
                  <div class="marker-label">01016</div>
                </div>
                <!-- DBW8 电机运行信号 01017-01030（bit14/15 备用不生成） -->
                <!-- 01017 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit0 === '1' }"
                  data-x="2010"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord8, 'bit0')"
                >
                  <div class="marker-label">01017</div>
                </div>
                <!-- 01018 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit1 === '1' }"
                  data-x="2190"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord8, 'bit1')"
                >
                  <div class="marker-label">01018</div>
                </div>
                <!-- 01019 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit2 === '1' }"
                  data-x="2368"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord8, 'bit2')"
                >
                  <div class="marker-label">01019</div>
                </div>
                <!-- 01020 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit3 === '1' }"
                  data-x="2555"
                  data-y="1335"
                  @click="toggleBitValue(motorRunningWord8, 'bit3')"
                >
                  <div class="marker-label">01020</div>
                </div>
                <!-- 01021 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit4 === '1' }"
                  data-x="1730"
                  data-y="1220"
                  @click="toggleBitValue(motorRunningWord8, 'bit4')"
                >
                  <div class="marker-label">01021</div>
                </div>
                <!-- 01022 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord8.bit5 === '1' }"
                  data-x="1730"
                  data-y="1420"
                  @click="toggleBitValue(motorRunningWord8, 'bit5')"
                >
                  <div class="marker-label">01022</div>
                </div>
                <!-- 01023 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit6 === '1' }"
                  data-x="1910"
                  data-y="1220"
                  @click="toggleBitValue(motorRunningWord8, 'bit6')"
                >
                  <div class="marker-label">01023</div>
                </div>
                <!-- 01024 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord8.bit7 === '1' }"
                  data-x="1910"
                  data-y="1420"
                  @click="toggleBitValue(motorRunningWord8, 'bit7')"
                >
                  <div class="marker-label">01024</div>
                </div>
                <!-- 01025 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit8 === '1' }"
                  data-x="2100"
                  data-y="1220"
                  @click="toggleBitValue(motorRunningWord8, 'bit8')"
                >
                  <div class="marker-label">01025</div>
                </div>
                <!-- 01026 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord8.bit9 === '1' }"
                  data-x="2100"
                  data-y="1420"
                  @click="toggleBitValue(motorRunningWord8, 'bit9')"
                >
                  <div class="marker-label">01026</div>
                </div>
                <!-- 01027 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit10 === '1' }"
                  data-x="2280"
                  data-y="1220"
                  @click="toggleBitValue(motorRunningWord8, 'bit10')"
                >
                  <div class="marker-label">01027</div>
                </div>
                <!-- 01028 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord8.bit11 === '1' }"
                  data-x="2280"
                  data-y="1420"
                  @click="toggleBitValue(motorRunningWord8, 'bit11')"
                >
                  <div class="marker-label">01028</div>
                </div>
                <!-- 01029 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit12 === '1' }"
                  data-x="2460"
                  data-y="1220"
                  @click="toggleBitValue(motorRunningWord8, 'bit12')"
                >
                  <div class="marker-label">01029</div>
                </div>
                <!-- 01030 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord8.bit13 === '1' }"
                  data-x="2460"
                  data-y="1420"
                  @click="toggleBitValue(motorRunningWord8, 'bit13')"
                >
                  <div class="marker-label">01030</div>
                </div>
                <!-- 01031 -->
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: motorRunningWord8.bit14 === '1' }"
                  data-x="2650"
                  data-y="1220"
                  @click="toggleBitValue(motorRunningWord8, 'bit14')"
                >
                  <div class="marker-label">01031</div>
                </div>
                <!-- 01032 -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord8.bit15 === '1' }"
                  data-x="2655"
                  data-y="1420"
                  @click="toggleBitValue(motorRunningWord8, 'bit15')"
                >
                  <div class="marker-label">01032</div>
                </div>
                <!-- DBW10 分拣电机运行信号 -->
                <!-- 分拣1左执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit0 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit0')"
                >
                  <div class="marker-label">分拣1左</div>
                </div> -->
                <!-- 分拣机1右执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit1 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit1')"
                >
                  <div class="marker-label">分拣1右</div>
                </div> -->
                <!-- 分拣机2左执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit2 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit2')"
                >
                  <div class="marker-label">分拣2左</div>
                </div> -->
                <!-- 分拣机2右执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit3 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit3')"
                >
                  <div class="marker-label">分拣2右</div>
                </div> -->
                <!-- 分拣机3左执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit4 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit4')"
                >
                  <div class="marker-label">分拣3左</div>
                </div> -->
                <!-- 分拣机3右执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit5 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit5')"
                >
                  <div class="marker-label">分拣3右</div>
                </div> -->
                <!-- 分拣机4左执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit6 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit6')"
                >
                  <div class="marker-label">分拣4左</div>
                </div> -->
                <!-- 分拣机4右执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit7 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit7')"
                >
                  <div class="marker-label">分拣4右</div>
                </div> -->
                <!-- 分拣机5左执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit8 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit8')"
                >
                  <div class="marker-label">分拣5左</div>
                </div> -->
                <!-- 分拣机5右执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit9 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit9')"
                >
                  <div class="marker-label">分拣5右</div>
                </div> -->
                <!-- 分拣机6左执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit10 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit10')"
                >
                  <div class="marker-label">分拣6左</div>
                </div> -->
                <!-- 分拣机6右执行 -->
                <!-- <div
                  class="motor-marker marker-show-label"
                  :class="{ running: motorRunningWord10.bit11 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(motorRunningWord10, 'bit11')"
                >
                  <div class="marker-label">分拣6右</div>
                </div> -->
                <!-- 输送线流动箭头 -->
                <div
                  v-for="(arrow, index) in conveyorArrows"
                  :key="'conveyor-' + index"
                  class="marker-with-flow flow-item"
                  :data-x="arrow.x"
                  :data-y="arrow.y"
                  :style="{
                    width: arrow.width + 'px',
                    transform: `translate(-50%, -50%) scale(0.5) rotateZ(${arrow.rotation}deg)`
                  }"
                >
                  <div
                    v-for="item in arrow.arrowCount"
                    :key="item"
                    class="conveyor-arrow-item"
                  ></div>
                </div>
                <!-- 六面扫扫码上货面板 -->
                <div class="marker-with-panel" data-x="1150" data-y="1200">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                    style="width: 210px"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">
                          <span
                            class="status-dot"
                            :style="{
                              backgroundColor: sixScanSocketConnected
                                ? '#67c23a'
                                : '#f56c6c'
                            }"
                          ></span>
                          六面扫条码：
                        </span>
                        <span class="barcode-value">{{
                          lastProcessedBarcode || '--'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 输送线数据看板：虚拟ID与分拣口进货信息 -->
                <div class="marker-with-panel" data-x="2900" data-y="350">
                  <div
                    class="data-panel"
                    :class="['position-left', { 'always-show': true }]"
                    style="width: 800px"
                  >
                    <div class="data-panel-header">输送线数据看板</div>
                    <div class="data-panel-content" style="padding-top: 5px">
                      <div class="scan-groups-grid">
                        <!-- 第一行：虚拟ID汇总 + 分拣口 1~3 -->
                        <div class="scan-group-row">
                          <div class="scan-group with-watermark belt-ids-card">
                            <div class="group-watermark">ID</div>
                            <div class="group-items">
                              <div class="scan-item">
                                <span class="scan-label">1008</span>
                                <span class="scan-value">{{
                                  beltStationIds['M1008'] || '--'
                                }}</span>
                              </div>
                              <div class="scan-item">
                                <span class="scan-label">1010</span>
                                <span class="scan-value">{{
                                  beltStationIds['M1010'] || '--'
                                }}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            class="scan-group with-watermark sort-port-card"
                            v-for="port in [1, 2, 3]"
                            :key="'sort-port-' + port"
                          >
                            <div class="group-watermark">{{ port }}</div>
                            <div class="group-items">
                              <div class="scan-item">
                                <span class="scan-label">ID</span>
                                <span class="scan-value">{{
                                  sortPortPurchaseIds[port] || '--'
                                }}</span>
                              </div>
                              <div class="scan-item">
                                <span class="scan-label">呼叫AGV</span>
                                <button
                                  class="port-send-btn"
                                  title="发送呼叫"
                                  @click="callAgv(port)"
                                >
                                  <i class="el-icon-s-promotion"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <!-- 第二行：分拣口 4~7 -->
                        <div class="scan-group-row">
                          <div
                            class="scan-group with-watermark sort-port-card"
                            v-for="port in [4, 5, 6, 7]"
                            :key="'sort-port-' + port"
                          >
                            <div class="group-watermark">{{ port }}</div>
                            <div class="group-items">
                              <div class="scan-item">
                                <span class="scan-label">ID</span>
                                <span class="scan-value">{{
                                  sortPortPurchaseIds[port] || '--'
                                }}</span>
                              </div>
                              <div class="scan-item">
                                <span class="scan-label">呼叫AGV</span>
                                <button
                                  class="port-send-btn"
                                  title="发送呼叫"
                                  @click="callAgv(port)"
                                >
                                  <i class="el-icon-s-promotion"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <!-- 第三行：分拣口 8~11 -->
                        <div class="scan-group-row">
                          <div
                            class="scan-group with-watermark sort-port-card"
                            v-for="port in [8, 9, 10, 11]"
                            :key="'sort-port-' + port"
                          >
                            <div class="group-watermark">{{ port }}</div>
                            <div class="group-items">
                              <div class="scan-item">
                                <span class="scan-label">ID</span>
                                <span class="scan-value">{{
                                  sortPortPurchaseIds[port] || '--'
                                }}</span>
                              </div>
                              <div class="scan-item">
                                <span class="scan-label">呼叫AGV</span>
                                <button
                                  class="port-send-btn"
                                  title="发送呼叫"
                                  @click="callAgv(port)"
                                >
                                  <i class="el-icon-s-promotion"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <!-- 第四行：分拣口 12~13 -->
                        <div class="scan-group-row">
                          <div
                            class="scan-group with-watermark sort-port-card"
                            v-for="port in [12, 13]"
                            :key="'sort-port-' + port"
                          >
                            <div class="group-watermark">{{ port }}</div>
                            <div class="group-items">
                              <div class="scan-item">
                                <span class="scan-label">ID</span>
                                <span class="scan-value">{{
                                  sortPortPurchaseIds[port] || '--'
                                }}</span>
                              </div>
                              <div class="scan-item">
                                <span class="scan-label">呼叫AGV</span>
                                <button
                                  class="port-send-btn"
                                  title="发送呼叫"
                                  @click="callAgv(port)"
                                >
                                  <i class="el-icon-s-promotion"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧队列信息区 -->
    <div
      class="side-info-panel-queue"
      :style="{
        width: isQueueExpanded ? '850px' : 'auto',
        height: isQueueExpanded ? 'calc(100% - 40px)' : 'auto'
      }"
    >
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ expanded: isQueueExpanded }">
        <div class="section-header">
          <template v-if="isQueueExpanded">
            <div class="header-left">
              <span><i class="el-icon-s-data"></i> 队列信息</span>
            </div>
            <span
              class="arrow-icon"
              :class="{ 'expanded-arrow': isQueueExpanded }"
              @click="changeQueueExpanded"
              >▼</span
            >
          </template>
          <template v-else>
            <i class="el-icon-s-data" @click="changeQueueExpanded"></i>
          </template>
        </div>
        <div v-if="isQueueExpanded" class="expandable-content-queue">
          <div class="queue-container">
            <!-- 左侧队列列表 -->
            <div class="queue-container-left">
              <div
                v-for="(queue, queuesIndex) in queues"
                :key="'queue-' + queue.id + '-' + queuesIndex"
                class="queue"
                :class="{ active: selectedQueueIndex === queue.id - 1 }"
                @click="showTrays(queue.id - 1)"
                @dragover.prevent
                @drop="handleDrop(queue.id - 1)"
              >
                <span class="queue-name">{{ queue.queueName }}</span>
                <span class="tray-count">{{
                  queue.trayInfo?.length || 0
                }}</span>
                <!-- AGV状态标签 -->
                <el-tag
                  v-if="queue.trayStatus === '0'"
                  size="mini"
                  type="warning"
                  style="margin-left: 4px"
                  >等待AGV取货</el-tag
                >
                <el-tag
                  v-else-if="queue.trayStatus === '1'"
                  size="mini"
                  type="info"
                  style="margin-left: 4px"
                  >AGV取货完成</el-tag
                >
                <el-tag
                  v-else-if="queue.trayStatus === '2'"
                  size="mini"
                  type="success"
                  style="margin-left: 4px"
                  >空托已返回</el-tag
                >
                <el-tag
                  v-else-if="queue.trayStatus === '3'"
                  size="mini"
                  type="danger"
                  style="margin-left: 4px"
                  >AGV调用失败</el-tag
                >
              </div>
            </div>

            <!-- 右侧托盘列表 -->
            <div class="queue-container-right">
              <div class="selected-queue-header" v-if="selectedQueue">
                <h3>{{ selectedQueue.queueName }}</h3>
                <div class="queue-header-actions">
                  <span class="tray-total"
                    >包裹数量: {{ selectedQueue.trayInfo?.length || 0 }}</span
                  >
                </div>
              </div>
              <div class="tray-list">
                <template v-if="nowTrays && nowTrays.length > 0">
                  <div
                    v-for="(tray, index) in nowTrays"
                    :key="'tray-' + tray.id + '-' + index"
                    class="tray-item"
                    :class="{
                      dragging: isDragging && draggedTray?.id === tray.id
                    }"
                    draggable="true"
                    @dragstart="
                      handleDragStart($event, tray, selectedQueueIndex)
                    "
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <span
                          class="tray-detail allocated-port"
                          v-if="tray.allocatedPortNo"
                          >目的地：分拣口{{ tray.allocatedPortNo }}</span
                        >
                        <span
                          class="tray-detail destination-code"
                          v-if="tray.destinationCode"
                          >编码：{{ tray.destinationCode }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >渠道：{{ tray.channel || '--' }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >包装重量：{{ tray.packingWeight || '--' }}</span
                        >
                        <span class="tray-detail"
                          >小包数量：{{ tray.expectedQty || '--' }}</span
                        >
                      </div>
                      <span class="tray-time">{{ tray.time }}</span>
                    </div>
                    <div class="tray-actions">
                      <el-button
                        type="primary"
                        size="mini"
                        icon="el-icon-arrow-up"
                        circle
                        :disabled="index === 0"
                        @click.stop="moveTrayUp(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="primary"
                        size="mini"
                        icon="el-icon-arrow-down"
                        circle
                        :disabled="index === nowTrays.length - 1"
                        @click.stop="moveTrayDown(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="danger"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        @click.stop="deleteTray(tray, index)"
                      ></el-button>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-state">
                  <i class="el-icon-box"></i>
                  <p>暂无托盘信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试面板 -->
    <div class="test-panel-container">
      <!-- 测试按钮 -->
      <div class="test-toggle-btn" @click="showTestPanel = !showTestPanel">
        <i class="el-icon-setting"></i>
      </div>
      <!-- 测试面板 -->
      <div class="test-panel" :class="{ collapsed: !showTestPanel }">
        <div class="test-panel-header">
          <span>测试面板</span>
          <i class="el-icon-close" @click.stop="showTestPanel = false"></i>
        </div>
        <div class="test-panel-content">
          <!-- 添加扫码测试部分 -->
          <div class="test-section">
            <span class="test-label">扫码信息测试:</span>
            <div class="qrcode-test-container">
              <div class="qrcode-input-group">
                <div class="qrcode-label">六面扫:</div>
                <el-input
                  v-model="sixScanBarcode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
            </div>
          </div>
          <!-- PLC信号手动触发 -->
          <div class="test-section">
            <span class="test-label">PLC信号测试:</span>
            <div class="qrcode-test-container">
              <el-button
                type="warning"
                size="small"
                @click="triggerDestinationRequest"
              >
                模拟 DBW16.bit0 目的地请求
              </el-button>
            </div>
          </div>
          <!-- DBW1224~DBW1248 分拣口PLC计数测试 -->
          <div class="test-section">
            <span class="test-label">分拣口PLC计数(DBW1224~1248):</span>
            <div class="qrcode-test-container qrcode-input-grid">
              <div class="qrcode-input-group">
                <div class="qrcode-label">口1:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[1]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口2:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[2]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口3:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[3]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口4:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[4]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口5:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[5]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口6:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[6]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口7:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[7]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口8:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[8]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口9:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[9]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口10:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[10]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口11:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[11]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口12:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[12]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口13:</div>
                <el-input
                  v-model.number="sortPortPlcCounts[13]"
                  size="small"
                  placeholder="计数"
                  class="qrcode-input"
                ></el-input>
              </div>
            </div>
          </div>
          <!-- DBB748/DBB808 M1008/M1010虚拟ID测试 -->
          <div class="test-section">
            <span class="test-label">DBB748/DBB808 M1008/M1010虚拟ID:</span>
            <div class="qrcode-test-container qrcode-input-grid">
              <div class="qrcode-input-group">
                <div class="qrcode-label">M1008:</div>
                <el-input
                  v-model="beltStationIds.M1008"
                  size="small"
                  placeholder="虚拟ID（大包号）"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">M1010:</div>
                <el-input
                  v-model="beltStationIds.M1010"
                  size="small"
                  placeholder="虚拟ID（大包号）"
                  class="qrcode-input"
                ></el-input>
              </div>
            </div>
          </div>
          <!-- DBB298-717 分拣口进货ID测试 -->
          <div class="test-section">
            <span class="test-label">DBB298-DBB658 分拣口进货ID:</span>
            <div class="qrcode-test-container qrcode-input-grid">
              <div class="qrcode-input-group">
                <div class="qrcode-label">口1:</div>
                <el-input
                  v-model="sortPort01TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口2:</div>
                <el-input
                  v-model="sortPort02TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口3:</div>
                <el-input
                  v-model="sortPort03TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口4:</div>
                <el-input
                  v-model="sortPort04TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口5:</div>
                <el-input
                  v-model="sortPort05TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口6:</div>
                <el-input
                  v-model="sortPort06TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口7:</div>
                <el-input
                  v-model="sortPort07TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口8:</div>
                <el-input
                  v-model="sortPort08TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口9:</div>
                <el-input
                  v-model="sortPort09TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口10:</div>
                <el-input
                  v-model="sortPort10TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口11:</div>
                <el-input
                  v-model="sortPort11TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口12:</div>
                <el-input
                  v-model="sortPort12TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">口13:</div>
                <el-input
                  v-model="sortPort13TrayId"
                  size="small"
                  placeholder="进货ID"
                  class="qrcode-input"
                ></el-input>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单查询对话框 -->
    <OrderQueryDialog :visible.sync="orderQueryDialogVisible" />
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';
import HttpUtilMcs from '@/utils/HttpUtilMcs';
import HttpUtilCainiao from '@/utils/HttpUtilCainiao';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import OrderQueryDialog from '@/components/OrderQueryDialog.vue';
import {
  mockPackageByBarcode,
  mapCainiaoToPackage,
  toOrderInfoPayload,
  toScanDisplayInfo
} from '@/utils/packageMockData';

const net = require('net');

// 六面扫TCP连接配置
const SIX_SCAN_HOST = '192.168.4.227';
const SIX_SCAN_PORT = 2002;
const SIX_SCAN_RECONNECT_DELAY = 3000; // 3秒重连

export default {
  name: 'MainPage',
  components: {
    OrderQueryDialog
  },
  data() {
    return {
      nowScanTrayInfo: {},
      sixScanBarcode: '',
      lastProcessedBarcode: '',
      sixScanProcessing: false,
      // 目的地请求限流时间戳（2秒内重复信号不处理）
      lastDestinationReqTime: 0,
      // 大包分拣口循环下发游标（满容量后按 1→9 顺序循环开新口）
      lastLargeAllocPortNo: 0,
      // 六面扫Socket连接状态
      sixScanSocketConnected: false,
      // 分拣口配置（1-9大件，10-11小件，12-13异常口）
      sortPortConfig: [
        {
          portNo: 1,
          machineNo: 1,
          direction: 1,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 2,
          machineNo: 1,
          direction: 2,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 3,
          machineNo: 2,
          direction: 1,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 4,
          machineNo: 2,
          direction: 2,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 5,
          machineNo: 3,
          direction: 1,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 6,
          machineNo: 3,
          direction: 2,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 7,
          machineNo: 4,
          direction: 1,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 8,
          machineNo: 4,
          direction: 2,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 9,
          machineNo: 5,
          direction: 1,
          sizeType: 'large',
          maxCapacity: 5
        },
        {
          portNo: 10,
          machineNo: 5,
          direction: 2,
          sizeType: 'small',
          maxCapacity: 5
        },
        {
          portNo: 11,
          machineNo: 6,
          direction: 1,
          sizeType: 'small',
          maxCapacity: 5
        },
        {
          portNo: 12,
          machineNo: 6,
          direction: 2,
          sizeType: 'exception',
          maxCapacity: 5
        },
        {
          portNo: 13,
          machineNo: 7,
          direction: 1,
          sizeType: 'exception',
          maxCapacity: 5
        }
      ],
      showTestPanel: false,
      orderQueryDialogVisible: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      // 停用菜鸟：true 走 mock，false（默认）查菜鸟大包接口
      disableCainiao: false,
      activeLogType: 'running',
      runningLogs: [], // 修改为空数组
      alarmLogs: [], // 修改为空数组
      nowTrays: [],
      draggedTray: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      selectedQueueIndex: 0,
      isDragging: false,
      queues: [
        {
          id: 1,
          queueName: '1008',
          trayInfo: []
        },
        {
          id: 2,
          queueName: '分拣口1',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 3,
          queueName: '分拣口2',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 4,
          queueName: '分拣口3',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 5,
          queueName: '分拣口4',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 6,
          queueName: '分拣口5',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 7,
          queueName: '分拣口6',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 8,
          queueName: '分拣口7',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 9,
          queueName: '分拣口8',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 10,
          queueName: '分拣口9',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 11,
          queueName: '分拣口10',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 12,
          queueName: '分拣口11',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 13,
          queueName: '分拣口12',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 14,
          queueName: '分拣口13',
          trayInfo: [],
          trayStatus: '',
          isLock: ''
        },
        {
          id: 15,
          queueName: '1010',
          trayInfo: []
        },
        {
          id: 16,
          queueName: '剔除口',
          trayInfo: []
        }
      ],
      // 添加队列位置标识数据
      queueMarkers: [
        { id: 1, name: '1008', queueId: 1, x: 650, y: 780 },
        { id: 2, name: '分拣口1', queueId: 2, x: 1730, y: 1650 },
        { id: 3, name: '分拣口2', queueId: 3, x: 1730, y: 1020 },
        { id: 4, name: '分拣口3', queueId: 4, x: 1910, y: 1650 },
        { id: 5, name: '分拣口4', queueId: 5, x: 1910, y: 1020 },
        { id: 6, name: '分拣口5', queueId: 6, x: 2090, y: 1650 },
        { id: 7, name: '分拣口6', queueId: 7, x: 2090, y: 1020 },
        { id: 8, name: '分拣口7', queueId: 8, x: 2280, y: 1650 },
        { id: 9, name: '分拣口8', queueId: 9, x: 2280, y: 1020 },
        { id: 10, name: '分拣口9', queueId: 10, x: 2470, y: 1650 },
        { id: 11, name: '分拣口10', queueId: 11, x: 2470, y: 1020 },
        { id: 12, name: '分拣口11', queueId: 12, x: 2650, y: 1650 },
        { id: 13, name: '分拣口12', queueId: 13, x: 2650, y: 1020 },
        { id: 14, name: '分拣口13', queueId: 14, x: 2820, y: 1350 },
        { id: 15, name: '1010', queueId: 15, x: 1200, y: 1480 },
        { id: 16, name: '剔除口', queueId: 16, x: 850, y: 1210 }
      ],
      // 输送线流动箭头配置（坐标按平面图调整）
      conveyorArrows: [
        {
          x: 390,
          y: 245,
          width: 200,
          rotation: -2,
          arrowCount: 6
        },
        {
          x: 661,
          y: 510,
          width: 300,
          rotation: 92,
          arrowCount: 8
        },
        {
          x: 642,
          y: 1085,
          width: 300,
          rotation: 92,
          arrowCount: 9
        },
        {
          x: 800,
          y: 1345,
          width: 130,
          rotation: -2,
          arrowCount: 4
        },
        {
          x: 1420,
          y: 1343,
          width: 250,
          rotation: 0,
          arrowCount: 8
        },
        {
          x: 1920,
          y: 1345,
          width: 350,
          rotation: 0,
          arrowCount: 10
        },
        {
          x: 2450,
          y: 1345,
          width: 350,
          rotation: 0,
          arrowCount: 10
        }
      ],
      logId: 1000, // 添加一个日志ID计数器
      // —— 读取点位（与 读取点位.csv / background.js 一致）——
      conveyorHeartbeat: 0, // DBW0 输送线看门狗心跳
      conveyorRunStatus: 0, // DBW2 输送线当前运行状态
      // DBW4 区域报警
      areaAlarm: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW6 电机运行信号 01001-01016
      motorRunningWord6: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW8 电机运行信号 01017-01030
      motorRunningWord8: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW10 分拣机左右执行
      motorRunningWord10: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0'
      },
      // DBW12 光电信号--1
      photoelectricSignal1: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW14 光电信号--2
      photoelectricSignal2: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // DBW16 对接WCS信号
      wcsDockWord16: {
        bit0: '0',
        bit1: '0',
        bit2: '0',
        bit3: '0',
        bit4: '0',
        bit5: '0',
        bit6: '0',
        bit7: '0',
        bit8: '0',
        bit9: '0',
        bit10: '0',
        bit11: '0',
        bit12: '0',
        bit13: '0',
        bit14: '0',
        bit15: '0'
      },
      // 反馈WCS写虚拟ID
      sortPort01TrayId: '',
      sortPort02TrayId: '',
      sortPort03TrayId: '',
      sortPort04TrayId: '',
      sortPort05TrayId: '',
      sortPort06TrayId: '',
      sortPort07TrayId: '',
      sortPort08TrayId: '',
      sortPort09TrayId: '',
      sortPort10TrayId: '',
      sortPort11TrayId: '',
      sortPort12TrayId: '',
      sortPort13TrayId: '',
      // 各皮带工位虚拟ID（DB1000.DBB748-1137）01008~01020）
      beltStationIds: {
        M1008: '',
        M1010: ''
      },
      // PLC分拣口计数（DBW1224~DBW1248，对应分拣口1~13）
      sortPortPlcCounts: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0
      },
      // AGV/MCS轮询定时器
      mcsPollingTimer: null,
      // 数字孪生 MQTT 推送定时器
      twinMqttTimer: null,
      // 数据准备就绪标志位
      isDataReady: false
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running'
        ? this.runningLogs
        : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter((log) => log.unread).length;
    },
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    },
    sortPortPurchaseIds() {
      return {
        1: this.sortPort01TrayId,
        2: this.sortPort02TrayId,
        3: this.sortPort03TrayId,
        4: this.sortPort04TrayId,
        5: this.sortPort05TrayId,
        6: this.sortPort06TrayId,
        7: this.sortPort07TrayId,
        8: this.sortPort08TrayId,
        9: this.sortPort09TrayId,
        10: this.sortPort10TrayId,
        11: this.sortPort11TrayId,
        12: this.sortPort12TrayId,
        13: this.sortPort13TrayId
      };
    }
  },
  watch: {
    // sixScanBarcode 不再监听，所有判断和mock处理移至 handleDestinationRequest 中统一处理
    'wcsDockWord16.bit0'(newVal, oldVal) {
      if (!this.isDataReady) return;
      // 上升沿检测：0 -> 1 表示PLC请求下发目的地
      if (newVal === '1' && oldVal === '0') {
        this.addLog('收到目的地请求信号', 'running');
        // 限流：2秒内重复请求不处理
        const now = Date.now();
        if (now - this.lastDestinationReqTime < 2000) {
          this.addLog('目的地请求信号限流：2秒内重复触发，已忽略', 'alarm');
          return;
        }
        this.lastDestinationReqTime = now;
        this.handleDestinationRequest();
      }
    },
    // 分拣口虚拟ID变化检测（sortPort01TrayId~sortPort13TrayId 对应分拣口1~13）
    sortPort01TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(1);
      }
    },
    sortPort02TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(2);
      }
    },
    sortPort03TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(3);
      }
    },
    sortPort04TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(4);
      }
    },
    sortPort05TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(5);
      }
    },
    sortPort06TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(6);
      }
    },
    sortPort07TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(7);
      }
    },
    sortPort08TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(8);
      }
    },
    sortPort09TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(9);
      }
    },
    sortPort10TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(10);
      }
    },
    sortPort11TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(11);
      }
    },
    sortPort12TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(12);
      }
    },
    sortPort13TrayId(newVal) {
      if (!this.isDataReady) return;
      if ((newVal || '').trim()) {
        this.handleSortPortEntrySuccess(13);
      }
    },
    // M1008虚拟ID变化监听：包裹到达M1008工位，设置isInQueue=1
    'beltStationIds.M1008'(newVal, oldVal) {
      if (!this.isDataReady) return;
      if (!newVal || !newVal.trim()) return;
      this.handleM1008Change(newVal.trim());
    },
    // M1010虚拟ID变化监听：包裹到达M1010工位，从1008队列移动到1010队列
    'beltStationIds.M1010'(newVal, oldVal) {
      if (!this.isDataReady) return;
      if (!newVal || !newVal.trim()) return;
      this.handleM1010Change(newVal.trim());
    },
    // 异常口12、PLC计数变化：达到最大容量直接呼叫AGV（不校验队列数量一致）
    'sortPortPlcCounts.12'(newVal) {
      if (!this.isDataReady) return;
      this.onExceptionPortPlcCount(12, newVal);
    },
    // 异常口13、PLC计数变化：达到最大容量直接呼叫AGV（不校验队列数量一致）
    'sortPortPlcCounts.13'(newVal) {
      if (!this.isDataReady) return;
      this.onExceptionPortPlcCount(13, newVal);
    }
  },
  mounted() {
    this.initializeMarkers();
    this.loadQueueInfoFromDatabase();
    // 数据加载完成后创建监听（跳过 id 为 1-5 的队列）
    this._queueWatchers = []; // 保存 watcher 取消函数
    this._queueInitDone = false; // 初始化标记，跳过首次赋值触发的watch
    this.$nextTick(() => {
      this.queues.forEach((queue, index) => {
        const unwatch = this.$watch(`queues.${index}`, {
          handler(newVal, oldVal) {
            if (!this._queueInitDone) return;
            this.updateQueueInfo(queue.id);
          },
          deep: true
        });
        this._queueWatchers.push(unwatch);
      });
    });
    // 启动 MCS/AGV 队列状态轮询
    this.startMcsPolling();
    // 六面扫TCP直连（不再通过background.js中转）
    this.connectSixScan();
    ipcRenderer.on('receivedMsg', (event, values, values2) => {
      const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

      // 基础状态
      this.conveyorHeartbeat = Number(values.DBW0 ?? 0);
      this.conveyorRunStatus = Number(values.DBW2 ?? 0);

      // DBW4 区域报警
      let word4 = this.convertToWord(values.DBW4 ?? 0);
      this.areaAlarm.bit0 = getBit(word4, 8);
      this.areaAlarm.bit1 = getBit(word4, 9);
      this.areaAlarm.bit2 = getBit(word4, 10);
      this.areaAlarm.bit3 = getBit(word4, 11);
      this.areaAlarm.bit4 = getBit(word4, 12);
      this.areaAlarm.bit5 = getBit(word4, 13);
      this.areaAlarm.bit6 = getBit(word4, 14);
      this.areaAlarm.bit7 = getBit(word4, 15);
      this.areaAlarm.bit8 = getBit(word4, 0);
      this.areaAlarm.bit9 = getBit(word4, 1);
      this.areaAlarm.bit10 = getBit(word4, 2);
      this.areaAlarm.bit11 = getBit(word4, 3);
      this.areaAlarm.bit12 = getBit(word4, 4);
      this.areaAlarm.bit13 = getBit(word4, 5);
      this.areaAlarm.bit14 = getBit(word4, 6);
      this.areaAlarm.bit15 = getBit(word4, 7);

      // DBW6 电机运行信号 01001-01016
      let word6 = this.convertToWord(values.DBW6 ?? 0);
      this.motorRunningWord6.bit0 = getBit(word6, 8);
      this.motorRunningWord6.bit1 = getBit(word6, 9);
      this.motorRunningWord6.bit2 = getBit(word6, 10);
      this.motorRunningWord6.bit3 = getBit(word6, 11);
      this.motorRunningWord6.bit4 = getBit(word6, 12);
      this.motorRunningWord6.bit5 = getBit(word6, 13);
      this.motorRunningWord6.bit6 = getBit(word6, 14);
      this.motorRunningWord6.bit7 = getBit(word6, 15);
      this.motorRunningWord6.bit8 = getBit(word6, 0);
      this.motorRunningWord6.bit9 = getBit(word6, 1);
      this.motorRunningWord6.bit10 = getBit(word6, 2);
      this.motorRunningWord6.bit11 = getBit(word6, 3);
      this.motorRunningWord6.bit12 = getBit(word6, 4);
      this.motorRunningWord6.bit13 = getBit(word6, 5);
      this.motorRunningWord6.bit14 = getBit(word6, 6);
      this.motorRunningWord6.bit15 = getBit(word6, 7);

      // DBW8 电机运行信号 01017-01030
      let word8 = this.convertToWord(values.DBW8 ?? 0);
      this.motorRunningWord8.bit0 = getBit(word8, 8);
      this.motorRunningWord8.bit1 = getBit(word8, 9);
      this.motorRunningWord8.bit2 = getBit(word8, 10);
      this.motorRunningWord8.bit3 = getBit(word8, 11);
      this.motorRunningWord8.bit4 = getBit(word8, 12);
      this.motorRunningWord8.bit5 = getBit(word8, 13);
      this.motorRunningWord8.bit6 = getBit(word8, 14);
      this.motorRunningWord8.bit7 = getBit(word8, 15);
      this.motorRunningWord8.bit8 = getBit(word8, 0);
      this.motorRunningWord8.bit9 = getBit(word8, 1);
      this.motorRunningWord8.bit10 = getBit(word8, 2);
      this.motorRunningWord8.bit11 = getBit(word8, 3);
      this.motorRunningWord8.bit12 = getBit(word8, 4);
      this.motorRunningWord8.bit13 = getBit(word8, 5);
      this.motorRunningWord8.bit14 = getBit(word8, 6);
      this.motorRunningWord8.bit15 = getBit(word8, 7);

      // DBW10 分拣机左右执行
      let word10 = this.convertToWord(values.DBW10 ?? 0);
      this.motorRunningWord10.bit0 = getBit(word10, 8);
      this.motorRunningWord10.bit1 = getBit(word10, 9);
      this.motorRunningWord10.bit2 = getBit(word10, 10);
      this.motorRunningWord10.bit3 = getBit(word10, 11);
      this.motorRunningWord10.bit4 = getBit(word10, 12);
      this.motorRunningWord10.bit5 = getBit(word10, 13);
      this.motorRunningWord10.bit6 = getBit(word10, 14);
      this.motorRunningWord10.bit7 = getBit(word10, 15);
      this.motorRunningWord10.bit8 = getBit(word10, 0);
      this.motorRunningWord10.bit9 = getBit(word10, 1);
      this.motorRunningWord10.bit10 = getBit(word10, 2);
      this.motorRunningWord10.bit11 = getBit(word10, 3);

      // DBW12 光电信号--1
      let word12 = this.convertToWord(values.DBW12 ?? 0);
      this.photoelectricSignal1.bit0 = getBit(word12, 8);
      this.photoelectricSignal1.bit1 = getBit(word12, 9);
      this.photoelectricSignal1.bit2 = getBit(word12, 10);
      this.photoelectricSignal1.bit3 = getBit(word12, 11);
      this.photoelectricSignal1.bit4 = getBit(word12, 12);
      this.photoelectricSignal1.bit5 = getBit(word12, 13);
      this.photoelectricSignal1.bit6 = getBit(word12, 14);
      this.photoelectricSignal1.bit7 = getBit(word12, 15);
      this.photoelectricSignal1.bit8 = getBit(word12, 0);
      this.photoelectricSignal1.bit9 = getBit(word12, 1);
      this.photoelectricSignal1.bit10 = getBit(word12, 2);
      this.photoelectricSignal1.bit11 = getBit(word12, 3);
      this.photoelectricSignal1.bit12 = getBit(word12, 4);
      this.photoelectricSignal1.bit13 = getBit(word12, 5);
      this.photoelectricSignal1.bit14 = getBit(word12, 6);
      this.photoelectricSignal1.bit15 = getBit(word12, 7);

      // DBW14 光电信号--2
      let word14 = this.convertToWord(values.DBW14 ?? 0);
      this.photoelectricSignal2.bit0 = getBit(word14, 8);
      this.photoelectricSignal2.bit1 = getBit(word14, 9);
      this.photoelectricSignal2.bit2 = getBit(word14, 10);
      this.photoelectricSignal2.bit3 = getBit(word14, 11);
      this.photoelectricSignal2.bit4 = getBit(word14, 12);
      this.photoelectricSignal2.bit5 = getBit(word14, 13);
      this.photoelectricSignal2.bit6 = getBit(word14, 14);
      this.photoelectricSignal2.bit7 = getBit(word14, 15);
      this.photoelectricSignal2.bit8 = getBit(word14, 0);
      this.photoelectricSignal2.bit9 = getBit(word14, 1);
      this.photoelectricSignal2.bit10 = getBit(word14, 2);
      this.photoelectricSignal2.bit11 = getBit(word14, 3);
      this.photoelectricSignal2.bit12 = getBit(word14, 4);
      this.photoelectricSignal2.bit13 = getBit(word14, 5);
      this.photoelectricSignal2.bit14 = getBit(word14, 6);
      this.photoelectricSignal2.bit15 = getBit(word14, 7);

      // DBW16 对接WCS信号
      let word16 = this.convertToWord(values.DBW16 ?? 0);
      this.wcsDockWord16.bit0 = getBit(word16, 8);
      this.wcsDockWord16.bit1 = getBit(word16, 9);
      this.wcsDockWord16.bit2 = getBit(word16, 10);
      this.wcsDockWord16.bit3 = getBit(word16, 11);
      this.wcsDockWord16.bit4 = getBit(word16, 12);
      this.wcsDockWord16.bit5 = getBit(word16, 13);
      this.wcsDockWord16.bit6 = getBit(word16, 14);
      this.wcsDockWord16.bit7 = getBit(word16, 15);
      this.wcsDockWord16.bit8 = getBit(word16, 0);
      this.wcsDockWord16.bit9 = getBit(word16, 1);
      this.wcsDockWord16.bit10 = getBit(word16, 2);
      this.wcsDockWord16.bit11 = getBit(word16, 3);
      this.wcsDockWord16.bit12 = getBit(word16, 4);
      this.wcsDockWord16.bit13 = getBit(word16, 5);
      this.wcsDockWord16.bit14 = getBit(word16, 6);
      this.wcsDockWord16.bit15 = getBit(word16, 7);

      // BAD值过滤：nodes7读取失败返回"BAD xxx"质量标记，跳过赋值保持原有效值
      const safeSet = (obj, key, v) => {
        if (typeof v !== 'string' || v.slice(0, 4) !== 'BAD ')
          obj[key] = v ?? '';
      };

      // 反馈WCS写虚拟ID
      safeSet(this, 'sortPort01TrayId', values.DBB298);
      safeSet(this, 'sortPort02TrayId', values.DBB328);
      safeSet(this, 'sortPort03TrayId', values.DBB358);
      safeSet(this, 'sortPort04TrayId', values.DBB388);
      safeSet(this, 'sortPort05TrayId', values.DBB418);
      safeSet(this, 'sortPort06TrayId', values.DBB448);
      safeSet(this, 'sortPort07TrayId', values.DBB478);
      safeSet(this, 'sortPort08TrayId', values.DBB508);
      safeSet(this, 'sortPort09TrayId', values.DBB538);
      safeSet(this, 'sortPort10TrayId', values.DBB568);
      safeSet(this, 'sortPort11TrayId', values.DBB598);
      safeSet(this, 'sortPort12TrayId', values.DBB628);
      safeSet(this, 'sortPort13TrayId', values.DBB658);

      // 各皮带工位虚拟ID（DB1000.DBB748-808）
      safeSet(this.beltStationIds, 'M1008', values.DBB748);
      safeSet(this.beltStationIds, 'M1010', values.DBB808);

      // 分拣口计数（DBW1224~DBW1248）
      this.sortPortPlcCounts[1] = Number(values.DBW1224 ?? 0);
      this.sortPortPlcCounts[2] = Number(values.DBW1226 ?? 0);
      this.sortPortPlcCounts[3] = Number(values.DBW1228 ?? 0);
      this.sortPortPlcCounts[4] = Number(values.DBW1230 ?? 0);
      this.sortPortPlcCounts[5] = Number(values.DBW1232 ?? 0);
      this.sortPortPlcCounts[6] = Number(values.DBW1234 ?? 0);
      this.sortPortPlcCounts[7] = Number(values.DBW1236 ?? 0);
      this.sortPortPlcCounts[8] = Number(values.DBW1238 ?? 0);
      this.sortPortPlcCounts[9] = Number(values.DBW1240 ?? 0);
      this.sortPortPlcCounts[10] = Number(values.DBW1242 ?? 0);
      this.sortPortPlcCounts[11] = Number(values.DBW1244 ?? 0);
      this.sortPortPlcCounts[12] = Number(values.DBW1246 ?? 0);
      this.sortPortPlcCounts[13] = Number(values.DBW1248 ?? 0);
    });
    // 给PLC数据加载时间
    setTimeout(() => {
      this.addLog('isDataReady数据加载完成');
      this.isDataReady = true;
      this.startTwinMqttPublish();
    }, 3000);
  },
  methods: {
    buildTwinPayload() {
      const motors = [];
      for (let motorId = 1; motorId <= 32; motorId++) {
        let runningSignal = 0;
        if (motorId <= 16) {
          runningSignal =
            this.motorRunningWord6[`bit${motorId - 1}`] === '1' ? 1 : 0;
        } else {
          runningSignal =
            this.motorRunningWord8[`bit${motorId - 17}`] === '1' ? 1 : 0;
        }
        let largeBagNo = null;
        if (motorId >= 7 && motorId <= 20) {
          const key = `M10${String(motorId).padStart(2, '0')}`;
          const raw = this.beltStationIds[key];
          const trimmed = typeof raw === 'string' ? raw.trim() : '';
          largeBagNo = trimmed || null;
        }
        motors.push({
          motor_id: motorId,
          running_signal: runningSignal,
          large_bag_no: largeBagNo
        });
      }
      const sortingChutes = [];
      for (let chuteId = 1; chuteId <= 13; chuteId++) {
        const bag = this.sortPortPurchaseIds[chuteId];
        const trimmed = typeof bag === 'string' ? bag.trim() : '';
        sortingChutes.push({
          chute_id: chuteId,
          package_count: Number(this.sortPortPlcCounts[chuteId] ?? 0) || 0,
          large_bag_no: trimmed || ''
        });
      }
      return {
        timestamp: moment().format('YYYY-MM-DDTHH:mm:ss+08:00'),
        motors,
        sorting_chutes: sortingChutes
      };
    },
    startTwinMqttPublish() {
      this.stopTwinMqttPublish();
      this.twinMqttTimer = setInterval(() => {
        try {
          ipcRenderer.send('publishTwinMqtt', this.buildTwinPayload());
        } catch (e) {
          console.error('数字孪生 MQTT 推送失败:', e);
        }
      }, 1000);
      this.addLog('数字孪生 MQTT 推送已启动(1s)', 'running');
    },
    stopTwinMqttPublish() {
      if (this.twinMqttTimer) {
        clearInterval(this.twinMqttTimer);
        this.twinMqttTimer = null;
      }
    },
    // 获取队列托盘数量
    getQueueTrayCount(queueId) {
      const queue = this.queues.find((q) => q.id === queueId);
      return queue?.trayInfo?.length || 0;
    },
    // 判断是否为分拣口队列（queueId 2~14 对应分拣口 1~13）
    isSortPortQueue(queueId) {
      return queueId >= 2 && queueId <= 14;
    },
    // 获取分拣口PLC计数
    getSortPortPlcCount(queueId) {
      return this.sortPortPlcCounts[queueId - 1] || 0;
    },
    // 六面扫TCP直连（在渲染进程直接建立Socket，不通过background.js中转）
    connectSixScan() {
      this._sixScanDestroyed = false;
      this._doConnectSixScan();
    },
    _doConnectSixScan() {
      if (this._sixScanDestroyed) return;
      // 先清除已有的重连定时器，防止多个定时器并存
      if (this._sixScanReconnectTimer) {
        clearTimeout(this._sixScanReconnectTimer);
        this._sixScanReconnectTimer = null;
      }
      // 先解绑旧socket所有事件监听，再销毁，防止旧close回调异步污染新连接
      if (this._sixScanSocket) {
        const oldSocket = this._sixScanSocket;
        this._sixScanSocket = null; // 先置空，避免旧close回调覆盖
        oldSocket.removeAllListeners();
        oldSocket.destroy();
      }
      const socket = new net.Socket();
      socket.setEncoding('utf8');

      socket.on('connect', () => {
        this.sixScanSocketConnected = true;
        socket.setKeepAlive(true, 60000);
        this.addLog(`六面扫Socket已连接 ${SIX_SCAN_HOST}:${SIX_SCAN_PORT}`);
        // 清除重连定时器
        if (this._sixScanReconnectTimer) {
          clearTimeout(this._sixScanReconnectTimer);
          this._sixScanReconnectTimer = null;
        }
      });

      socket.on('data', (data) => {
        try {
          const barcodeStr = (data || '').toString().trim();
          if (barcodeStr) {
            this.addLog(`六面扫收到数据: ${barcodeStr}`);
            this.handleSixScanSocketData(barcodeStr);
          }
        } catch (e) {
          this.addLog(`六面扫数据解析异常: ${e.message}`, 'alarm');
        }
      });

      socket.on('close', () => {
        this.sixScanSocketConnected = false;
        // 只有当前socket才是触发源，防止旧socket的close回调污染新引用
        if (this._sixScanSocket === socket) {
          this._sixScanSocket = null;
        }
        if (!this._sixScanDestroyed) {
          this.addLog('六面扫Socket连接断开，准备重连', 'alarm');
          this._sixScanReconnectTimer = setTimeout(() => {
            this._doConnectSixScan();
          }, SIX_SCAN_RECONNECT_DELAY);
        }
      });

      socket.on('error', (err) => {
        this.addLog(`六面扫连接错误: ${err.message}`, 'alarm');
        this.sixScanSocketConnected = false;
      });

      this._sixScanSocket = socket;
      try {
        socket.connect(SIX_SCAN_PORT, SIX_SCAN_HOST);
      } catch (e) {
        this.addLog(`六面扫首次连接异常: ${e.message}`, 'alarm');
      }
    },
    // 断开六面扫Socket，清理资源
    disconnectSixScan() {
      this._sixScanDestroyed = true;
      if (this._sixScanReconnectTimer) {
        clearTimeout(this._sixScanReconnectTimer);
        this._sixScanReconnectTimer = null;
      }
      if (this._sixScanSocket) {
        this._sixScanSocket.removeAllListeners();
        this._sixScanSocket.destroy();
        this._sixScanSocket = null;
      }
    },
    // 处理六面扫Socket发来的条码数据
    handleSixScanSocketData(rawBarcode) {
      const rawStr = (rawBarcode || '').trim();
      // 始终显示原始数据到面板（去掉首尾方括号），由 watch 统一判断
      this.lastProcessedBarcode = rawStr.replace(/^\[|\]$/g, '');

      // 多码格式预检：[xxxx][xxxx]（含多个方括号段）直接传原始串，让 watch 拦截
      const bracketSegments = rawStr.match(/\[[^\]]*\]/g);
      if (bracketSegments && bracketSegments.length >= 2) {
        this.sixScanBarcode = rawStr; // 保留原始格式，触发 watch 多码检测
        return;
      }

      // 单码：提取方括号内容，赋值给 sixScanBarcode 触发 watch 统一处理
      let innerContent = rawStr;
      if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
        innerContent = rawStr.slice(1, -1);
      }
      this.sixScanBarcode = innerContent.trim();
    },
    // 目的地请求处理入口（DBW16.bit0上升沿触发）
    // 不再依赖 sixScanBarcode watch 缓存，直接拿当前条码进行判断和mock处理
    async handleDestinationRequest() {
      const barcode = (this.sixScanBarcode || '').trim();

      // 1. 条码为空
      if (!barcode) {
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW8', 999);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW8');
        }, 1000);
        this.addLog(
          '收到目的地请求信号，但当前无条码数据，目的地写999',
          'alarm'
        );
        return;
      }

      // 2. NoRead 判断（关键字识别）
      if (barcode.indexOf('NoRead') !== -1) {
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW8', 999);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW8');
        }, 1000);
        this.addLog(
          `收到目的地请求信号，六面扫未读到条码（${barcode}），报警：条码无效，目的地写999`,
          'alarm'
        );
        return;
      }

      // 3. 多码判断（逗号分隔）
      const parts = barcode.split(',');
      if (parts.length > 1) {
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW8', 999);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW8');
        }, 1000);
        this.addLog(
          `收到目的地请求信号，六面扫读到多个条码（${barcode}），报警：条码无效，目的地写999`,
          'alarm'
        );
        return;
      }
      // 多码判断：[xxxx][xxxx] 格式
      const bracketMatches = barcode.match(/\[[^\]]*\]/g);
      if (bracketMatches && bracketMatches.length >= 2) {
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW8', 999);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW8');
        }, 1000);
        this.addLog(
          `收到目的地请求信号，六面扫读到多码格式条码（${barcode}），报警：条码无效，目的地写999`,
          'alarm'
        );
        return;
      }

      // 4. 单码重复检测：查1008队列中是否已有同 packageNo 的条目
      const existingIndex = this.queues[0].trayInfo.findIndex(
        (item) => item.packageNo === barcode
      );
      if (existingIndex !== -1) {
        // 重复包裹：从1008队列删除老条目，写 DBW104=1 保持2秒后取消，不再重新入队
        const oldItem = this.queues[0].trayInfo.splice(existingIndex, 1)[0];
        if (this.selectedQueueIndex === 0) {
          this.showTrays(0);
        }
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW104', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW104');
        }, 2000);
        this.addLog(
          `目的地请求：条码重复，已移除1008队列中老信息（原分拣口：${
            oldItem.allocatedPortNo || '--'
          }），已写DBW104=1（2秒后取消），条码：${barcode}`,
          'alarm'
        );
        return;
      }

      // 5. 获取包裹数据（停用菜鸟走 mock，否则查菜鸟接口）
      const packageInfo = await this.resolvePackageInfo(barcode);
      if (!packageInfo) {
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW8', 999);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW8');
        }, 1000);
        this.addLog(
          `菜鸟查询未成功，已写目的地999，终止后续分配与落库，条码：${barcode}`,
          'alarm'
        );
        this.$message.error('菜鸟大包查询失败，已发送999');
        return;
      }
      this.nowScanTrayInfo = packageInfo;
      const packageSize = packageInfo.packageSize;
      try {
        // 1. 分配分拣口（大包1~9循环；同一分拣口仅允许同一渠道号）
        const port = this.allocateSortPort(packageSize, packageInfo.channel);
        if (!port) {
          throw new Error(
            `无法分配分拣口，所有${
              packageSize === 'large' ? '大件' : '小件'
            }分拣口已满或无匹配渠道号（${packageInfo.channel || '--'}）的可用口`
          );
        }

        // 2. 计算该分拣口当前负载（分拣口队列中 + 1008队列中已分配该口的 + 1010队列中已分配该口的）
        const queueId = port.portNo + 1; // 队列ID = portNo + 1（ID=1是1008，ID=2~14是分拣口）
        const portQueue = this.queues.find((q) => q.id === queueId);
        const portQueueCount = portQueue ? portQueue.trayInfo.length : 0;
        const q1008Count = this.queues[0].trayInfo.filter(
          (item) => item.allocatedPortNo === port.portNo
        ).length;
        const q1010 = this.queues.find((q) => q.id === 15);
        const q1010Count = q1010
          ? q1010.trayInfo.filter(
              (item) => item.allocatedPortNo === port.portNo
            ).length
          : 0;
        const currentLoad = portQueueCount + q1008Count + q1010Count;
        const sequenceNo = currentLoad + 1;

        // 3. 判断是否最后一件
        const isLast = currentLoad + 1 >= port.maxCapacity;

        // 4. 构建目的地编码
        const destinationCode = this.buildDestinationCode(
          port.machineNo,
          port.direction,
          sequenceNo,
          isLast
        );

        // 5. 写入目的地 DB1001.DBW8
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBW8', destinationCode);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBW8');
        }, 1000);

        // 6. 写入虚拟ID DB1001.DBB10-39
        ipcRenderer.send('writeSingleValueToPLC', 'W_DBB10', barcode);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'W_DBB10');
        }, 1000);
        this.addLog(
          `分配分拣口${port.portNo}（${
            port.sizeType === 'large' ? '大件' : '小件'
          }），分拣机${port.machineNo}，流水号${sequenceNo}，${
            isLast ? '最后一件' : '普通'
          }，目的地编码：${destinationCode},已写入目的地编码：${destinationCode}，已写入虚拟ID（条码）：${barcode},分拣口当前包裹数量：${portQueueCount}，1008队列包裹数量：${q1008Count}，1010队列包裹数量：${q1010Count}`
        );

        // 7. 保存订单到 order_info
        const payload = toOrderInfoPayload(packageInfo);
        const res = await HttpUtil.post('/order_info/save', payload);
        const savedOrder = res && res.data;
        if (!savedOrder || savedOrder.id == null) {
          throw new Error((res && res.message) || '保存订单失败');
        }

        // 8. 构建队列项，加入1008队列（queues[0]）
        const queueItem = {
          orderInfoId: savedOrder.id,
          packageNo: packageInfo.packageNo,
          trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          channel: packageInfo.channel,
          packingWeight: packageInfo.packingWeight,
          expectedQty: packageInfo.expectedQty,
          trayStatus: '1',
          allocatedPortNo: port.portNo, // 记录分配的分拣口号，用于负载统计
          destinationCode: destinationCode, // 记录发送的目的地编码
          isInQueue: '0' // 包裹是否在队列中（M1008确认后置为1）
        };
        this.queues[0].trayInfo.push(queueItem);

        if (this.selectedQueueIndex === 0) {
          this.showTrays(0);
        }

        this.addLog(
          `目的地请求处理完成，大包号：${packageInfo.packageNo}，已加入1008队列（当前 ${this.queues[0].trayInfo.length} 件），目标分拣口：${port.portNo}`
        );
        this.$message.success(
          `大包 ${packageInfo.packageNo} 已分配至分拣口${port.portNo}`
        );
      } catch (error) {
        console.error('目的地请求处理失败:', error);
        this.$message.error(`目的地请求处理失败：${error.message || '请重试'}`);
        this.addLog(
          `目的地请求处理失败，条码：${barcode}，原因：${
            error.message || '请重试'
          }`
        );
      }
    },
    // M1008虚拟ID变化处理：包裹到达M1008工位，设置1008队列中对应包裹的isInQueue=1
    handleM1008Change(virtualId) {
      const q1008 = this.queues[0]; // 1008队列
      const matchedItem = q1008.trayInfo.find(
        (item) => (item.packageNo || '').trim() === virtualId
      );
      if (matchedItem) {
        matchedItem.isInQueue = '1';
        this.addLog(
          `M1008确认包裹到达：大包号 ${virtualId}，已设置isInQueue=1`
        );
      } else {
        this.addLog(
          `M1008虚拟ID变化：大包号 ${virtualId}，但1008队列中未找到对应包裹`,
          'alarm'
        );
      }
      // 刷新当前选中队列显示
      if (this.selectedQueueIndex === 0) {
        this.showTrays(0);
      }
    },
    // M1010虚拟ID变化处理：包裹到达M1010工位，从1008队列移动到1010队列
    handleM1010Change(virtualId) {
      const q1008 = this.queues[0]; // 1008队列
      const q1010 = this.queues.find((q) => q.id === 15); // 1010队列
      if (!q1010) {
        this.addLog('M1010处理失败：1010队列不存在', 'alarm');
        return;
      }

      // 在1008队列中查找本包裹位置
      const currentIndex = q1008.trayInfo.findIndex(
        (item) => (item.packageNo || '').trim() === virtualId
      );
      if (currentIndex === -1) {
        this.addLog(
          `M1010虚拟ID变化：大包号 ${virtualId}，但1008队列中未找到对应包裹`,
          'alarm'
        );
        return;
      }

      const currentItem = q1008.trayInfo[currentIndex];

      // 检查isInQueue状态
      if (currentItem.isInQueue !== '1') {
        this.addLog(
          `M1010报警：大包号 ${virtualId} 的isInQueue不为1（未经过M1008确认），仍然移动到1010队列`,
          'alarm'
        );
      }

      // 因1010虚拟ID变化有时监听不到，前面的包裹保留在1008队列中，不做剔除处理
      if (currentIndex > 0) {
        this.addLog(
          `M1010处理：大包号 ${virtualId} 前面有 ${currentIndex} 个包裹未到达M1010，保留在1008队列中`,
          'alarm'
        );
      }

      // 将本包裹从1008队列移除并加入1010队列
      const [movedItem] = q1008.trayInfo.splice(currentIndex, 1);
      q1010.trayInfo.push(movedItem);

      this.addLog(
        `M1010确认包裹通过：大包号 ${virtualId} 已从1008队列移动到1010队列（1010当前 ${q1010.trayInfo.length} 件）`
      );

      // 刷新当前选中队列显示
      if (
        this.selectedQueueIndex === 0 ||
        this.selectedQueueIndex === this.queues.findIndex((q) => q.id === 15) ||
        this.selectedQueueIndex === this.queues.findIndex((q) => q.id === 16)
      ) {
        this.$nextTick(() => {
          this.showTrays(this.selectedQueueIndex);
        });
      }
    },
    // 分拣口进货处理：虚拟ID变化 → 取进货ID → 从1010队列移入对应分拣口队列
    handleSortPortEntrySuccess(portNo) {
      // 1. 根据分拣口号获取对应的进货ID（大包号，即六面扫条码号）
      const sortPortIdMap = {
        1: 'sortPort01TrayId',
        2: 'sortPort02TrayId',
        3: 'sortPort03TrayId',
        4: 'sortPort04TrayId',
        5: 'sortPort05TrayId',
        6: 'sortPort06TrayId',
        7: 'sortPort07TrayId',
        8: 'sortPort08TrayId',
        9: 'sortPort09TrayId',
        10: 'sortPort10TrayId',
        11: 'sortPort11TrayId',
        12: 'sortPort12TrayId',
        13: 'sortPort13TrayId'
      };

      const trayIdKey = sortPortIdMap[portNo];
      if (!trayIdKey) {
        this.addLog(`分拣口${portNo}虚拟ID变化信号无效，portNo超出范围`);
        return;
      }

      const entryId = (this[trayIdKey] || '').trim();
      if (!entryId) {
        this.addLog(
          `分拣口${portNo}虚拟ID变化，但进货ID为空（${trayIdKey}），跳过处理`
        );
        return;
      }

      this.addLog(`分拣口${portNo}虚拟ID变化，进货ID（大包号）：${entryId}`);

      // 2. 在（因1010虚拟ID变化有时监听不到，包裹可能仍在）：依次从1010队列、1008队列中查找匹配的包裹（条码匹配 + 目的地匹配本分拣口）
      // 分拣口12、13仅按大包号匹配，不校验目的地
      const onlyMatchPackageNo = portNo === 12 || portNo === 13;
      const q1010Index = this.queues.findIndex((q) => q.id === 15);
      const q1010 = this.queues[q1010Index];
      const matchFn = (item) =>
        (item.packageNo || '').trim() === entryId &&
        (onlyMatchPackageNo || item.allocatedPortNo === portNo);

      let sourceQueue = null;
      let sourceQueueIndex = -1;
      let trayIndex = -1;

      if (q1010) {
        trayIndex = q1010.trayInfo.findIndex(matchFn);
        if (trayIndex !== -1) {
          sourceQueue = q1010;
          sourceQueueIndex = q1010Index;
        }
      }
      if (trayIndex === -1 && this.queues[0]) {
        trayIndex = this.queues[0].trayInfo.findIndex(matchFn);
        if (trayIndex !== -1) {
          sourceQueue = this.queues[0];
          sourceQueueIndex = 0;
        }
      }

      if (trayIndex === -1) {
        this.addLog(
          onlyMatchPackageNo
            ? `分拣口${portNo}虚拟ID变化，但1010、1008队列均未找到大包号 ${entryId} 的包裹，跳过`
            : `分拣口${portNo}虚拟ID变化，但1010、1008队列均未找到大包号 ${entryId} 且目的地为分拣口${portNo} 的包裹，跳过`
        );
        return;
      }

      // 3. 从源队列（1010或1008）移除该包裹
      const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);

      // 4. 加入对应分拣口队列（queues[portNo]）
      const targetQueueIndex = portNo; // queues[1]=分拣口1, queues[13]=分拣口13
      const targetQueue = this.queues[targetQueueIndex];
      if (!targetQueue) {
        this.addLog(`分拣口${portNo}对应队列不存在，包裹 ${entryId} 无法移入`);
        // 回滚：将包裹放回源队列
        sourceQueue.trayInfo.splice(trayIndex, 0, movedTray);
        return;
      }

      targetQueue.trayInfo.push(movedTray);
      // 分拣口包裹数量变化，检查并更新DBW100
      this.checkAndWriteDBW100();

      // 6. 刷新当前选中队列显示
      if (
        this.selectedQueueIndex === sourceQueueIndex ||
        this.selectedQueueIndex === targetQueueIndex
      ) {
        this.$nextTick(() => {
          this.showTrays(this.selectedQueueIndex);
        });
      }

      this.addLog(
        `大包 ${entryId} 已从${sourceQueue.queueName}移入${targetQueue.queueName}（当前 ${targetQueue.trayInfo.length} 件）`
      );
      this.$message.success(`大包 ${entryId} 已进入${targetQueue.queueName}`);

      // 分拣口队列达到最大容量时，触发满容量判断（对比PLC计数与队列数量）
      const portConfig = this.sortPortConfig.find((p) => p.portNo === portNo);
      const maxCapacity = portConfig ? portConfig.maxCapacity : 5;
      if (targetQueue.trayInfo.length >= maxCapacity) {
        this.handleSortPortFull(portNo);
      }
    },
    // ========== AGV/MCS 相关方法 ==========
    // 手动呼叫AGV：弹出确认后直接呼叫AGV取货（不做计数校验）
    callAgv(portNo) {
      this.$confirm('本操作会呼叫AGV取货，并锁定分拣口，是否继续？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.doCallAgv(portNo);
        })
        .catch(() => {
          this.$message.info('已取消呼叫AGV');
        });
    },
    // 异常口（12、13）PLC计数变化处理：达到最大容量且未锁定时，触发直接呼叫AGV
    onExceptionPortPlcCount(portNo, plcCount) {
      const portConfig = this.sortPortConfig.find((p) => p.portNo === portNo);
      const maxCapacity = portConfig ? portConfig.maxCapacity : 5;
      const queue = this.queues[portNo];
      if (!queue || queue.isLock === '1') return;
      if ((plcCount || 0) < maxCapacity) return;
      this.handleSortPortFull(portNo);
    },
    // 异常口（12、13）自动补齐队列包裹，使队列数量与PLC计数一致
    autoFillExceptionPortQueue(portNo, plcCount) {
      const queue = this.queues[portNo];
      if (!queue) return;
      const needCount = (plcCount || 0) - queue.trayInfo.length;
      if (needCount <= 0) return;
      // 已占用大包号（防止本次自动生成重复）
      const usedNos = new Set(
        queue.trayInfo.map((t) => (t.packageNo || '').trim())
      );
      // 模拟大包号规则：KRRM + 8位数字（数字取自时间戳后8位，如 KRRM12345678）
      let seq = 0;
      const genPackageNo = () => {
        let no;
        do {
          const num = String((Date.now() + seq++) % 100000000).padStart(8, '0');
          no = `KRRM${num}`;
        } while (usedNos.has(no));
        usedNos.add(no);
        return no;
      };
      for (let i = 0; i < needCount; i++) {
        queue.trayInfo.push({
          orderInfoId: null,
          packageNo: genPackageNo(),
          trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          channel: '',
          packingWeight: 0,
          expectedQty: 0,
          trayStatus: '1',
          allocatedPortNo: portNo,
          destinationCode: '',
          isInQueue: '1'
        });
      }
      this.addLog(
        `分拣口${portNo}（异常口）队列数量与PLC计数不一致，自动补齐${needCount}个包裹（补齐后${queue.trayInfo.length}件，PLC计数${plcCount}）`
      );
      if (this.selectedQueueIndex === portNo) {
        this.$nextTick(() => {
          this.showTrays(portNo);
        });
      }
    },
    // 分拣口队列达到最大容量后，对比PLC计数与队列数量，决定呼叫AGV或锁定报警
    async handleSortPortFull(portNo) {
      const queueIndex = portNo; // queues[1]=分拣口1, ..., queues[13]=分拣口13
      const queue = this.queues[queueIndex];
      if (!queue) {
        this.addLog(`分拣口${portNo}满容量判断失败，队列不存在`);
        return;
      }
      // 已锁定的分拣口不重复处理
      if (queue.isLock === '1') {
        this.addLog(`分拣口${portNo}已锁定，忽略满容量重复触发`);
        return;
      }

      const portConfig = this.sortPortConfig.find((p) => p.portNo === portNo);
      const maxCapacity = portConfig ? portConfig.maxCapacity : 5;
      const queueCount = queue.trayInfo.length;
      const plcCount = this.sortPortPlcCounts[portNo] || 0;

      // 异常口（12、13）：PLC计数达到最大容量即直接呼叫AGV，不校验队列数量一致；数量不足自动补齐包裹
      const isExceptionPort = portConfig && portConfig.sizeType === 'exception';
      if (isExceptionPort) {
        if (plcCount < maxCapacity) {
          this.addLog(
            `分拣口${portNo}（异常口）PLC计数${plcCount}未达最大容量${maxCapacity}，暂不呼叫AGV`
          );
          return;
        }
        if (queueCount < plcCount) {
          this.autoFillExceptionPortQueue(portNo, plcCount);
        }
        this.addLog(
          `分拣口${portNo}（异常口）PLC计数达到${plcCount}，直接呼叫AGV取货`
        );
        await this.doCallAgv(portNo);
        return;
      }

      this.addLog(
        `分拣口${portNo}队列已满（${queueCount}/${maxCapacity}），PLC计数：${plcCount}，队列数量：${queueCount}`
      );

      // 对比PLC分拣口计数与分拣口队列数量
      if (plcCount !== queueCount) {
        // 数量不匹配：发送锁定信号 + 报警，不呼叫AGV
        this.addLog(
          `分拣口${portNo}数量不匹配！PLC计数=${plcCount}，队列数量=${queueCount}，发送锁定信号，暂停呼叫AGV`,
          'alarm'
        );
        // 锁定队列
        this.syncAgvStatusToBackend(queue.id, null, '1');
        // 发送PLC禁止进货命令
        const forbidBitAdd = `W_DBW102_BIT${queueIndex - 1}`;
        ipcRenderer.send('writeSingleValueToPLC', forbidBitAdd, true);
        this.addLog(
          `已发送PLC禁止进货命令 ${forbidBitAdd}=true（分拣口${portNo}，数量不匹配锁定）`
        );
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', forbidBitAdd);
        }, 1000);
        return;
      }

      // 数量匹配：呼叫AGV取货
      this.addLog(`分拣口${portNo}数量匹配，开始呼叫AGV取货`);
      await this.doCallAgv(portNo);
    },
    // 核心AGV呼叫逻辑：调MCS通知AGV取货 + 锁定队列 + 发PLC禁止进货
    async doCallAgv(portNo) {
      const queueIndex = portNo;
      const queue = this.queues[queueIndex];
      if (!queue) {
        this.addLog(`分拣口${portNo}呼叫AGV失败，队列不存在`);
        return;
      }
      if (queue.isLock === '1') {
        this.addLog(`分拣口${portNo}已锁定，忽略重复呼叫AGV`);
        return;
      }

      // 1. 调用MCS接口通知AGV取货
      let mcsSuccess = false;
      try {
        // 队列有多少包就生成多少个bindList
        const bindList = (queue.trayInfo || []).map((tray) => {
          const pkgNo = tray.packageNo || '';
          return {
            materialCategoryCode: 'M1',
            materialDataCode: pkgNo,
            attributeList: [
              { attributeCode: 'trackingNumber', attributeValue: pkgNo },
              { attributeCode: 'weight', attributeValue: '0' },
              { attributeCode: 'channel', attributeValue: tray.channel || '' }
            ]
          };
        });
        const mcsPayload = {
          // 任务id，生成不重复的时间戳
          signalId: String(Date.now()),
          // 触发源类型固定：2-工位
          signalSourceType: 2,
          // 信号值（任务类型），固定4
          signalTriggerValue: 4,
          // 触发源（下料点点位编号，GW01~GW13的分拣口编号）
          signalSourceValues: [`GW${String(portNo).padStart(2, '0')}`],
          // 载具类型，固定T1
          carrierTypeCode: '1',
          materialBind: { bindList }
        };
        const res = await HttpUtilMcs.post(
          '/mcs/api/v2/task/receiveSignal',
          mcsPayload
        );
        // 判断接口返回是否真正成功（success为true且code为"0"）
        if (!res || res.success === false) {
          const errCode = (res && res.code) || '未知';
          const errMsg = (res && res.message) || '未知错误';
          this.addLog(
            `MCS接口调用失败，分拣口${portNo}，错误码：${errCode}，原因：${errMsg}`,
            'alarm'
          );
        } else {
          this.addLog(`MCS接口调用成功，分拣口${portNo}，通知AGV取货`);
          mcsSuccess = true;
        }
      } catch (err) {
        console.error('MCS接口调用失败:', err);
        this.addLog(
          `MCS接口调用失败，分拣口${portNo}，原因：${
            err.message || '网络错误'
          }`,
          'alarm'
        );
      }

      // 2. 更新队列状态（成功设置0:等待取货，失败设置3:AGV调用失败）
      if (mcsSuccess) {
        this.syncAgvStatusToBackend(queue.id, '0', '1');
      } else {
        this.syncAgvStatusToBackend(queue.id, '3', '1');
        this.addLog(
          `分拣口${portNo} AGV调用失败，队列状态已更新为失败`,
          'alarm'
        );
      }

      // 3. 发送PLC分拣口禁止进货命令 DB1001.DBW102 对应位
      const forbidBitAdd = `W_DBW102_BIT${queueIndex - 1}`;
      ipcRenderer.send('writeSingleValueToPLC', forbidBitAdd, true);
      this.addLog(
        `已发送PLC禁止进货命令 ${forbidBitAdd}=true（分拣口${portNo}）`
      );
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', forbidBitAdd);
      }, 1000);
    },
    // 检查系统状态并写入DBW100（分拣口满容量/AGV运输状态信号）
    // 条件1：所有分拣口都达到最大容量 → 写1
    // 条件2：所有分拣口队列的状态都是AGV运输状态（trayStatus='0'或'1'） → 写1
    // 否则 → 写0
    checkAndWriteDBW100() {
      // 检查所有分拣口（1~13）是否都达到最大容量
      const allPortsFull = this.sortPortConfig.every((port) => {
        const queue = this.queues[port.portNo];
        if (!queue) return false;
        return queue.trayInfo.length >= port.maxCapacity;
      });

      // 检查所有分拣口队列的状态是否都是AGV运输状态
      // AGV运输状态：trayStatus='0'（等待AGV取货）或'1'（AGV取货完成）
      const allQueuesInAgv = this.sortPortConfig.every((port) => {
        const queue = this.queues[port.portNo];
        if (!queue) return false;
        return queue.trayStatus === '0' || queue.trayStatus === '1';
      });

      const dbw100Value = allPortsFull || allQueuesInAgv ? 1 : 0;
      ipcRenderer.send('writeValuesToPLC', 'W_DBW100', dbw100Value);
    },
    // 启动 MCS/AGV 队列状态轮询
    startMcsPolling() {
      if (this.mcsPollingTimer) {
        clearInterval(this.mcsPollingTimer);
      }
      // 立即执行一次，然后每5秒轮询
      this.pollQueueAgvStatus();
      this.mcsPollingTimer = setInterval(this.pollQueueAgvStatus, 5000);
    },
    // 停止 MCS/AGV 轮询
    stopMcsPolling() {
      if (this.mcsPollingTimer) {
        clearInterval(this.mcsPollingTimer);
        this.mcsPollingTimer = null;
      }
    },
    // 轮询队列AGV状态（同步数据库状态到前端，防止前端缓存过期覆盖后端）
    pollQueueAgvStatus() {
      HttpUtil.post('/queue_info/queryQueueList', {})
        .then((res) => {
          if (!res.data || !res.data.length) return;
          res.data.forEach((queueData) => {
            const queueId = queueData.id;
            const queueIndex = queueId - 1;
            if (queueIndex < 1 || queueIndex >= this.queues.length) return; // 跳过1008队列(id=1)
            const queue = this.queues[queueIndex];
            const dbTrayStatus = queueData.trayStatus || '';
            const dbIsLock = queueData.isLock || '';

            // 同步数据库状态到前端，防止前端缓存过期被watcher覆盖回后端
            queue.trayStatus = dbTrayStatus;
            queue.isLock = dbIsLock;

            // 以数据库状态为准，根据 dbTrayStatus 直接执行对应动作
            if (dbTrayStatus === '2') {
              // AGV已送空托盘回来 → 解除PLC禁止进货命令
              // 前端解锁：直接传值更新后端，成功后同步前端缓存
              this.syncAgvStatusToBackend(queueId, '', '');
              this.clearPlcForbidPort(queueIndex);
              // 清空该分拣口队列数据（AGV已取走货物，空托返回后队列应清空，watcher会自动同步后端）
              queue.trayInfo = [];
              // 刷新当前选中队列的显示
              if (
                this.selectedQueueIndex === queueIndex ||
                this.selectedQueueIndex === 0
              ) {
                this.$nextTick(() => {
                  this.showTrays(this.selectedQueueIndex);
                });
              }
              this.addLog(
                `分拣口${queueIndex} AGV空托盘已返回，解除禁止进货,分拣口${queueIndex} 队列数据已清空`
              );
            }
          });
          // 数据库状态同步后检查并更新DBW100
          this.checkAndWriteDBW100();
        })
        .catch((err) => {
          console.error('轮询队列AGV状态失败:', err);
        });
    },
    // 解除PLC某分拣口的禁止进货命令：先发true（1秒），再发false（2秒），最后取消写入
    clearPlcForbidPort(queueIndex) {
      const forbidBitAdd = `W_DBW102_BIT${queueIndex - 1}`;
      // 第一步：发送 true（禁止进货），持续1秒
      ipcRenderer.send('writeSingleValueToPLC', forbidBitAdd, true);
      this.addLog(
        `分拣口${queueIndex}解除禁止进货：${forbidBitAdd}=true（保持1秒）`
      );
      // 第二步：1秒后发送 false（允许进货），持续2秒
      setTimeout(() => {
        ipcRenderer.send('writeSingleValueToPLC', forbidBitAdd, false);
        this.addLog(
          `分拣口${queueIndex}解除禁止进货：${forbidBitAdd}=false（保持2秒）`
        );
        // 第三步：再2秒后取消写入
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', forbidBitAdd);
        }, 5000);
      }, 1000);
    },
    // 全线清空时给PLC发送的命令：所有分拣口先禁止进货2秒，再允许进货2秒，最后取消写入
    clearAllSortPortsForLineClear() {
      // 分拣口1-13对应 W_DBW102_BIT0 - W_DBW102_BIT12
      const portCount = 13;
      const forbidBitAdds = [];
      for (let i = 0; i < portCount; i++) {
        forbidBitAdds.push(`W_DBW102_BIT${i}`);
      }

      // 第一步：所有分拣口发送 true（禁止进货），持续2秒
      forbidBitAdds.forEach((add) => {
        ipcRenderer.send('writeSingleValueToPLC', add, true);
      });

      // 第二步：2秒后所有分拣口发送 false（允许进货），持续2秒
      setTimeout(() => {
        forbidBitAdds.forEach((add) => {
          ipcRenderer.send('writeSingleValueToPLC', add, false);
        });
        this.addLog('全线清空：所有分拣口禁止命令已处理');

        // 第三步：再2秒后取消所有分拣口的PLC写入
        setTimeout(() => {
          forbidBitAdds.forEach((add) => {
            ipcRenderer.send('cancelWriteToPLC', add);
          });
          this.addLog('全线清空：已取消所有分拣口PLC写入');
        }, 2000);
      }, 1000);
    },
    // 分拣口分配算法
    // 大包(1~9)：同渠道未满口优先续放；满后按1→9循环开新空口；一口一渠道
    // 小包(10~11)：同渠道未满口优先，否则按口号顺序开空口；一口一渠道
    allocateSortPort(packageSize, channel) {
      const channelKey = (channel || '').trim();
      // 根据包裹大小过滤可用分拣口（排除异常口）
      const candidates = this.sortPortConfig.filter(
        (p) => p.sizeType === packageSize
      );
      // 按portNo从小到大排序
      candidates.sort((a, b) => a.portNo - b.portNo);

      // 计算每个分拣口的当前负载与占用渠道
      const q1010 = this.queues.find((q) => q.id === 15);
      const portLoads = candidates
        .map((port) => {
          const queueId = port.portNo + 1;
          const portQueue = this.queues.find((q) => q.id === queueId);
          // 已锁定的分拣口不参与分配（AGV取货中或已锁定）
          if (portQueue && portQueue.isLock === '1') {
            return null;
          }
          const assignedItems = [];
          if (portQueue) {
            assignedItems.push(...portQueue.trayInfo);
          }
          // 1008队列中已分配该口目的地的包裹
          this.queues[0].trayInfo.forEach((item) => {
            if (item.allocatedPortNo === port.portNo) {
              assignedItems.push(item);
            }
          });
          // 1010队列中已分配该口目的地的包裹
          if (q1010) {
            q1010.trayInfo.forEach((item) => {
              if (item.allocatedPortNo === port.portNo) {
                assignedItems.push(item);
              }
            });
          }
          const currentLoad = assignedItems.length;
          const occupiedItem = assignedItems.find(
            (item) => (item.channel || '').trim() !== ''
          );
          const occupiedChannel = occupiedItem
            ? (occupiedItem.channel || '').trim()
            : '';
          return { port, currentLoad, occupiedChannel };
        })
        .filter(Boolean);

      // 优先级1：已有同渠道包裹且未满的分拣口（一口一渠道，优先续满）
      const sameChannelPartial = portLoads.filter(
        (p) =>
          p.currentLoad > 0 &&
          p.currentLoad < p.port.maxCapacity &&
          p.occupiedChannel === channelKey
      );
      if (sameChannelPartial.length > 0) {
        return sameChannelPartial[0].port;
      }

      // 优先级2：空闲分拣口
      const empty = portLoads.filter((p) => p.currentLoad === 0);
      if (empty.length === 0) {
        return null;
      }

      // 大包：容量满后按 1~9 顺序循环开新口
      if (packageSize === 'large') {
        const largePortNos = candidates.map((p) => p.portNo);
        let startIdx = largePortNos.indexOf(this.lastLargeAllocPortNo);
        if (startIdx < 0) {
          startIdx = -1;
        }
        for (let i = 1; i <= largePortNos.length; i++) {
          const idx = (startIdx + i) % largePortNos.length;
          const portNo = largePortNos[idx];
          const found = empty.find((e) => e.port.portNo === portNo);
          if (found) {
            this.lastLargeAllocPortNo = portNo;
            return found.port;
          }
        }
        return null;
      }

      // 小包：按口号从小到大取空口
      return empty[0].port;
    },
    // 手动模拟 DBW16.bit0 上升沿信号（测试用）
    triggerDestinationRequest() {
      this.wcsDockWord16.bit0 = '1';
      this.addLog('手动触发 DBW16.bit0 = 1（1秒后恢复）');
      setTimeout(() => {
        this.wcsDockWord16.bit0 = '0';
        this.addLog('DBW16.bit0 已恢复为 0');
      }, 1000);
    },
    // 构建目的地编码
    buildDestinationCode(machineNo, direction, sequenceNo, isLast) {
      // 新规则：固定4位编码，废弃流水号逻辑
      // 非最后一件货：machineNo * 1000 + direction * 100 + 0
      // 最后一件货：machineNo * 1000 + direction * 100 + 10（第三位写1）
      if (isLast) {
        // 最后一件货：1100 + direction*100 + 10
        // 例：1号机向下最后一件 = 1110，1号机向上最后一件 = 1210
        // 例：3号机向下最后一件 = 3110
        return machineNo * 1000 + direction * 100 + 10;
      } else {
        // 普通货物：1100 + direction*100 + 0
        // 例：1号机向下 = 1100，1号机向上 = 1200
        // 例：3号机向下 = 3100
        return machineNo * 1000 + direction * 100 + 0;
      }
    },
    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
      // 当展开面板时，刷新当前选中队列的托盘信息
      if (this.isQueueExpanded && this.selectedQueueIndex !== -1) {
        this.showTrays(this.selectedQueueIndex);
      }
    },
    // 显示订单查询对话框
    showOrderQueryDialog() {
      this.orderQueryDialogVisible = true;
    },
    toggleDisableCainiao() {
      const willDisable = !this.disableCainiao;
      const confirmMsg = willDisable
        ? '确定要停用菜鸟接口吗？停用后将使用 Mock 数据。'
        : '确定要重新启用菜鸟接口吗？';
      this.$confirm(confirmMsg, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.disableCainiao = willDisable;
          const tip = this.disableCainiao
            ? '已停用菜鸟，包裹信息使用 Mock 数据'
            : '已启用菜鸟，包裹信息查询菜鸟接口';
          this.$message.success(tip);
          this.addLog(tip);
        })
        .catch(() => {
          // 用户取消，不做处理
        });
    },
    // 解析包裹信息：停用菜鸟走 mock，否则查菜鸟大包接口
    async resolvePackageInfo(barcode) {
      if (this.disableCainiao) {
        const packageInfo = mockPackageByBarcode(barcode);
        this.addLog(
          `已Mock包裹信息，大包号：${packageInfo.packageNo}，大小：${packageInfo.packageSize}`
        );
        return packageInfo;
      }
      try {
        const res = await HttpUtilCainiao.post(
          '/PreSupervision/getBigPackageToMCS?key=31140fca3b37427491bd3106f765eed2',
          { bigPackageCode: barcode }
        );
        const codeOk =
          res && (Number(res.code) === 200 || res.success === true);
        const data = res && res.data;
        const hasPackage =
          data && (data.bigPackageCode || data.smallPackageQuantity != null);
        if (!codeOk || !hasPackage) {
          const errMsg = (res && res.message) || '查询菜鸟大包信息失败';
          this.addLog(
            `菜鸟大包查询失败，条码：${barcode}，原因：${errMsg}`,
            'alarm'
          );
          return null;
        }
        const packageInfo = mapCainiaoToPackage(data, barcode);
        this.addLog(
          `菜鸟大包查询成功，大包号：${packageInfo.packageNo}，小包数：${
            packageInfo.expectedQty || '--'
          }，大小：${packageInfo.packageSize}`
        );
        return packageInfo;
      } catch (error) {
        console.error('菜鸟大包查询异常:', error);
        this.addLog(
          `菜鸟大包查询异常，条码：${barcode}，原因：${
            error.message || '网络错误'
          }`,
          'alarm'
        );
        return null;
      }
    },
    toggleButtonState(button) {
      if (button === 'start') {
        this.$confirm('确定要全线启动吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            ipcRenderer.send('writeValuesToPLC', 'W_DBW2', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW2', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线启动成功');
            this.addLog('全线启动成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'stop') {
        this.$confirm('确定要全线停止吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            ipcRenderer.send('writeValuesToPLC', 'W_DBW4', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW4', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线停止成功');
            this.addLog('全线停止成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'reset') {
        this.$confirm('确定要全线暂停吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            this.buttonStates[button] = !this.buttonStates[button];
            ipcRenderer.send('writeSingleValueToPLC', 'W_DBW4', 1);
            setTimeout(() => {
              ipcRenderer.send('writeSingleValueToPLC', 'W_DBW4', 0);
            }, 2000);
            this.$message.success('全线暂停成功');
            this.addLog('全线暂停成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'fault_reset') {
        this.$confirm('确定要故障复位吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            ipcRenderer.send('writeValuesToPLC', 'W_DBW6', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW6', 0);
            }, 2000);
            this.$message.success('故障复位成功');
            this.addLog('故障复位成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'clear') {
        this.$confirm('确定要全线清空吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 所有分拣口发送PLC清空信号：先2秒true（禁止进货），再2秒false（允许进货），最后取消写入
            this.clearAllSortPortsForLineClear();
            // 处理锁定的分拣口：解锁后端
            this.queues.forEach((queue, index) => {
              if (queue.isLock === '1') {
                this.addLog(
                  `全线清空：分拣口${index}已锁定，执行解锁`,
                  'running'
                );
                // 解锁：直接传值更新后端，成功后同步前端缓存
                this.syncAgvStatusToBackend(queue.id, '', '');
              }
            });
            // 把所有的队列、初始状态都清空（复制新数组触发监听器）
            this.queues.forEach((queue) => {
              queue.trayInfo = [];
            });
            // 全线清空后检查并更新DBW100
            this.checkAndWriteDBW100();
            this.nowScanTrayInfo = {};
            this.lastLargeAllocPortNo = 0; // 大包循环下发游标重置，下次从分拣口1开始
            this.runningLogs = []; // 修改为空数组
            this.alarmLogs = []; // 修改为空数组
            this.nowTrays = [];
            this.$message.success('全线清空成功');
            this.addLog('全线清空成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    initializeMarkers() {
      this.$nextTick(() => {
        this.updateMarkerPositions();
        window.addEventListener('resize', this.updateMarkerPositions);
      });
    },
    updateMarkerPositions() {
      const images = document.querySelectorAll('.floor-image');
      images.forEach((image) => {
        const imageWrapper = image.parentElement;
        if (!imageWrapper) return;

        const markers = imageWrapper.querySelectorAll(
          '.marker, .marker-with-panel, .marker-with-button, .marker-with-flow, .queue-marker, .motor-marker, .preheating-room-marker, .analysis-status-marker'
        );
        const carts = imageWrapper.querySelectorAll('.cart-container');
        const wrapperRect = imageWrapper.getBoundingClientRect();

        // 计算图片的实际显示区域
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const scaleX = displayedWidth / image.naturalWidth;
        const scaleY = displayedHeight / image.naturalHeight;

        // 计算图片在容器中的偏移量
        const imageOffsetX = (wrapperRect.width - displayedWidth) / 2;
        const imageOffsetY = (wrapperRect.height - displayedHeight) / 2;

        markers.forEach((marker) => {
          const x = parseFloat(marker.dataset.x);
          const y = parseFloat(marker.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            marker.style.left = `${imageOffsetX + x * scaleX}px`;
            marker.style.top = `${imageOffsetY + y * scaleY}px`;
          }
        });

        // 更新小车位置和大小
        carts.forEach((cart) => {
          const x = parseFloat(cart.dataset.x);
          const y = parseFloat(cart.dataset.y);
          const width = parseFloat(cart.dataset.width);
          if (!isNaN(x) && !isNaN(y)) {
            cart.style.left = `${imageOffsetX + x * scaleX}px`;
            cart.style.top = `${imageOffsetY + y * scaleY}px`;
            if (!isNaN(width)) {
              cart.style.width = `${width * scaleX}px`;
            }
          }
        });
      });
    },
    showTrays(index) {
      if (index < 0 || index >= this.queues.length) {
        this.nowTrays = [];
        return;
      }

      this.selectedQueueIndex = index;
      const selectedQueue = this.queues[index];

      if (!selectedQueue) {
        this.nowTrays = [];
        return;
      }

      try {
        // 确保 trayInfo 是数组
        const trayInfo = Array.isArray(selectedQueue.trayInfo)
          ? selectedQueue.trayInfo
          : [];

        this.nowTrays = trayInfo
          .map((tray) => {
            const packageNo = tray.packageNo || tray.trayCode || '';
            return {
              id: packageNo,
              name: packageNo ? `大包 ${packageNo}` : '未知大包',
              time: tray.trayTime || '',
              channel: tray.channel || '',
              packingWeight: tray.packingWeight || '',
              expectedQty: tray.expectedQty || '',
              allocatedPortNo: tray.allocatedPortNo || '',
              destinationCode: tray.destinationCode || ''
            };
          })
          .filter((tray) => tray.id);
      } catch (error) {
        console.error('处理托盘信息时出错:', error);
        this.nowTrays = [];
      }
    },
    handleDragStart(event, tray, queueIndex) {
      if (!tray || queueIndex === undefined) return;

      this.isDragging = true;
      this.draggedTray = tray;
      this.dragSourceQueue = queueIndex;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tray.id);

      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      event.target.classList.remove('dragging');
    },
    async handleDrop(targetQueueIndex) {
      if (
        !this.draggedTray ||
        this.dragSourceQueue === null ||
        targetQueueIndex === null
      )
        return;
      if (this.dragSourceQueue === targetQueueIndex) return;

      const sourceQueue = this.queues[this.dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      if (!sourceQueue || !targetQueue) {
        this.$message.error('队列不存在，无法移动托盘');
        return;
      }

      sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo)
        ? sourceQueue.trayInfo
        : [];
      targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo)
        ? targetQueue.trayInfo
        : [];

      try {
        // 确认移动操作
        await this.$confirm(
          `确认将托盘 ${this.draggedTray.id} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}？`,
          '移动托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        if (!this.draggedTray.id) {
          throw new Error('托盘信息无效');
        }

        const trayIndex = sourceQueue.trayInfo.findIndex(
          (t) => (t.packageNo || t.trayCode) === this.draggedTray.id
        );
        if (trayIndex === -1) {
          throw new Error('找不到要移动的托盘');
        }

        const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);
        targetQueue.trayInfo.push(movedTray);

        // 更新队列数据
        this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo);
        this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo);

        const currentQueueIndex = this.selectedQueueIndex;
        if (
          currentQueueIndex === targetQueueIndex ||
          currentQueueIndex === this.dragSourceQueue
        ) {
          this.$nextTick(() => {
            this.showTrays(currentQueueIndex);
          });
        }

        // 添加托盘移动日志
        this.addLog(
          `托盘 ${movedTray.packageNo || movedTray.trayCode} 从 ${
            sourceQueue.queueName
          } 移动到 ${targetQueue.queueName}`
        );

        this.$message({
          type: 'success',
          message: `大包 ${
            movedTray.packageNo || movedTray.trayCode
          } 已成功移动到 ${targetQueue.queueName}`,
          duration: 2000
        });
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        console.error('移动托盘时出错:', error);
        this.$message.error(error.message || '移动托盘失败，请重试');
        this.addLog(`移动大包失败：${error.message || '请重试'}`);
      } finally {
        this.draggedTray = null;
        this.dragSourceQueue = null;
        this.isDragging = false;
      }
    },
    // 添加更新队列托盘的方法
    updateQueueTrays(queueId, trayInfo) {
      // 查找对应ID的队列
      const queueIndex = this.queues.findIndex((queue) => queue.id === queueId);
      if (queueIndex !== -1) {
        // 直接更新前端队列数据
        this.queues[queueIndex].trayInfo = trayInfo;
        // 添加日志
        this.addLog(`队列 ${this.queues[queueIndex].queueName} 数据已更新`);
      } else {
        this.$message.error('找不到队列ID: ' + queueId);
      }
    },
    async deleteTray(tray, index) {
      if (!this.selectedQueue) return;

      try {
        // 确认是否删除
        await this.$confirm(
          '确认要删除该托盘吗？删除后请注意是否需要同步修改PLC队列数据！',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 从队列中移除托盘，直接使用传递的index
        if (index >= 0 && index < this.selectedQueue.trayInfo.length) {
          this.selectedQueue.trayInfo.splice(index, 1);

          // 更新队列数据
          this.updateQueueTrays(
            this.selectedQueue.id,
            this.selectedQueue.trayInfo
          );

          // 刷新显示
          this.showTrays(this.selectedQueueIndex);

          // 添加删除托盘日志
          this.addLog(
            `托盘 ${tray.id} 已从 ${this.selectedQueue.queueName} 删除`
          );

          this.$message.success('托盘删除成功');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除托盘失败，请重试');
        }
      }
    },
    // 上移托盘
    async moveTrayUp(index) {
      if (!this.selectedQueue || index <= 0) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const prevTray = trayInfo[index - 1];

        // 确认上移操作
        await this.$confirm(
          `确认将大包 ${currentTray.id} 上移一位（与 ${prevTray.id} 交换位置）？`,
          '上移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = prevTray;
        trayInfo[index - 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `大包 ${currentTray.id} 在 ${this.selectedQueue.queueName} 中上移`
        );

        this.$message.success('托盘上移成功');
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘上移失败，请重试');
      }
    },
    // 下移托盘
    async moveTrayDown(index) {
      if (!this.selectedQueue || index >= this.nowTrays.length - 1) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const nextTray = trayInfo[index + 1];

        // 确认下移操作
        await this.$confirm(
          `确认将大包 ${currentTray.id} 下移一位（与 ${nextTray.id} 交换位置）？`,
          '下移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = nextTray;
        trayInfo[index + 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `大包 ${currentTray.id} 在 ${this.selectedQueue.queueName} 中下移`
        );

        this.$message.success('托盘下移成功');
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘下移失败，请重试');
      }
    },
    // 获取队列标记的CSS类
    getQueueMarkerClass(queueId) {
      const queue = this.queues.find((q) => q.id === queueId);
      return {
        'queue-marker--locked': queue?.isLock === '1',
        'queue-marker--failed': queue?.trayStatus === '3'
      };
    },
    // 点击队列标识
    handleQueueMarkerClick(queueId) {
      // 展开队列面板
      this.isQueueExpanded = true;

      // 找到队列在数组中的索引
      const queueIndex = this.queues.findIndex((q) => q.id === queueId);
      if (queueIndex !== -1) {
        // 选中并显示对应队列
        this.selectedQueueIndex = queueIndex;
        this.showTrays(queueIndex);
      }
    },
    // 点击锁图标解锁队列
    handleUnlockQueue(queueId) {
      const queue = this.queues.find((q) => q.id === queueId);
      if (!queue) return;
      this.$confirm(`确定要解锁队列「${queue.queueName}」吗？`, '解锁确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 解锁并清空队列状态
          this.syncAgvStatusToBackend(queueId, '', '0');
          this.addLog(`队列「${queue.queueName}」已解锁`, 'running');
          this.$message.success(`队列「${queue.queueName}」已解锁`);
        })
        .catch(() => {});
    },
    // 添加新的日志方法
    addLog(message, type = 'running') {
      const now = new Date();
      const log = {
        id: this.logId++,
        type,
        message,
        timestamp: now.getTime(),
        timeStr: now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        unread: type === 'alarm'
      };

      // 只要是日志就往运行日志中添加
      this.runningLogs.unshift(log);
      // 保持日志数量在合理范围内
      if (this.runningLogs.length > 100) {
        this.runningLogs.pop();
      }

      if (type === 'alarm') {
        this.alarmLogs.unshift(log);
        if (this.alarmLogs.length > 100) {
          this.alarmLogs.pop();
        }
      }
      // 同时写入本地文件
      const logTypeText = type === 'running' ? '运行日志' : '报警日志';
      const logMessage = `[${logTypeText}] ${message}`;
      ipcRenderer.send('writeLogToLocal', logMessage);
    },
    toggleBitValue(obj, bit) {
      obj[bit] = obj[bit] === '1' ? '0' : '1';
    },
    convertToWord(value) {
      if (value < 0) {
        return (value & 0xffff) >>> 0; // 负数转换为无符号的16位整数
      } else {
        return value; // 非负数保持不变
      }
    },
    // 更新数据库队列信息（仅同步trayInfo，AGV状态字段由syncAgvStatusToBackend单独控制）
    // 更新数据库队列信息
    updateQueueInfo(id) {
      const param = {
        id: id,
        trayInfo: JSON.stringify(this.queues[id - 1].trayInfo)
      };
      HttpUtil.post('/queue_info/update', param).catch((err) => {
        this.$message.error(err);
      });
    },
    // 同步AGV状态字段到后端，后端更新成功后再同步前端缓存
    // 与updateQueueInfo分离，避免Vue watcher将前端缓存的旧状态覆盖后端AGV回调写入的新状态
    // 未传入的字段（null/undefined）不会更新，避免覆盖后端已有值
    syncAgvStatusToBackend(queueId, trayStatus, isLock) {
      const param = { id: queueId };
      if (trayStatus != null) param.trayStatus = trayStatus;
      if (isLock != null) param.isLock = isLock;
      HttpUtil.post('/queue_info/update', param)
        .then(() => {
          // 后端更新成功后同步前端缓存（只更新传入的字段）
          const queue = this.queues[queueId - 1];
          if (trayStatus != null) queue.trayStatus = trayStatus;
          if (isLock != null) queue.isLock = isLock;
          // AGV状态变化后检查并更新DBW100
          this.checkAndWriteDBW100();
        })
        .catch((err) => {
          console.error('同步AGV状态到后端失败:', err);
        });
    },
    // 从数据库加载队列信息
    loadQueueInfoFromDatabase() {
      HttpUtil.post('/queue_info/queryQueueList', {})
        .then((res) => {
          if (res.data && res.data.length > 0) {
            // 遍历数据库返回的队列信息
            res.data.forEach((queueData) => {
              const queueId = queueData.id;
              const queueIndex = queueId - 1; // 数组索引从0开始，队列ID从1开始

              // 确保队列索引有效
              if (queueIndex >= 0 && queueIndex < this.queues.length) {
                try {
                  // 解析托盘信息JSON字符串
                  const trayInfo = queueData.trayInfo
                    ? JSON.parse(queueData.trayInfo)
                    : [];
                  // 赋值给对应的队列
                  this.queues[queueIndex].trayInfo = Array.isArray(trayInfo)
                    ? trayInfo
                    : [];
                  // 加载AGV状态字段
                  if (queueIndex >= 1) {
                    this.queues[queueIndex].trayStatus =
                      queueData.trayStatus || '';
                    this.queues[queueIndex].isLock = queueData.isLock || '';
                  }
                  this.addLog(
                    `已加载队列${queueData.queueName || queueId}的托盘信息，共${
                      this.queues[queueIndex].trayInfo.length
                    }个托盘`
                  );
                } catch (error) {
                  console.error(`解析队列${queueId}的托盘信息失败:`, error);
                  this.queues[queueIndex].trayInfo = [];
                  this.addLog(`队列${queueId}托盘信息解析失败，已重置为空`);
                }
              }
            });
            this.addLog('队列信息加载完成');
          } else {
            this.addLog('数据库中暂无队列信息');
          }
        })
        .catch((err) => {
          console.error('加载队列信息失败:', err);
          this.$message.error('加载队列信息失败: ' + err);
          this.addLog('队列信息加载失败');
        })
        .finally(() => {
          this._queueInitDone = true;
          // 队列数据加载完成后检查并更新DBW100
          this.checkAndWriteDBW100();
        });
    },
    // 切换到报警日志时清除未读状态
    switchToAlarmLog() {
      this.activeLogType = 'alarm';
      // 清除所有报警日志的未读状态
      this.alarmLogs.forEach((log) => {
        log.unread = false;
      });
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMarkerPositions);
    // 取消队列监听器
    if (this._queueWatchers && this._queueWatchers.length > 0) {
      this._queueWatchers.forEach((unwatch) => {
        if (typeof unwatch === 'function') {
          unwatch();
        }
      });
      this._queueWatchers = [];
    }
    // 清除 MCS/AGV 轮询定时器
    this.stopMcsPolling();
    // 停止数字孪生 MQTT 推送
    this.stopTwinMqttPublish();
    // 断开六面扫Socket连接
    this.disconnectSixScan();
  }
};
</script>
<style lang="less" scoped>
.smart-workshop {
  --mp-surface: #ffffff;
  --mp-surface-muted: #eef2f8;
  --mp-border: #d4deef;
  --mp-border-light: #dce4f2;
  --mp-text: #262626;
  --mp-text-secondary: #8c8c8c;
  --mp-text-muted: #606266;
  --mp-accent: #4385ff;
  --mp-accent-hover: #3e7bfa;
  --mp-accent-deep: #2f54eb;
  --mp-accent-bg: rgba(67, 133, 255, 0.08);
  --mp-accent-bg-hover: rgba(67, 133, 255, 0.14);
  --mp-accent-border: rgba(67, 133, 255, 0.25);
  --mp-module-border: rgba(67, 133, 255, 0.42);
  --mp-module-header-start: #4572ef;
  --mp-module-header-mid: #5594ff;
  --mp-module-header-end: #5ad4f6;
  --mp-module-header-font-size: 17px;
  --mp-module-header-padding: 9px 13px;
  --mp-module-header-height: 38px;
  --mp-shadow: 0 2px 8px rgba(47, 84, 235, 0.08);
  --mp-shadow-lg: 0 4px 14px rgba(47, 84, 235, 0.1);
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  user-select: none;
  color: var(--mp-text);
  .header {
    position: relative;
    width: 100%;
    height: 80px;
    overflow: hidden;
    flex-shrink: 0;
    .header-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-content {
      position: relative;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      z-index: 1;
      .title {
        font-size: 32px;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
      }

      .current-time {
        font-size: 24px;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
    }
  }
  .content-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    .side-info-panel {
      width: 420px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 5px;
      box-sizing: border-box;
      flex-shrink: 0;
      overflow: hidden;
      .plc-info-section,
      .operation-panel {
        background: var(--mp-surface);
        padding: 0;
        border-radius: 12px;
        box-shadow: var(--mp-shadow);
        border: 1px solid var(--mp-module-border);
        color: var(--mp-text);
        box-sizing: border-box;
        overflow: hidden;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--mp-module-header-font-size);
          color: #fff;
          font-weight: 700;
          margin: 0;
          padding: var(--mp-module-header-padding);
          border-bottom: none;
          background: linear-gradient(
            135deg,
            var(--mp-module-header-start) 0%,
            var(--mp-module-header-mid) 55%,
            var(--mp-module-header-end) 100%
          );
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
          letter-spacing: 0.5px;
          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .el-button {
            background: rgba(255, 255, 255, 0.16);
            border: 1px solid rgba(255, 255, 255, 0.45);
            color: #fff;
            font-size: 12px;
          }
          .el-button:hover {
            background: rgba(255, 255, 255, 0.28);
            border-color: rgba(255, 255, 255, 0.65);
            color: #fff;
          }
        }
        .scrollable-content {
          overflow-y: auto;
          padding: 10px 12px;
          box-sizing: border-box;
        }
      }
      .plc-info-section {
        .scrollable-content {
          .status-overview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            .data-card {
              box-sizing: border-box;
              height: 65px;
              width: 185px;
            }

            .data-card-border {
              width: 100%;
              height: 100%;
              border-radius: 12px;
              background: var(--mp-surface-muted);
              border: 1px solid var(--mp-border);
              box-shadow: none;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 0 12px;
              box-sizing: border-box;
            }

            .data-card-border-borderTop {
              font-weight: 400;
              letter-spacing: 0;
              color: var(--mp-text-secondary);
              text-align: left;
              font-size: 12px;
              line-height: 16px;
              margin-bottom: 4px;
            }
            .granient-text {
              background-image: linear-gradient(
                to right,
                rgba(72, 146, 254, 1),
                rgba(71, 207, 245, 1)
              );
              background-clip: text;
              -webkit-background-clip: text;
              color: transparent;
            }

            .data-card-border-borderDown {
              font-weight: 700;
              letter-spacing: 0;
              color: var(--mp-text);
              text-align: left;
              font-size: 15px;
              line-height: 20px;
              /* 添加省略号效果 */
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
          }
        }
      }
      .log-section {
        background: var(--mp-surface);
        padding: 0;
        border-radius: 12px;
        box-shadow: var(--mp-shadow);
        border: 1px solid var(--mp-module-border);
        height: 257px;
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--mp-module-header-padding);
          color: #fff;
          font-size: var(--mp-module-header-font-size);
          font-weight: 700;
          border-bottom: none;
          background: linear-gradient(
            135deg,
            var(--mp-module-header-start) 0%,
            var(--mp-module-header-mid) 55%,
            var(--mp-module-header-end) 100%
          );
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
          letter-spacing: 0.5px;
          .log-tabs {
            display: flex;
            gap: 4px;
            background: rgba(0, 0, 0, 0.08);
            padding: 3px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          .log-tab {
            position: relative;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.82);
            cursor: pointer;
            padding: 3px 11px;
            border-radius: 4px;
            transition: all 0.3s ease;
            .alarm-badge {
              position: absolute;
              top: -8px;
              right: -8px;
              background: #f56c6c;
              color: #fff;
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 10px;
              min-width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          .log-tab.active {
            color: var(--mp-accent-deep);
            background: #fff;
            font-weight: 600;
          }
          .log-tab:hover:not(.active) {
            color: #fff;
            background: rgba(255, 255, 255, 0.16);
          }
        }
        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 6px 8px;
          box-sizing: border-box;
          .log-list {
            padding: 0;
            width: 100%;
            box-sizing: border-box;
            .log-item {
              background: var(--mp-surface-muted);
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 8px;
              cursor: pointer;
              width: 100%;
              box-sizing: border-box;
              border: 1px solid var(--mp-border);
              .log-time {
                font-size: 12px;
                color: var(--mp-text-secondary);
                margin-bottom: 6px;
              }
              .log-item-content {
                color: var(--mp-text);
                font-size: 13px;
                line-height: 1.6;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: normal;
                hyphens: auto;
                display: block;
                width: 100%;
                padding-right: 10px;
              }
            }
            .log-item:hover {
              background: #eef2f8;
              border-color: var(--mp-accent-border);
            }

            .log-item.alarm {
              background: rgba(245, 108, 108, 0.06);
            }

            .log-item.alarm.unread {
              background: rgba(245, 108, 108, 0.1);
              border-left: 2px solid #f56c6c;
            }
            /* 添加空状态样式 */
            .empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px 0;
              color: var(--mp-text-secondary);
              i {
                font-size: 48px;
                margin-bottom: 16px;
                color: #c0c4cc;
              }
              p {
                font-size: 14px;
                margin: 0 0 16px 0;
              }
              .el-button {
                color: #4385ff;
                font-size: 14px;
                i {
                  font-size: 14px;
                  margin-right: 4px;
                  color: inherit;
                }
              }
              .el-button:hover {
                color: #3e7bfa;
              }
            }
          }
        }
        .scrollable-content::-webkit-scrollbar {
          width: 4px;
        }

        .scrollable-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: rgba(67, 133, 255, 0.12);
          border-radius: 2px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: rgba(67, 133, 255, 0.25);
        }
      }
      .operation-panel {
        .operation-buttons {
          display: flex;
          justify-content: flex-start;
          gap: 8px;
          margin-top: 0;
          padding: 10px 12px;
          box-sizing: border-box;
          button {
            width: 70px;
            height: 70px;
            font-size: 0.8em;
            color: #fff;
            background: linear-gradient(135deg, #4385ff, #2f54eb);
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(67, 133, 255, 0.25);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 8px;
            gap: 5px;
            i {
              font-size: 1.8em;
            }
            span {
              font-size: 12px;
              margin-top: 4px;
            }
          }
          button:hover {
            background: linear-gradient(135deg, #5a9bff, #4385ff);
            box-shadow: 0 6px 16px rgba(67, 133, 255, 0.35);
          }
          button.pressed {
            transform: scale(0.98);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
          }
          button.btn-start.pressed {
            background: linear-gradient(135deg, #52c41a, #237804);
          }
          button.btn-start.pressed:hover {
            background: linear-gradient(135deg, #73d13d, #389e0d);
          }
          button.btn-stop.pressed {
            background: linear-gradient(135deg, #ff4d4f, #a8071a);
          }
          button.btn-stop.pressed:hover {
            background: linear-gradient(135deg, #ff7875, #cf1322);
          }
          button.btn-reset.pressed {
            background: linear-gradient(135deg, #faad14, #d48806);
          }
          button.btn-reset.pressed:hover {
            background: linear-gradient(135deg, #ffc53d, #fa8c16);
          }
          button.btn-disable-cainiao.pressed {
            background: linear-gradient(135deg, #8c8c8c, #595959);
          }
          button.btn-disable-cainiao.pressed:hover {
            background: linear-gradient(135deg, #a6a6a6, #737373);
          }
        }
      }
    }
    .main-content {
      flex: 1;
      display: flex;
      padding: 5px 5px 5px 0px;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      .floor-container {
        display: flex;
        gap: 10px;
        height: 100%;
        width: 100%;
        min-height: 0;

        .floor-left {
          .floor-image-container {
            flex: 1;
            background: #ffffff;
            padding: 4px 6px 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--mp-border);
            min-height: 0;
            margin: 0;
            height: calc(100% - var(--mp-module-header-height));
            position: relative;
            box-sizing: border-box;

            .floor-map-legend {
              position: absolute;
              bottom: 10px;
              left: 10px;
              z-index: 20;
              display: flex;
              flex-direction: column;
              gap: 6px;
              padding: 8px 10px;
              background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.96) 0%,
                rgba(245, 248, 252, 0.94) 100%
              );
              border: 1px solid var(--mp-border);
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              pointer-events: none;

              .legend-item {
                display: grid;
                grid-template-columns: 18px 1fr;
                align-items: center;
                column-gap: 8px;
              }

              .legend-text {
                display: flex;
                flex-direction: column;
                gap: 1px;
                line-height: 1.2;
                min-width: 0;
              }

              .legend-name {
                font-size: 12px;
                font-weight: 600;
                color: var(--mp-text);
              }

              .legend-desc {
                font-size: 10px;
                color: var(--mp-text-muted, #6b7280);
              }

              .legend-dot {
                justify-self: center;
                display: inline-block;
                width: 10px;
                height: 10px;
                font-style: normal;

                &--photo {
                  border-radius: 50%;
                  background: rgba(128, 128, 128, 0.85);
                }

                &--motor {
                  border-radius: 1px;
                  background: rgba(128, 128, 128, 0.85);
                }
              }

              .legend-arrow {
                justify-self: center;
                position: relative;
                display: inline-block;
                width: 18px;
                height: 10px;
                font-style: normal;

                &::before {
                  content: '';
                  position: absolute;
                  left: 0;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 8px;
                  height: 6px;
                  background-color: #4385ff;
                }

                &::after {
                  content: '';
                  position: absolute;
                  left: 6px;
                  top: 50%;
                  transform: translateY(-50%) rotate(45deg);
                  width: 0;
                  height: 0;
                  border-right: 8px solid #4385ff;
                  border-bottom: 8px solid transparent;
                }
              }
            }

            .image-wrapper {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: white;
              .floor-image {
                display: block;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
              }
              /* --- 光电点位样式 --- */
              .marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: #4385ff;
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0;
                  transition: opacity 0.3s;
                  pointer-events: none; /* 添加此行 */
                }
              }
              .marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色核心 */
              }
              /* 扫描状态 (红色) */
              .marker.scanning::before {
                background: rgba(255, 0, 0, 0.8); /* 红色核心 */
              }

              /* 默认隐藏标签，hover时显示 */
              .marker:hover .marker-label {
                opacity: 1;
                box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); /* 灰色辉光 */
              }
              /* 始终显示标签的点位 */
              .marker-show-label .marker-label {
                opacity: 1;
              }
              /* 控制标签位置的样式 */
              .marker.label-top .marker-label {
                top: auto; /* 重置默认 top */
                bottom: calc(100% + 5px); /* 定位到上方 */
                left: 50%;
                transform: translateX(-50%);
              }
              .marker.label-left .marker-label {
                top: 50%; /* 垂直居中 */
                left: auto; /* 重置默认 left */
                right: calc(100% + 5px); /* 定位到左方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              .marker.label-right .marker-label {
                top: 50%; /* 垂直居中 */
                left: calc(100% + 5px); /* 定位到右方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              /* --- 光电点位样式结束 --- */

              /* --- 新增电机点位样式 --- */
              .motor-marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: rgba(0, 0, 0, 0.8);
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0; /* 默认隐藏 */
                  transition: opacity 0.3s;
                }
              }

              .motor-marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色方块 */
                /* 无 border-radius，保持方形 */
              }

              .motor-marker.running::before {
                background: #00ff3f; /* 运行状态绿色方块 */
              }

              /* 始终显示电机标签 */
              .motor-marker.marker-show-label .marker-label {
                opacity: 1;
              }
              /* 悬停显示电机标签 */
              .motor-marker:hover .marker-label {
                opacity: 1;
              }

              /* 控制电机标签位置的样式 (复制并适配) */
              .motor-marker.label-top .marker-label {
                top: auto;
                bottom: calc(100% + 5px);
                left: 50%;
                transform: translateX(-50%);
              }
              .motor-marker.label-left .marker-label {
                top: 50%;
                left: auto;
                right: calc(100% + 5px);
                transform: translateY(-50%);
              }
              .motor-marker.label-right .marker-label {
                top: 50%;
                left: calc(100% + 5px);
                transform: translateY(-50%);
              }
              /* --- 电机点位样式结束 --- */

              /* 流水线流动箭头容器定位（置于光电/电机之下，避免遮挡点位） */
              .marker-with-flow {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 1;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              /* 带数据面板的标识点样式 */
              .marker-with-panel {
                position: absolute;
                width: 16px;
                height: 16px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                .data-panel {
                  position: absolute;
                  background: linear-gradient(135deg, #0e1a27, #3c4c63);
                  border: 1px solid rgba(64, 158, 255, 0.3);
                  border-radius: 8px;
                  padding: 12px;
                  width: 170px;
                  // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  opacity: 0;
                  transition: all 0.3s ease;
                  pointer-events: none;
                  .data-panel-header {
                    font-size: 14px;
                    color: #409eff;
                    margin-bottom: 6px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(64, 158, 255, 0.2);
                  }
                  .data-panel-content {
                    font-size: 12px;
                    .status-dot {
                      display: inline-block;
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      margin-right: 4px;
                    }
                    .data-panel-row {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      color: rgba(255, 255, 255, 0.9);
                      .data-panel-label {
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                        white-space: nowrap;
                        flex-shrink: 0;
                        margin-right: 6px;
                        display: inline-flex;
                        align-items: center;
                      }
                      .barcode-value {
                        flex: 1;
                        min-width: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      }
                    }
                    /* 新增：复选框组样式 */
                    .checkbox-group {
                      display: flex;
                      justify-content: space-between; /* 或 space-between */
                      align-items: center;
                      padding-top: 5px; /* 增加一点顶部间距 */
                    }

                    .checkbox-group .el-checkbox {
                      margin-right: 10px; /* 增加复选框之间的间距 */
                    }

                    /* 调整复选框标签颜色 */
                    .checkbox-group :deep(.el-checkbox__label) {
                      color: rgba(255, 255, 255, 0.8); /* 调整标签颜色 */
                      font-size: 12px; /* 调整标签字体大小 */
                    }

                    /* 执行控制区域的特殊样式 */
                    .exec-controls {
                      display: flex;
                      align-items: center;
                      gap: 3px;
                    }

                    /* 调整选中状态下的颜色 */
                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked + .el-checkbox__label
                      ) {
                      color: #0ac5a8; /* 选中时标签颜色 */
                    }

                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked .el-checkbox__inner
                      ) {
                      background-color: #0ac5a8; /* 选中时背景色 */
                      border-color: #0ac5a8; /* 选中时边框色 */
                    }

                    /* 扫码分组网格布局 */
                    .scan-groups-grid {
                      display: flex;
                      flex-direction: column;
                      gap: 12px;
                    }

                    .scan-group-row {
                      display: grid;
                      grid-template-columns: repeat(4, 1fr);
                      gap: 8px;
                    }

                    .scan-group {
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      min-height: 50px;
                      background: rgba(64, 158, 255, 0.08);
                      border: 1px solid rgba(64, 158, 255, 0.2);
                      border-left: 3px solid #409eff;
                      border-radius: 6px;
                      padding: 3px 10px;
                    }

                    .scan-group.with-watermark {
                      position: relative;
                      overflow: hidden;
                    }

                    .belt-ids-card {
                      background: rgba(10, 197, 168, 0.1);
                      border-color: rgba(10, 197, 168, 0.25);
                      border-left-color: #0ac5a8;

                      .group-watermark {
                        color: rgba(10, 197, 168, 0.55);
                      }
                    }

                    .sort-port-card {
                      background: rgba(120, 150, 200, 0.1);
                      border-color: rgba(120, 150, 200, 0.25);
                      border-left-color: #7896c8;

                      .group-watermark {
                        color: rgba(170, 195, 235, 0.65);
                        text-shadow: 0 0 5px rgba(0, 0, 0, 0.55);
                      }

                      .port-send-btn {
                        background: rgba(120, 150, 200, 0.1);
                        border-color: rgba(120, 150, 200, 0.3);
                        color: #8aa8d0;

                        &:hover {
                          background: rgba(120, 150, 200, 0.2);
                          border-color: rgba(120, 150, 200, 0.5);
                          color: #a8c0e0;
                        }
                      }
                    }

                    .group-watermark {
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      transform: translate(-50%, -50%);
                      font-size: 24px;
                      font-weight: 900;
                      color: rgba(100, 185, 255, 0.65);
                      text-shadow: 0 0 5px rgba(0, 0, 0, 0.55);
                      pointer-events: none;
                      user-select: none;
                      z-index: 0;
                      letter-spacing: -1px;
                    }

                    .group-items {
                      display: flex;
                      flex-direction: column;
                      gap: 3px;
                      position: relative;
                      z-index: 1;
                    }

                    .scan-item {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      padding: 1px 0;
                    }

                    .scan-label {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.75);
                    }

                    .scan-value {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.95);
                      font-weight: 500;
                      text-align: right;
                      flex: 1;
                      word-break: break-all;
                    }

                    .panel-divider {
                      height: 1px;
                      background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(64, 158, 255, 0.4) 20%,
                        rgba(64, 158, 255, 0.4) 80%,
                        transparent 100%
                      );
                      margin: 0;
                    }

                    .port-send-btn {
                      background: rgba(64, 158, 255, 0.15);
                      border: 1px solid rgba(64, 158, 255, 0.4);
                      color: rgba(64, 158, 255, 0.9);
                      border-radius: 3px;
                      padding: 2px 6px;
                      font-size: 14px;
                      cursor: pointer;
                      transition: all 0.2s;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      line-height: 1;
                    }

                    .port-send-btn:hover {
                      background: rgba(64, 158, 255, 0.3);
                      border-color: rgba(64, 158, 255, 0.6);
                      color: #409eff;
                    }
                  }
                }

                /* 管理员密码对话框样式 */
                .admin-password-content {
                  padding: 20px 0;
                }

                .admin-password-content .el-form-item {
                  margin-bottom: 20px;
                }

                .admin-password-content .el-input {
                  width: 100%;
                }

                .dialog-footer {
                  text-align: right;
                  padding-top: 20px;
                }
                /* 面板位置样式 */
                .data-panel.position-right {
                  left: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-left {
                  right: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-top {
                  bottom: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                .data-panel.position-bottom {
                  top: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                /* 始终显示的面板 */
                .data-panel.always-show {
                  opacity: 1;
                  pointer-events: auto; /* 重新启用指针事件 */
                }
                /* 竖向布局样式 */
                .data-panel.vertical-layout {
                  width: 110px;
                  padding: 8px;
                  .data-panel-row {
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  .data-panel-label {
                    margin-bottom: 2px;
                  }
                }
              }
              /* 悬停时显示面板 */
              .marker-with-panel:hover .data-panel:not(.always-show) {
                opacity: 1;
              }

              /* 带按钮的标识点样式 */
              .marker-with-button {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 5;
                cursor: pointer;
              }
              .marker-with-button .warehouse-btn {
                background: linear-gradient(135deg, #0e1a27, #3c4c63);
                color: white;
                font-weight: bold;
                border: none;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                border-radius: 4px;
                padding: 10px 15px;
                transition: all 0.3s ease;
              }
              .marker-with-button .warehouse-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
              }

              /* 预热房选择样式 */
              .preheating-room-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 10;
                background: linear-gradient(135deg, #005aff 0%, #000000 100%);
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                width: 80px;
                .preheating-room-content {
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                  .preheating-room-header {
                    width: 100%;
                    text-align: center;
                    padding: 4px 0;
                    font-size: 11px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0.2);
                    font-weight: bold;
                  }
                  .preheating-room-body {
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                  }
                }
              }
              .preheating-room-marker :deep(.el-select) {
                width: 100%;
              }
              .preheating-room-marker :deep(.el-input__inner) {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.2);
                color: #fff;
                height: 24px;
                line-height: 24px;
                font-size: 11px;
                border-radius: 3px;
                padding: 0 8px;
              }

              /* 解析状态标签样式 */
              .analysis-status-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 15;
              }

              /* 自定义状态标签样式，让绿色更突出 */
              .analysis-status-marker :deep(.el-tag) {
                background-color: #00cc44;
                border: 1px solid #00aa33;
                color: #ffffff;
              }
            }
          }
        }
        .floor-left {
          flex: 1;
          background: var(--mp-surface);
          padding: 0;
          border-radius: 12px;
          box-shadow: var(--mp-shadow);
          border: 1px solid var(--mp-module-border);
          color: var(--mp-text);
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
          .floor-title {
            font-size: var(--mp-module-header-font-size);
            color: #fff;
            font-weight: 700;
            padding: var(--mp-module-header-padding);
            flex-shrink: 0;
            border-bottom: none;
            background: linear-gradient(
              135deg,
              var(--mp-module-header-start) 0%,
              var(--mp-module-header-mid) 55%,
              var(--mp-module-header-end) 100%
            );
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            letter-spacing: 0.5px;
            i {
              margin-right: 6px;
            }
          }
          .floor-image-container {
            .image-wrapper {
              .queue-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 10;
                background: rgba(10, 30, 50, 0.85);
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid rgba(64, 158, 255, 0.5);
                transition: all 0.3s ease;
                min-width: 40px;
                text-align: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                color: #ffffff;
                .queue-marker-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  color: #fff;
                  font-size: 12px;
                  .queue-marker-name {
                    color: #fff;
                  }

                  .queue-marker-count {
                    display: inline-flex;
                    align-items: baseline;
                    font-size: 14px;
                    font-weight: bold;
                    color: #409eff;

                    .queue-marker-count__plc {
                      color: #e6a23c;
                    }
                  }
                }
              }
              .queue-marker:hover {
                background: rgba(24, 61, 97, 0.9);
                border-color: rgba(64, 158, 255, 0.6);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
              }

              /* 特殊队列标记样式 - 上货1、上货2、缓存区1、缓存区2 */
              .special-queue {
                background: rgba(0, 123, 191, 0.9) !important;
                border: 1px solid rgba(0, 123, 191, 0.7) !important;
              }

              .special-queue .queue-marker-count {
                color: #ffffff !important;
              }

              .special-queue .queue-marker-name {
                color: #ffffff !important;
              }

              .queue-marker--locked {
                border-color: rgba(245, 108, 108, 0.7) !important;
                background: rgba(60, 20, 20, 0.85) !important;
              }

              .queue-marker-lock-overlay {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 16px;
                height: 16px;
                background: #f56c6c;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #fff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                cursor: pointer;
                z-index: 10;
              }

              .queue-marker-lock-overlay:hover {
                background: #e6413e;
                transform: scale(1.2);
              }

              // AGV调用失败样式
              .queue-marker--failed {
                border-color: rgba(230, 162, 60, 0.7) !important;
                background: rgba(60, 40, 10, 0.85) !important;
              }

              .queue-marker-fail-overlay {
                position: absolute;
                top: -6px;
                left: -6px;
                width: 16px;
                height: 16px;
                background: #e6a23c;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #fff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                z-index: 10;
              }

              .special-queue:hover {
                background: rgba(0, 123, 191, 0.95) !important;
                border-color: rgba(40, 167, 235, 0.8) !important;
              }

              /* 添加小车样式 */
              .cart-container {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 3;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              }

              .cart-image {
                width: 100%;
                height: auto;
                object-fit: contain;
              }
            }
          }
        }
      }
    }
  }
  .side-info-panel-queue {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    transition: all 0.3s ease;
    pointer-events: auto;
    /* 基础样式 */
    .queue-section {
      background: rgba(30, 42, 56);
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      color: #f5f5f5;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.1);
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: color 0.3s ease;
        font-size: 20px;
        color: #7eb8ff;
        font-weight: 900;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      .expandable-content-queue {
        flex: 1;
        min-height: 0;
        display: flex;
        overflow: hidden;
        height: calc(100% - 50px);
        .queue-container {
          flex: 1;
          display: flex;
          background: rgba(30, 42, 56, 0.9);
          border-radius: 12px;
          padding: 15px;
          gap: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
          .queue-container-left {
            width: 280px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding-right: 15px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            height: 100%;
            min-height: 0;
            /* 队列项样式 */
            .queue {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: nowrap;
              background: rgba(48, 65, 85, 0.9);
              border-radius: 8px;
              padding: 12px 15px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              border: 1px solid rgba(255, 255, 255, 0.15);

              .queue-name {
                flex-shrink: 0;
              }

              .tray-count {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 10px;
                min-width: 24px;
                text-align: center;
                flex-shrink: 0;
              }

              .el-tag {
                flex-shrink: 1;
                min-width: 0;
                max-width: 130px;
                overflow: hidden;
                .el-tag__content {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }
            }

            .queue:hover {
              background: rgba(48, 65, 85, 1);
              border-color: rgba(64, 158, 255, 0.45);
              transform: translateX(2px);
            }

            .queue.active {
              background: rgba(64, 158, 255, 0.14);
              border-color: rgba(64, 158, 255, 0.45);
            }
          }
          /* 滚动条样式 */
          .queue-container-left::-webkit-scrollbar,
          .tray-list::-webkit-scrollbar {
            width: 4px;
          }

          .queue-container-left::-webkit-scrollbar-track,
          .tray-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
          }

          .queue-container-left::-webkit-scrollbar-thumb,
          .tray-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }

          .queue-container-left::-webkit-scrollbar-thumb:hover,
          .tray-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          .queue-container-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 0 15px;
            height: 100%;
            min-height: 0;
            .selected-queue-header {
              flex-shrink: 0;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              h3 {
                margin: 0;
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
              }
              .queue-header-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                .el-button {
                  background: rgba(64, 158, 255, 0.18);
                  border: 1px solid rgba(64, 158, 255, 0.3);
                  color: #7eb8ff;
                }
                .el-button:hover:not(:disabled) {
                  background: rgba(64, 158, 255, 0.28);
                  border-color: rgba(64, 158, 255, 0.45);
                  color: #fff;
                }
                .tray-total {
                  background: rgba(255, 255, 255, 0.1);
                  color: rgba(255, 255, 255, 0.7);
                  font-size: 13px;
                  padding: 4px 12px;
                  border-radius: 15px;
                  cursor: pointer;
                }
              }
            }
            .tray-list {
              flex: 1;
              overflow-y: auto;
              min-height: 0;
              padding-right: 5px;

              /* 托盘项样式 */
              .tray-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(48, 65, 85, 0.9);
                margin: 0 0 8px 0;
                padding: 12px 15px;
                border-radius: 8px;
                cursor: move;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.15);
                position: relative;

                .tray-info {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  width: 100%;
                  .tray-info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    .tray-name {
                      font-weight: 500;
                      color: rgba(255, 255, 255, 0.9);
                      font-size: 14px;
                    }

                    .tray-batch-group {
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      flex-wrap: wrap;
                      justify-content: flex-end;
                    }

                    .tray-batch {
                      font-size: 12px;
                      color: #7eb8ff;
                      background: rgba(64, 158, 255, 0.1);
                      padding: 2px 8px;
                      border-radius: 4px;
                      white-space: nowrap;

                      .sequence-number {
                        color: #ffa500;
                        font-weight: bold;
                        margin-left: 4px;
                      }
                    }

                    .tray-detail {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.7);
                      word-break: break-word;
                      line-height: 1.4;
                      flex: 1;
                      text-align: left;
                    }
                    .allocated-port {
                      color: #409eff;
                      font-weight: bold;
                      flex: 0 0 auto;
                    }
                    .destination-code {
                      color: #e6a23c;
                      font-weight: bold;
                      flex: 0 0 auto;
                    }
                  }
                  .tray-time {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                  }
                }
                .tray-actions {
                  display: flex;
                  gap: 4px;
                  position: absolute;
                  right: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  opacity: 0;
                  transition: opacity 0.3s ease;
                }

                .move-btn {
                  width: 24px;
                  height: 24px;
                  padding: 0;
                  border-radius: 50%;

                  &:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                  }

                  &:not(.is-disabled):hover {
                    background-color: #409eff;
                    border-color: #409eff;
                  }
                }

                .el-button {
                  &:not(.move-btn) {
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border-radius: 50%;
                  }
                }
              }
              .tray-item:hover {
                background: rgba(48, 65, 85, 1);
                border-color: rgba(64, 158, 255, 0.45);
                transform: translateX(2px);
                .tray-actions {
                  opacity: 1;
                }
              }
              .tray-item:last-child {
                margin-bottom: 0;
              }
              .tray-item.dragging {
                opacity: 0.6;
                transform: scale(0.98);
                border: 1px dashed rgba(255, 255, 255, 0.3);
              }
              /* 添加空状态样式 */
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 0;
                color: rgba(255, 255, 255, 0.6);
                i {
                  font-size: 48px;
                  margin-bottom: 16px;
                  color: rgba(255, 255, 255, 0.3);
                }
                p {
                  font-size: 14px;
                  margin: 0 0 16px 0;
                }
                .el-button {
                  color: #7eb8ff;
                  font-size: 14px;
                  i {
                    font-size: 14px;
                    margin-right: 4px;
                    color: inherit;
                  }
                }
                .el-button:hover {
                  color: #6aabf5;
                }
              }
            }
          }
        }
      }
    }
    /* 展开状态的样式 */
    .queue-section.expanded {
      padding: 15px;
      width: 850px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    /* 收起状态的样式 */
    .queue-section:not(.expanded) {
      width: 40px;
      height: 40px;
      padding: 0;
      background: none;
      box-shadow: none;
      border: none;
      .section-header {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #4385ff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(67, 133, 255, 0.25);
        transition: all 0.3s ease;
        padding: 0;
        span {
          display: none;
        }
        i {
          color: #fff;
          font-size: 20px;
          animation: rotate 10s linear infinite;
        }
      }
      .section-header:hover {
        transform: scale(1.1);
        background: #3e7bfa;
      }
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}

/* 添加新的测试面板样式 */
.test-panel-container {
  position: absolute; /* 修改位置，为测试按钮留出空间 */
  right: 80px; /* 修改位置，为队列按钮留出空间 */
  top: 20px;
  z-index: 1000;
}

.test-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4385ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(67, 133, 255, 0.25);
  transition: all 0.3s ease;
}

.test-toggle-btn:hover {
  transform: scale(1.1);
  background: #3e7bfa;
}

.test-toggle-btn i {
  color: #fff;
  font-size: 20px;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.test-panel {
  position: absolute;
  right: 50px;
  top: 0;
  width: 300px;
  max-height: 80vh; /* 限制最大高度为视窗高度的80% */
  background: rgba(30, 42, 56, 0.98);
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  transform-origin: top right;
  opacity: 1;
  transform: scale(1);
  display: flex;
  flex-direction: column;
}

.test-panel.collapsed {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.test-panel-header {
  padding: 15px;
  background: rgba(64, 158, 255, 0.15);
  border-radius: 15px 15px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7eb8ff;
  font-weight: bold;
  pointer-events: auto;
  flex-shrink: 0;
}

.test-panel-content {
  padding: 10px;
  overflow-y: auto;
  pointer-events: auto;
  flex: 1;
}

/* 添加滚动条样式 */
.test-panel-content::-webkit-scrollbar {
  width: 4px;
}

.test-panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.28);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.45);
}

.test-panel-header i {
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-panel-header i:hover {
  color: #ff4d4f;
}

.test-section {
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.test-label {
  display: block;
  color: #7eb8ff;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: bold;
}

.position-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.position-btn {
  padding: 6px 12px;
  background: rgba(64, 158, 255, 0.18);
  border: 1px solid rgba(64, 158, 255, 0.35);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.position-btn:hover {
  background: rgba(64, 158, 255, 0.32);
}

.position-btn:active {
  transform: scale(0.95);
}

/* 小车位置滑块样式 */
.cart-position-test-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.cart-position-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-position-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-value {
  background: rgba(64, 158, 255, 0.14);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #7eb8ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.cart-position-slider-container {
  padding: 5px 0;
}

.cart-position-slider {
  width: 100%;
}

.cart-position-slider :deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.1);
  height: 6px;
}

.cart-position-slider :deep(.el-slider__bar) {
  background-color: #409eff;
  height: 6px;
}

.cart-position-slider :deep(.el-slider__button) {
  border: 2px solid #409eff;
  background-color: #fff;
  width: 20px;
  height: 20px;
}

.cart-position-slider :deep(.el-slider__button:hover) {
  border-color: #409eff;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.45);
}

/* 测试添加结束 */

.qrcode-test-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.qrcode-test-container .el-button {
  padding: 4px 8px;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.qrcode-btn-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.qrcode-btn-grid .el-button {
  width: 100%;
}

.qrcode-input-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.qrcode-input-grid .qrcode-input-group {
  gap: 2px;
}

.qrcode-input-grid .qrcode-label {
  width: 32px;
  font-size: 11px;
}

.qrcode-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qrcode-label {
  width: 40px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
  flex-shrink: 0;
}

.send-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.qrcode-input {
  flex: 1;
}

.qrcode-input :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #fff;
  height: 24px;
  line-height: 24px;
  padding: 0 6px;
  font-size: 11px;
}

.qrcode-input :deep(.el-input__inner::placeholder) {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.qrcode-input :deep(.el-input__inner:hover),
.qrcode-input :deep(.el-input__inner:focus) {
  border-color: #409eff;
}

.qrcode-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.qrcode-actions .el-button {
  background: rgba(64, 158, 255, 0.14);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #7eb8ff;
}

.qrcode-actions .el-button:hover {
  background: rgba(64, 158, 255, 0.28);
  border-color: rgba(64, 158, 255, 0.45);
  color: #fff;
}

/* PLC 变量写入测试分组样式 */
.plc-test-wrapper :deep(.el-collapse) {
  border: none;
  background: transparent;
}

.plc-test-wrapper :deep(.el-collapse-item__header) {
  background: rgba(64, 158, 255, 0.1);
  color: #7eb8ff;
  border: none;
  padding: 0 10px;
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
}

.plc-test-wrapper :deep(.el-collapse-item__header.is-active) {
  background: rgba(64, 158, 255, 0.18);
}

.plc-test-wrapper :deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

.plc-test-wrapper :deep(.el-collapse-item__content) {
  padding: 8px 4px;
  color: #fff;
}

.compact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.compact-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.compact-label {
  width: 70px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  text-align: right;
}

.plc-test-wrapper :deep(.el-input--mini .el-input__inner) {
  height: 24px;
  line-height: 24px;
  padding: 0 5px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #fff;
}

.plc-test-wrapper :deep(.el-button--mini) {
  padding: 4px 8px;
  min-width: 32px;
}

/* 添加队列移动相关样式 */
.queue-move-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.queue-select-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.queue-move-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.queue-move-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.upload-area-actions {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  justify-content: center;
}

.upload-area-actions .el-button {
  background: rgba(64, 158, 255, 0.14);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #7eb8ff;
  width: 100%;
}

.upload-area-actions .el-button:hover:not(:disabled) {
  background: rgba(64, 158, 255, 0.28);
  border-color: rgba(64, 158, 255, 0.45);
  color: #fff;
}

.upload-area-actions .el-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.quantity-test-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.quantity-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quantity-title {
  font-size: 14px;
  color: #7eb8ff;
  font-weight: bold;
}

.quantity-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quantity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 42, 56, 0.8);
  border-radius: 4px;
  padding: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
  margin-bottom: 5px;

  .quantity-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    min-width: 30px;
  }

  .quantity-value {
    font-size: 14px;
    color: #7eb8ff;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
  }

  .quantity-buttons {
    display: flex;
    gap: 5px;

    .quantity-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: rgba(64, 158, 255, 0.18);
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }

      &.plus {
        background: rgba(64, 158, 255, 0.32);
        &:hover {
          background: rgba(64, 158, 255, 0.48);
        }
      }

      &.minus {
        background: rgba(245, 108, 108, 0.3);
        &:hover {
          background: rgba(245, 108, 108, 0.5);
        }
      }
    }
  }
}

/* 添加新的测试面板样式 */
.task-test-container {
  margin-top: 10px;

  .task-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

/* 托盘检索弹窗样式 */
.tray-search-form {
  .search-result {
    margin-top: 20px;
  }

  .no-result {
    margin-top: 20px;

    .no-result-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 20px;
      background: rgba(30, 42, 56, 0.8);
      border-radius: 8px;
      border: 1px solid rgba(255, 193, 7, 0.3);

      i {
        font-size: 48px;
        color: #ffc107;
        margin-bottom: 15px;
      }

      p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        margin: 0;
        text-align: center;
      }
    }
  }
}

/* 队列信息标题操作按钮样式 */
.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;

  .arrow-icon {
    cursor: pointer;
    transition: all 0.3s ease;
    color: #7eb8ff;
    font-size: 16px;

    &:hover {
      color: #fff;
      transform: scale(1.1);
    }
  }
}

/* 流动箭头（scoped 根级；配色与页面 --mp-accent 主题一致） */
.conveyor-arrow-item {
  position: relative;
  display: inline-block;
  width: 45px;
  height: 34px;
}
.conveyor-arrow-item::before {
  content: '';
  display: inline-block;
  position: relative;
  width: 20px;
  height: 16px;
  background-color: #4385ff;
}
.conveyor-arrow-item::after {
  content: '';
  position: relative;
  top: 4px;
  right: 12px;
  display: inline-block;
  width: 0;
  height: 0;
  border-right: 24px solid #4385ff;
  border-bottom: 24px solid transparent;
  transform: rotate(45deg);
}

.flow-item {
  height: 34px;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  backface-visibility: hidden;
  .conveyor-arrow-item {
    position: relative;
    animation: carousel 1s linear infinite;
    will-change: transform;
  }
}

@keyframes carousel {
  0% {
    transform: translateX(-45px) translateZ(0);
  }
  100% {
    transform: translateX(0px) translateZ(0);
  }
}
</style>
