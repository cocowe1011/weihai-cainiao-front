<template>
  <div class="system-config">
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">系统配置</h2>
          <p class="page-subtitle">分拣业务参数，保存后立即生效，无需重启</p>
        </div>
        <div class="header-right">
          <el-button
            v-show="!allowEdit"
            type="info"
            plain
            icon="Unlock"
            @click="allowEdit = true"
          >
            页面已锁定，点击修改配置
          </el-button>
          <el-button v-show="allowEdit" @click="cancelEdit">取消</el-button>
          <el-button
            v-show="allowEdit"
            type="primary"
            icon="Check"
            :loading="saving"
            @click="update"
          >
            保存
          </el-button>
        </div>
      </div>

      <div class="form-section" v-loading="loading">
        <el-form
          label-position="right"
          label-width="280px"
          :model="cssConfig"
          :disabled="!allowEdit"
        >
          <el-divider content-position="left">分拣匹配与超时</el-divider>
          <el-form-item label="光电应到达误差-正向（秒）">
            <el-input-number
              v-model="cssConfig.arrivalToleranceSec"
              :min="0.1"
              :max="60"
              :step="0.1"
              :precision="1"
              controls-position="right"
            />
            <span class="form-hint"
              >货物早到：光电触发时已超过应到达时刻的允许误差</span
            >
          </el-form-item>
          <!-- 负向误差复用 css_config.speed_two 遗留字段存储，避免加新列 -->
          <el-form-item label="光电应到达误差-负向（秒）">
            <el-input-number
              v-model="cssConfig.speedTwo"
              :min="0.1"
              :max="60"
              :step="0.1"
              :precision="1"
              controls-position="right"
            />
            <span class="form-hint"
              >货物晚到：光电触发时尚未到应到达时刻的允许误差</span
            >
          </el-form-item>
          <el-form-item label="未进入分拣口清理时间（秒）">
            <el-input-number
              v-model="cssConfig.notEnteredTimeoutSec"
              :min="0.1"
              :max="120"
              :step="0.1"
              :precision="1"
              controls-position="right"
            />
            <span class="form-hint"
              >已发转向命令后仍未进入分拣口，则从上货队列删除</span
            >
          </el-form-item>
          <el-form-item label="未发送分拣命令清理时间（秒）">
            <el-input-number
              v-model="cssConfig.cmdNotSentTimeoutSec"
              :min="0.1"
              :max="120"
              :step="0.1"
              :precision="1"
              controls-position="right"
            />
            <span class="form-hint"
              >超过应到达时刻后再等待该时长，仍未发命令则删除</span
            >
          </el-form-item>

          <el-divider content-position="left">分拣口容量</el-divider>
          <el-form-item label="大包分拣口容量">
            <el-input-number
              v-model="cssConfig.largePortCapacity"
              :min="1"
              :max="99"
              :step="1"
              :precision="0"
              controls-position="right"
            />
            <span class="form-hint">1~11 号通用口，大包占用上限</span>
          </el-form-item>
          <el-form-item label="小包分拣口容量">
            <el-input-number
              v-model="cssConfig.smallPortCapacity"
              :min="1"
              :max="99"
              :step="1"
              :precision="0"
              controls-position="right"
            />
            <span class="form-hint">1~11 号通用口，小包占用上限</span>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';
import { EventBus } from '@/utils/EventBus';

const BIZ_DEFAULTS = {
  arrivalToleranceSec: 2,
  speedTwo: 2,
  notEnteredTimeoutSec: 4.5,
  cmdNotSentTimeoutSec: 5,
  largePortCapacity: 5,
  smallPortCapacity: 8
};

export default {
  name: 'SystemConfig',
  data() {
    return {
      cssConfig: {
        configId: '',
        plcIp: '',
        plcPort: '',
        ...BIZ_DEFAULTS
      },
      snapshot: null,
      loading: false,
      saving: false,
      allowEdit: false
    };
  },
  methods: {
    applyDefaults(cfg) {
      const next = { ...this.cssConfig, ...(cfg || {}) };
      Object.keys(BIZ_DEFAULTS).forEach((key) => {
        if (next[key] === null || next[key] === undefined || next[key] === '') {
          next[key] = BIZ_DEFAULTS[key];
        } else {
          next[key] = Number(next[key]);
        }
      });
      this.cssConfig = next;
    },
    getConfig() {
      this.loading = true;
      HttpUtil.get('/cssConfig/getConfig')
        .then((res) => {
          this.applyDefaults(res.data);
          this.snapshot = JSON.parse(JSON.stringify(this.cssConfig));
        })
        .catch((err) => {
          console.log('config error!', err);
          this.$message.error('配置查询失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    cancelEdit() {
      if (this.snapshot) {
        this.cssConfig = JSON.parse(JSON.stringify(this.snapshot));
      }
      this.allowEdit = false;
    },
    validateBizFields() {
      const checks = [
        ['arrivalToleranceSec', '光电应到达误差-正向'],
        ['speedTwo', '光电应到达误差-负向'],
        ['notEnteredTimeoutSec', '未进入分拣口清理时间'],
        ['cmdNotSentTimeoutSec', '未发送分拣命令清理时间'],
        ['largePortCapacity', '大包分拣口容量'],
        ['smallPortCapacity', '小包分拣口容量']
      ];
      for (let i = 0; i < checks.length; i++) {
        const [key, label] = checks[i];
        const val = this.cssConfig[key];
        if (
          val === '' ||
          val === null ||
          val === undefined ||
          Number.isNaN(Number(val))
        ) {
          this.$message.error(`${label}不可保存为空值！`);
          return false;
        }
        if (Number(val) <= 0) {
          this.$message.error(`${label}必须大于 0！`);
          return false;
        }
      }
      return true;
    },
    update() {
      if (!this.validateBizFields()) {
        return false;
      }
      this.saving = true;
      HttpUtil.post('/cssConfig/update', this.cssConfig)
        .then((res) => {
          if (res.data > 0) {
            this.$message.success('修改成功！');
            this.allowEdit = false;
            this.getConfig();
            EventBus.$emit('reFlushConfig');
          } else {
            this.$message.error('修改失败，请重试！');
          }
        })
        .catch((err) => {
          console.log('config error!', err);
          this.$message.error('修改失败，请重试！');
        })
        .finally(() => {
          this.saving = false;
        });
    }
  },
  created() {
    this.getConfig();
  }
};
</script>

<style lang="less" scoped>
.system-config {
  width: 100%;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;

  .page-container {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 1);
    border-radius: 20px;
    box-shadow: 0px 60px 90px 0px rgba(0, 0, 0, 0.2);
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e6e6e6;
      flex-shrink: 0;

      .header-left {
        .page-title {
          margin: 0 0 5px 0;
          font-size: 24px;
          font-weight: 600;
          color: #262626;
        }

        .page-subtitle {
          margin: 0;
          font-size: 13px;
          color: #8c8c8c;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }

    .form-section {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 8px 24px 16px 8px;

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #262626;
      }

      :deep(.el-input-number) {
        width: 180px;
      }

      .form-hint {
        margin-left: 12px;
        font-size: 12px;
        color: #8c8c8c;
      }
    }
  }
}
</style>
