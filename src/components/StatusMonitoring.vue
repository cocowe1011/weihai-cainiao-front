<template>
  <div
    :class="['sm-main', plcStatus ? 'online' : 'offline']"
    v-drag
    @dblclick="openPlcPanel"
  >
    <div class="inner">
      <i
        :class="plcStatus ? 'el-icon-circle-check' : 'el-icon-circle-close'"
        class="status-icon"
      ></i>
      <span class="status-text">
        {{ plcStatus ? 'PLC 已连接' : 'PLC 断开' }}
      </span>
    </div>
    <el-dialog
      title="PLC变量"
      :visible.sync="plcPanelVisible"
      width="760px"
      class="plc-panel"
      append-to-body
      @open="handlePlcPanelOpen"
      @close="handlePlcPanelClose"
    >
      <div class="plc-panel__actions">
        <el-select
          v-model="customWriteAddress"
          size="small"
          class="plc-panel__input"
          filterable
          clearable
          placeholder="变量地址，如 W_DBW0"
        >
          <el-option
            v-for="item in writeAddressOptions"
            :key="item"
            :label="item"
            :value="item"
          ></el-option>
        </el-select>
        <el-select
          v-model="customWriteType"
          size="small"
          class="plc-panel__select"
          placeholder="值类型"
        >
          <el-option label="布尔" value="bool"></el-option>
          <el-option label="字符串" value="string"></el-option>
        </el-select>
        <el-select
          v-if="customWriteType === 'bool'"
          v-model="customWriteBool"
          size="small"
          class="plc-panel__input"
          placeholder="布尔值"
        >
          <el-option label="true" :value="true"></el-option>
          <el-option label="false" :value="false"></el-option>
        </el-select>
        <el-input
          v-else
          v-model="customWriteValue"
          size="small"
          placeholder="值"
          class="plc-panel__input"
        ></el-input>
        <el-button
          type="primary"
          size="small"
          class="plc-panel__btn"
          :loading="isWriting"
          @click="confirmCustomWrite"
        >
          确认写入
        </el-button>
      </div>
      <div class="plc-panel__content">
        <div class="plc-panel__section">
          <div class="plc-panel__title">读取数据</div>
          <el-input
            v-model="readFilter"
            size="small"
            clearable
            placeholder="模糊检索读取变量"
            class="plc-panel__filter"
          ></el-input>
          <div class="plc-panel__list">
            <div
              class="plc-panel__row"
              v-for="item in filteredReadRows"
              :key="item.key"
            >
              <span class="plc-panel__key">{{ item.key }}</span>
              <span class="plc-panel__value">{{ item.value }}</span>
            </div>
          </div>
        </div>
        <div class="plc-panel__section">
          <div class="plc-panel__title">写入数据</div>
          <div class="plc-panel__list">
            <div
              class="plc-panel__row"
              v-for="item in writeRows"
              :key="item.key"
            >
              <span class="plc-panel__key">{{ item.key }}</span>
              <span class="plc-panel__value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Bit 位解析模块：按 S7 大端序解析 DBW 的 bit0~bit15 -->
      <div class="plc-panel__bit">
        <div class="plc-panel__bit-header">
          <span class="plc-panel__bit-title">Bit 解析</span>
          <el-select
            v-model="bitParseAddress"
            size="mini"
            class="plc-panel__bit-select"
            filterable
            clearable
            placeholder="DBW块"
          >
            <el-option
              v-for="item in readAddressOptions"
              :key="item"
              :label="item"
              :value="item"
            ></el-option>
          </el-select>
          <span class="plc-panel__bit-info-item"
            >值:<b>{{ bitParseRawValue }}</b></span
          >
          <span class="plc-panel__bit-info-item"
            >Word:<b>{{ bitParseWordValue }}</b></span
          >
          <span class="plc-panel__bit-info-item plc-panel__bit-bin"
            >BIN:<b>{{ bitParseBinary }}</b></span
          >
        </div>
        <div class="plc-panel__bit-grid">
          <div
            v-for="item in bitParseRows"
            :key="item.logicBit"
            :class="['plc-panel__bit-cell', item.value === 1 ? 'on' : 'off']"
            :title="'逻辑 bit' + item.logicBit + ' / 实际 bit' + item.actualBit"
          >
            <span class="plc-panel__bit-label">{{ item.logicBit }}</span>
            <span class="plc-panel__bit-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'StatusMonitor',
  directives: {
    drag: {
      // 1. 绑定钩子
      bind: function (el) {
        const oDiv = el;

        // 定义 resize 处理函数（命名它，以便稍后解绑）
        const handleResize = () => {
          const clientWidth = document.documentElement.clientWidth;
          const clientHeight = document.documentElement.clientHeight;
          const maxLeft = clientWidth - oDiv.offsetWidth;
          const maxTop = clientHeight - oDiv.offsetHeight;

          if (oDiv._percentX === undefined) {
            // 简单防溢出
            if (oDiv.offsetLeft > maxLeft) oDiv.style.left = maxLeft + 'px';
            if (oDiv.offsetTop > maxTop) oDiv.style.top = maxTop + 'px';
          } else {
            // 比例跟随
            let newLeft = maxLeft * oDiv._percentX;
            let newTop = maxTop * oDiv._percentY;
            oDiv.style.left = newLeft + 'px';
            oDiv.style.top = newTop + 'px';
          }
        };

        // 将函数挂载到元素上，方便 unbind 调用
        el._resizeHandler = handleResize;
        window.addEventListener('resize', handleResize);

        // --- 拖拽逻辑 ---
        const updatePercent = () => {
          const clientWidth = document.documentElement.clientWidth;
          const clientHeight = document.documentElement.clientHeight;
          const maxLeft = clientWidth - oDiv.offsetWidth;
          const maxTop = clientHeight - oDiv.offsetHeight;
          if (maxLeft > 0) oDiv._percentX = oDiv.offsetLeft / maxLeft;
          if (maxTop > 0) oDiv._percentY = oDiv.offsetTop / maxTop;
        };

        oDiv.onmousedown = (e) => {
          // 只响应左键，右键/中键不触发拖拽
          if (e.button !== 0) return;
          // 先清理可能残留的上一轮拖拽状态（防止多次 mousedown 累积泄漏）
          if (oDiv._currentEndDrag) {
            oDiv._currentEndDrag();
          }

          const disX = e.clientX - oDiv.offsetLeft;
          const disY = e.clientY - oDiv.offsetTop;

          oDiv.style.cursor = 'move';
          oDiv.style.zIndex = '9999';
          oDiv.style.transition = 'none';

          const endDrag = () => {
            document.onmousemove = null;
            document.onmouseup = null;
            window.removeEventListener('mouseup', endDrag);
            window.removeEventListener('blur', endDrag);
            document.removeEventListener('contextmenu', endDrag);
            oDiv._currentEndDrag = null;
            oDiv.style.cursor = 'move';
            oDiv.style.transition = 'border-color 0.3s';
            updatePercent();
          };

          // 存到元素上，unbind 时可清理进行中的拖拽
          oDiv._currentEndDrag = endDrag;

          document.onmousemove = (e) => {
            // 鼠标离开可视区域时自动结束拖拽，防止窗口外松开后拖拽状态未释放
            if (
              e.clientX < 0 ||
              e.clientX > document.documentElement.clientWidth ||
              e.clientY < 0 ||
              e.clientY > document.documentElement.clientHeight
            ) {
              endDrag();
              return;
            }
            let left = e.clientX - disX;
            let top = e.clientY - disY;

            // 缓存 clientWidth/Height 会更快，但为了代码简洁直接读取也无妨（Electron环境通常性能足够）
            const maxLeft =
              document.documentElement.clientWidth - oDiv.offsetWidth;
            const maxTop =
              document.documentElement.clientHeight - oDiv.offsetHeight;

            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left > maxLeft) left = maxLeft;
            if (top > maxTop) top = maxTop;

            oDiv.style.left = left + 'px';
            oDiv.style.top = top + 'px';
          };

          document.onmouseup = endDrag;
          window.addEventListener('mouseup', endDrag);
          // 窗口失焦保底：Alt+Tab / 点击其他窗口时自动停止拖拽
          window.addEventListener('blur', endDrag);
          // 右键保底：拖拽过程中右键点击时停止拖拽
          document.addEventListener('contextmenu', endDrag);
        };
      },
      // 2. 解绑钩子 (防止内存泄漏)
      unbind: function (el) {
        if (el._resizeHandler) {
          window.removeEventListener('resize', el._resizeHandler);
          delete el._resizeHandler;
        }
        // 清理进行中的拖拽状态
        if (el._currentEndDrag) {
          document.onmousemove = null;
          document.onmouseup = null;
          window.removeEventListener('mouseup', el._currentEndDrag);
          window.removeEventListener('blur', el._currentEndDrag);
          document.removeEventListener('contextmenu', el._currentEndDrag);
          delete el._currentEndDrag;
        }
        delete el._percentX;
        delete el._percentY;
      }
    }
  },
  data() {
    return {
      watchDog: '0',
      warningTimeOut: null,
      plcStatus: false,
      plcPanelVisible: false,
      plcValues: {},
      plcVariables: {},
      writeAddArr: [],
      writeStrArr: [],
      customWriteAddress: '',
      customWriteType: 'string',
      customWriteValue: '',
      customWriteBool: true,
      readFilter: '',
      isWriting: false,
      cancelWriteTimer: null, // 取消写入的定时器，防止内存泄漏
      writeDataPollingTimer: null, // 轮询定时器
      bitParseAddress: '' // Bit 解析选中的 DBW 地址
    };
  },
  computed: {
    writeAddressOptions() {
      return Object.keys(this.plcVariables).filter((key) =>
        key.startsWith('W_')
      );
    },
    readRows() {
      const keys = Object.keys(this.plcVariables).filter(
        (key) => !key.startsWith('W_')
      );
      return keys.map((key) => ({
        key,
        value: this.plcValues[key] === undefined ? '--' : this.plcValues[key]
      }));
    },
    filteredReadRows() {
      const keyword = this.readFilter.trim().toLowerCase();
      if (!keyword) return this.readRows;
      return this.readRows.filter((item) =>
        String(item.key).toLowerCase().includes(keyword)
      );
    },
    writeRows() {
      return this.writeAddArr.map((key, index) => ({
        key,
        value:
          this.writeStrArr[index] === undefined ? '--' : this.writeStrArr[index]
      }));
    },
    // Bit 解析：当前可选的读取地址（非 W_ 开头）
    readAddressOptions() {
      return Object.keys(this.plcVariables).filter(
        (key) => !key.startsWith('W_')
      );
    },
    // Bit 解析：从 plcValues 取到的原始值
    bitParseRawValue() {
      if (!this.bitParseAddress) return '--';
      const v = this.plcValues[this.bitParseAddress];
      return v === undefined || v === null ? '--' : v;
    },
    // Bit 解析：转换为无符号 16 位 word
    bitParseWordValue() {
      if (!this.bitParseAddress) return '--';
      const v = this.plcValues[this.bitParseAddress];
      if (v === undefined || v === null) return '--';
      return this.convertToWord(Number(v));
    },
    // Bit 解析：16 位二进制字符串（高位在前）
    bitParseBinary() {
      if (this.bitParseWordValue === '--') return '--';
      return Number(this.bitParseWordValue).toString(2).padStart(16, '0');
    },
    // Bit 解析：bit0~bit15 映射（按 MainPage.vue 的 S7 大端序逻辑）
    bitParseRows() {
      const word =
        this.bitParseWordValue === '--' ? 0 : Number(this.bitParseWordValue);
      const hasValue = this.bitParseWordValue !== '--';
      const rows = [];
      for (let logicBit = 0; logicBit < 16; logicBit++) {
        // S7 大端序：逻辑 bit0~7 → 实际 bit8~15，逻辑 bit8~15 → 实际 bit0~7
        const actualBit = logicBit < 8 ? logicBit + 8 : logicBit - 8;
        const value = hasValue ? (word >> actualBit) & 1 : '-';
        rows.push({ logicBit, actualBit, value });
      }
      return rows;
    }
  },
  watch: {
    watchDog: {
      handler(newVal, oldVal) {
        this.plcStatus = true;
        if (this.warningTimeOut) {
          clearTimeout(this.warningTimeOut);
        }
        this.warningTimeOut = setTimeout(() => {
          if (this._isDestroyed) return;
          this.plcStatus = false;
          if (this.$route.path != '/login') {
            this.$message.error('PLC连接中断');
          }
        }, 3000);
      }
    }
  },
  mounted() {
    // receivedMsg 只接收PLC实时读取的数据
    this.ipcHandler = (event, values) => {
      this.watchDog = values.DBW0;
      this.plcValues = values || {};
    };
    ipcRenderer.on('receivedMsg', this.ipcHandler);
    // 不在挂载时获取数据，只有打开面板时才交互
  },
  // 3. 组件销毁清理
  beforeDestroy() {
    this._isDestroyed = true;
    // 清理 IPC 监听器
    if (this.ipcHandler) {
      ipcRenderer.removeListener('receivedMsg', this.ipcHandler);
      this.ipcHandler = null;
    }
    // 清理所有定时器
    if (this.warningTimeOut) {
      clearTimeout(this.warningTimeOut);
      this.warningTimeOut = null;
    }
    // 清除轮询定时器
    this.stopWriteDataPolling();
    // 清除取消写入定时器
    if (this.cancelWriteTimer) {
      clearTimeout(this.cancelWriteTimer);
      this.cancelWriteTimer = null;
    }
  },
  methods: {
    openPlcPanel() {
      this.plcPanelVisible = true;
    },
    async handlePlcPanelOpen() {
      // 打开面板时才开始数据交互
      // 1. 如果还没加载过 plcVariables，先加载一次（因为启动后不会变）
      if (Object.keys(this.plcVariables).length === 0) {
        await this.loadPlcVariables();
      }
      // 2. 立即获取一次写入数据
      await this.refreshWriteData();
      // 3. 开始轮询写入数据
      this.startWriteDataPolling();
    },
    handlePlcPanelClose() {
      // 关闭面板时停止轮询，避免不必要的请求
      this.stopWriteDataPolling();
    },
    // 加载PLC变量定义：只在组件挂载时调用一次（因为启动后不会变）
    async loadPlcVariables() {
      try {
        const payload = await ipcRenderer.invoke('getPlcVariables');
        if (payload) {
          this.plcVariables = payload.variables || {};
        }
      } catch (error) {
        console.error('加载PLC变量定义失败:', error);
      }
    },
    // 刷新写入数据：writeStrArr 和 writeAddArr 经常变化，需要轮询更新
    async refreshWriteData() {
      try {
        const payload = await ipcRenderer.invoke('getWriteData');
        if (payload) {
          this.writeAddArr = payload.writeAddArr || [];
          this.writeStrArr = payload.writeStrArr || [];
        }
      } catch (error) {
        // 轮询时的错误不需要弹窗提示，只在控制台记录
        console.error('刷新写入数据失败:', error);
      }
    },
    // 开始轮询写入数据
    startWriteDataPolling() {
      // 防止重复创建定时器
      this.stopWriteDataPolling();
      // 每2秒轮询一次写入数据
      this.writeDataPollingTimer = setInterval(() => {
        this.refreshWriteData();
      }, 1000);
    },
    // 停止轮询写入数据
    stopWriteDataPolling() {
      if (this.writeDataPollingTimer) {
        clearInterval(this.writeDataPollingTimer);
        this.writeDataPollingTimer = null;
      }
    },
    getCustomWriteValue() {
      if (this.customWriteType === 'bool') {
        return this.customWriteBool;
      }
      return String(this.customWriteValue);
    },
    async confirmCustomWrite() {
      const address = this.customWriteAddress.trim();
      if (!address) {
        this.$message.warning('请输入变量地址');
        return;
      }
      this.isWriting = true;
      const value = this.getCustomWriteValue();
      try {
        if (this.writeAddArr.includes(address)) {
          ipcRenderer.send('writeValuesToPLC', address, value);
          await this.refreshWriteData();
          this.$message.success('写入指令已发送');
          this.isWriting = false;
        } else {
          ipcRenderer.send('writeSingleValueToPLC', address, value);
          await this.refreshWriteData();
          this.$message.success('写入指令已发送');
          // 2秒后取消写入并关闭loading
          this.cancelWriteTimer = setTimeout(() => {
            ipcRenderer.send('cancelWriteToPLC', address);
            this.isWriting = false;
            this.cancelWriteTimer = null;
          }, 2000);
        }
      } catch (error) {
        console.error('写入失败:', error);
        this.$message.error('写入失败');
        this.isWriting = false;
      }
    },
    // 将有符号 16 位整数转为无符号 word（与 MainPage.vue convertToWord 一致）
    convertToWord(value) {
      if (value < 0) {
        return (value & 0xffff) >>> 0;
      }
      return value;
    }
  }
};
</script>

<style lang="less" scoped>
/* 样式部分保持不变，因为已经是极简高性能版 */
.sm-main {
  position: absolute;
  right: 25px;
  bottom: 25px;
  height: 40px;
  width: 120px;
  z-index: 4000;
  background-color: #1f2d3d;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: move;
  user-select: none;
  overflow: hidden;
  transition: border-color 0.3s;

  .inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 10px;
    box-sizing: border-box;
  }

  .status-icon {
    font-size: 16px;
    margin-right: 8px;
  }

  .status-text {
    font-size: 13px;
    color: #e0e0e0;
    font-weight: 500;
  }

  &.online {
    border-left: 4px solid #67c23a;
    .status-icon {
      color: #67c23a;
    }
  }

  &.offline {
    border-left: 4px solid #f56c6c;
    .status-icon {
      color: #f56c6c;
    }
    .status-text {
      color: #bbb;
    }
  }
}

.sm-main:active {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.plc-panel {
  .plc-panel__content {
    padding: 2px;
  }

  .plc-panel__actions {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    background: #f5f7fa;
    border: 1px solid #ebeef5;
  }

  .plc-panel__input {
    flex: 1;
    min-width: 160px;
  }

  .plc-panel__select {
    width: 100px;
  }

  .plc-panel__btn {
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
  }

  .plc-panel__content {
    display: flex;
    gap: 16px;
    height: 440px;
  }

  .plc-panel__section {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 10px 12px;
    background: #fff;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
  }

  .plc-panel__title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }

  .plc-panel__filter {
    margin-bottom: 8px;
  }

  .plc-panel__list {
    flex: 1;
    overflow: auto;
    padding-right: 4px;
  }

  .plc-panel__row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px dashed #ebeef5;
    font-size: 12px;
    color: #606266;
  }
  .plc-panel__row:nth-child(odd) {
    background: #fafcff;
  }
  .plc-panel__row:hover {
    background: #f2f6fc;
  }

  .plc-panel__key {
    font-weight: 600;
    color: #303133;
    font-family: 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
  }

  .plc-panel__value {
    color: #909399;
    font-family: 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
  }

  .plc-panel__bit {
    margin-top: 10px;
    padding: 6px 8px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background: #fff;
  }

  .plc-panel__bit-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;
    color: #606266;
    font-family: 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
    flex-wrap: wrap;
  }

  .plc-panel__bit-title {
    font-weight: 600;
    color: #303133;
    padding-left: 6px;
    border-left: 3px solid #409eff;
    line-height: 1;
  }

  .plc-panel__bit-select {
    width: 110px;
    flex: 0 0 110px;
  }

  .plc-panel__bit-info-item {
    b {
      color: #303133;
      margin-left: 2px;
    }
  }

  .plc-panel__bit-bin {
    letter-spacing: 1px;
  }

  .plc-panel__bit-grid {
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    gap: 3px;
  }

  .plc-panel__bit-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #dcdfe6;
    border-radius: 2px;
    padding: 2px 0;
    text-align: center;
    font-family: 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
    background: #f5f7fa;
    line-height: 1.1;

    &.on {
      background: #ecf5ec;
      border-color: #67c23a;
      .plc-panel__bit-value {
        color: #67c23a;
      }
    }

    &.off {
      background: #fef0f0;
      border-color: #f56c6c;
      .plc-panel__bit-value {
        color: #f56c6c;
      }
    }
  }

  .plc-panel__bit-label {
    font-size: 10px;
    color: #909399;
  }

  .plc-panel__bit-value {
    font-size: 14px;
    font-weight: 700;
  }
}
</style>
