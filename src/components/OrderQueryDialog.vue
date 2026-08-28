<template>
  <el-dialog
    title="订单查询"
    v-model="dialogVisible"
    width="98%"
    :close-on-click-modal="false"
    append-to-body
    class="order-query-dialog"
  >
    <!-- 查询条件（与 OrderInfo PO / 分页 DTO 字段对应） -->
    <div class="query-form">
      <div class="query-item">
        <label>上货日期：</label>
        <el-date-picker
          v-model="queryForm.productionDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 160px"
        >
        </el-date-picker>
      </div>
      <div class="query-item">
        <label>大包号：</label>
        <el-input
          v-model="queryForm.packageNo"
          placeholder="大包号"
          style="width: 170px"
          clearable
        ></el-input>
      </div>
      <div class="query-item">
        <label>业务编号：</label>
        <el-input
          v-model="queryForm.businessNo"
          placeholder="业务编号"
          style="width: 170px"
          clearable
        ></el-input>
      </div>
      <div class="query-item query-actions">
        <el-button type="primary" @click="handleSearch" :loading="loading">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshLeft /></el-icon>重置
        </el-button>
        <el-button
          type="success"
          @click="handleExportExcel"
          :loading="exportLoading"
          :disabled="pagination.total === 0"
        >
          <el-icon><Download /></el-icon>导出Excel
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        element-loading-text="正在查询..."
        style="width: 100%"
        max-height="400px"
      >
        <el-table-column
          prop="insertTime"
          label="上货时间"
          width="170"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="packageNo"
          label="大包号"
          width="150"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="customerSource"
          label="客户来源"
          min-width="100"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="batchNo"
          label="批次号"
          min-width="140"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="trayStatus"
          label="流转状态"
          width="110"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="getTrayStatusType(scope.row.trayStatus)"
              size="small"
            >
              {{ getTrayStatusText(scope.row.trayStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="channel"
          label="渠道"
          min-width="160"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="destinationCountry"
          label="目的国"
          width="90"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="sourceWarehouse"
          label="来源仓"
          width="140"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="chargeWeight"
          label="计费重"
          width="100"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="actualQty"
          label="实际件数"
          width="90"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="businessNo"
          label="业务编号"
          width="160"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="packageStatus"
          label="包裹状态"
          width="90"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="finishTime"
          label="送达WMS时间"
          width="170"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button
              link
              type="primary"
              size="small"
              @click="openEdit(scope.row)"
            >
              修改
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              class="order-invalidate-btn"
              :disabled="isInvalidRow(scope.row)"
              @click="handleInvalidate(scope.row)"
            >
              作废
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.pageNum"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      >
      </el-pagination>
    </div>

    <el-dialog
      title="修改订单"
      v-model="editDialogVisible"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
      @closed="resetEditForm"
    >
      <div class="edit-form-body">
        <el-form
          ref="editFormRef"
          :model="editForm"
          label-width="100px"
          size="small"
        >
          <el-form-item label="大包号">
            <el-input v-model="editForm.packageNo" clearable></el-input>
          </el-form-item>
          <el-form-item label="客户来源">
            <el-input v-model="editForm.customerSource" clearable></el-input>
          </el-form-item>
          <el-form-item label="目的国">
            <el-input
              v-model="editForm.destinationCountry"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="批次号">
            <el-input v-model="editForm.batchNo" clearable></el-input>
          </el-form-item>
          <el-form-item label="流转状态">
            <el-select
              v-model="editForm.trayStatus"
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option label="已上货" value="1"></el-option>
              <el-option label="分拣" value="2"></el-option>
              <el-option label="AGV运输中" value="3"></el-option>
              <el-option label="已送达WMS" value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="计费重">
            <el-input v-model="editForm.chargeWeight" clearable></el-input>
          </el-form-item>
          <el-form-item label="实际件数">
            <el-input v-model="editForm.actualQty" clearable></el-input>
          </el-form-item>
          <el-form-item label="来源仓">
            <el-input v-model="editForm.sourceWarehouse" clearable></el-input>
          </el-form-item>
          <el-form-item label="渠道">
            <el-input v-model="editForm.channel" clearable></el-input>
          </el-form-item>
          <el-form-item label="业务编号">
            <el-input v-model="editForm.businessNo" clearable></el-input>
          </el-form-item>
          <el-form-item label="包裹状态">
            <el-input v-model="editForm.packageStatus" clearable></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="editSaving" @click="submitEdit">
            保 存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { ipcRenderer } from 'electron';
import * as XLSX from 'xlsx';
import fs from 'fs';
import HttpUtil from '@/utils/HttpUtil';

const remote = require('electron').remote;

const emptyQueryForm = () => ({
  productionDate: '',
  packageNo: '',
  businessNo: ''
});

const emptyEditForm = () => ({
  id: null,
  packageNo: '',
  customerSource: '',
  destinationCountry: '',
  batchNo: '',
  trayStatus: '',
  chargeWeight: '',
  actualQty: '',
  sourceWarehouse: '',
  channel: '',
  businessNo: '',
  packageStatus: ''
});

export default {
  name: 'OrderQueryDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      loading: false,
      exportLoading: false,
      queryForm: emptyQueryForm(),
      tableData: [],
      pagination: {
        pageNum: 1,
        pageSize: 20,
        total: 0
      },
      editDialogVisible: false,
      editForm: emptyEditForm(),
      editBeforeSnapshot: null,
      editSaving: false
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.handleSearch();
      }
    }
  },
  methods: {
    isInvalidRow(row) {
      return String(row.invalidFlag) === '1';
    },
    openEdit(row) {
      this.editForm = {
        id: row.id,
        packageNo: row.packageNo || '',
        customerSource: row.customerSource || '',
        destinationCountry: row.destinationCountry || '',
        batchNo: row.batchNo || '',
        trayStatus:
          row.trayStatus != null && row.trayStatus !== ''
            ? String(row.trayStatus)
            : '',
        chargeWeight: row.chargeWeight != null ? String(row.chargeWeight) : '',
        actualQty: row.actualQty != null ? String(row.actualQty) : '',
        sourceWarehouse: row.sourceWarehouse || '',
        channel: row.channel || '',
        businessNo: row.businessNo || '',
        packageStatus: row.packageStatus || ''
      };
      this.editBeforeSnapshot = { ...this.editForm };
      this.editDialogVisible = true;
    },
    resetEditForm() {
      this.editForm = emptyEditForm();
      this.editBeforeSnapshot = null;
      if (this.$refs.editFormRef) {
        this.$refs.editFormRef.clearValidate();
      }
    },
    emitLocalOrderLog(line) {
      try {
        ipcRenderer.send('writeLogToLocal', line);
      } catch (e) {
        console.error('写入本地订单日志失败:', e);
      }
    },
    async submitEdit() {
      if (this.editForm.id == null) return;
      this.editSaving = true;
      try {
        const payload = {
          id: this.editForm.id,
          packageNo: this.editForm.packageNo,
          customerSource: this.editForm.customerSource,
          destinationCountry: this.editForm.destinationCountry,
          batchNo: this.editForm.batchNo,
          trayStatus: this.editForm.trayStatus,
          chargeWeight: this.editForm.chargeWeight,
          actualQty: this.editForm.actualQty,
          sourceWarehouse: this.editForm.sourceWarehouse,
          channel: this.editForm.channel,
          businessNo: this.editForm.businessNo,
          packageStatus: this.editForm.packageStatus
        };
        const res = await HttpUtil.post('/order_info/update', payload);
        if (res && res.data === 1) {
          this.emitLocalOrderLog(
            `[订单修改] 原来:${JSON.stringify(
              this.editBeforeSnapshot || {}
            )} | 现在:${JSON.stringify(payload)}`
          );
          this.$message.success('保存成功');
          this.editDialogVisible = false;
          this.handleSearch();
        } else {
          this.$message.error(res.msg || '保存失败');
        }
      } catch (e) {
        console.error(e);
        this.$message.error('保存失败，请重试');
      } finally {
        this.editSaving = false;
      }
    },
    handleInvalidate(row) {
      if (this.isInvalidRow(row)) return;
      this.$confirm('确认将该订单标记为作废？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
        .then(async () => {
          try {
            const res = await HttpUtil.post('/order_info/update', {
              id: row.id,
              invalidFlag: '1'
            });
            if (res && res.data === 1) {
              this.$message.success('已作废');
              this.handleSearch();
            } else {
              this.$message.error(res.msg || '作废失败');
            }
          } catch (e) {
            console.error(e);
            this.$message.error('作废失败，请重试');
          }
        })
        .catch(() => {});
    },
    buildSearchParams(overrides = {}) {
      const params = {
        pageNum: this.pagination.pageNum,
        pageSize: this.pagination.pageSize,
        ...this.queryForm,
        ...overrides
      };

      Object.keys(params).forEach((key) => {
        if (
          params[key] === '' ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      params.invalidFlag = '0';
      return params;
    },

    mapRowToExport(row) {
      return {
        上货时间: row.insertTime || '',
        大包号: row.packageNo || '',
        客户来源: row.customerSource || '',
        批次号: row.batchNo || '',
        流转状态: this.getTrayStatusText(row.trayStatus),
        渠道: row.channel || '',
        目的国: row.destinationCountry || '',
        来源仓: row.sourceWarehouse || '',
        计费重: row.chargeWeight != null ? row.chargeWeight : '',
        实际件数: row.actualQty != null ? row.actualQty : '',
        业务编号: row.businessNo || '',
        状态: row.packageStatus || '',
        送达WMS时间: row.finishTime || ''
      };
    },

    async handleExportExcel() {
      if (this.pagination.total === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }

      this.exportLoading = true;
      try {
        const params = this.buildSearchParams({
          pageNum: 1,
          pageSize: this.pagination.total
        });
        const res = await HttpUtil.post(
          '/order_info/queryHistoryOrderList',
          params
        );
        const list = (res && res.data && res.data.list) || [];
        if (!list.length) {
          this.$message.warning('暂无数据可导出');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(
          list.map((row) => this.mapRowToExport(row))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '订单查询');

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(
          now.getMonth() + 1
        )}-${pad(now.getDate())}_${pad(now.getHours())}${pad(
          now.getMinutes()
        )}${pad(now.getSeconds())}`;
        const { canceled, filePath } = await remote.dialog.showSaveDialog({
          title: '导出Excel',
          defaultPath: `订单查询_${timestamp}.xlsx`,
          filters: [{ name: 'Excel文件', extensions: ['xlsx'] }]
        });
        if (canceled || !filePath) return;

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        fs.writeFileSync(filePath, buffer);
        this.$message.success('导出成功');
      } catch (error) {
        console.error('导出Excel失败:', error);
        this.$message.error('导出失败，请重试');
      } finally {
        this.exportLoading = false;
      }
    },

    async handleSearch() {
      this.loading = true;
      try {
        const params = this.buildSearchParams();

        const res = await HttpUtil.post(
          '/order_info/queryHistoryOrderList',
          params
        );
        const page = res && res.data;
        if (page) {
          this.tableData = page.list || [];
          this.pagination.total = page.total != null ? page.total : 0;
        } else {
          this.tableData = [];
          this.pagination.total = 0;
        }
      } catch (error) {
        console.error('查询订单失败:', error);
        this.$message.error('查询订单失败，请重试');
        this.tableData = [];
        this.pagination.total = 0;
      } finally {
        this.loading = false;
      }
    },

    handleReset() {
      this.queryForm = emptyQueryForm();
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.handleSearch();
    },

    /** 流转状态：1已上货 2分拣 3AGV运输中 4已送达WMS */
    getTrayStatusText(status) {
      const map = {
        1: '已上货',
        2: '分拣',
        3: 'AGV运输中',
        4: '已送达WMS'
      };
      return map[String(status)] || status || '—';
    },

    getTrayStatusType(status) {
      const s = String(status);
      const typeMap = {
        1: 'warning',
        2: 'primary',
        3: '',
        4: 'success'
      };
      return typeMap[s] || 'info';
    }
  }
};
</script>

<style lang="less" scoped>
.order-query-dialog {
  .query-form {
    padding: 10px 0;
    margin-bottom: 10px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: nowrap;
    overflow-x: auto;

    .query-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;

      label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
      }

      .el-button + .el-button {
        margin-left: 10px;
      }
    }

    .query-actions {
      white-space: nowrap;
    }
  }

  .table-container {
    margin-bottom: 15px;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 15px 0;
    border-top: 1px solid #ebeef5;
  }

  .order-invalidate-btn {
    color: #f56c6c;
    &:hover:not(.is-disabled) {
      color: #f78989;
    }
    &.is-disabled {
      color: #c0c4cc;
    }
  }
}

.edit-form-body {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
