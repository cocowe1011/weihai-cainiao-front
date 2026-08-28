<template>
  <div class="homePage">
    <div class="app-shell">
      <!-- 顶部标题栏 -->
      <header class="title-bar">
        <div class="title-bar-drag" @dblclick="maxWindow">
          <img
            src="../../../build/icons/64x64.png"
            class="title-bar-logo"
            alt="logo"
          />
          <div class="title-bar-text">
            <span class="title-bar-name">码垛智能分拣系统</span>
            <!-- <span class="title-bar-sub">weight-records</span> -->
          </div>
        </div>
        <div class="title-bar-actions">
          <span class="version-tag">V1.1.0</span>
          <div class="win-btn" @click="minWindow">
            <el-icon><Minus /></el-icon>
          </div>
          <div class="win-btn" @click="maxWindow">
            <el-icon>
              <component
                :is="
                  windowSize === 'unmax-window' ? 'FullScreen' : 'CopyDocument'
                "
              />
            </el-icon>
          </div>
          <div
            class="win-btn win-btn--close"
            @click="closewindow"
            v-if="userRole === 'ADMIN'"
          >
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </header>

      <div class="app-body">
        <!-- 微信式左侧导航栏 -->
        <aside class="side-nav">
          <nav class="side-nav-menu">
            <div
              v-for="item in navItems"
              :key="item.index"
              class="nav-item"
              :class="{ 'is-active': activeIndex === item.index }"
              @click="handleSelect(item.index)"
            >
              <div class="nav-item-icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
              <span class="nav-item-label">{{ item.label }}</span>
            </div>
          </nav>

          <div class="side-nav-footer">
            <el-dropdown trigger="click" placement="top" @command="setCommand">
              <div class="footer-btn" title="设置">
                <el-icon><Setting /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item icon="FullScreen" command="full_screen">
                    全屏/取消全屏&nbsp;&nbsp;Ctrl+F11
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown
              trigger="click"
              placement="top"
              @command="handelCommand"
            >
              <div class="footer-avatar">
                <el-avatar
                  :src="require('./img/header.png')"
                  :size="32"
                ></el-avatar>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    icon="Key"
                    command="updatePassword"
                    v-if="userRole !== 'ADMIN'"
                    >修改密码</el-dropdown-item
                  >
                  <el-dropdown-item
                    icon="Upload"
                    command="logout"
                    v-if="userRole === 'ADMIN'"
                    >退出登录</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </aside>

        <!-- 主内容区 -->
        <main class="main-panel">
          <StatusMonitor></StatusMonitor>
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </main>
      </div>
    </div>

    <el-dialog
      title="修改密码"
      v-model="dialogFormVisible"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form :model="updatePasswordForm">
        <el-form-item label="请输入新密码" label-width="120px">
          <el-input
            v-model="updatePasswordForm.newPassword"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item label="确定密码" label-width="120px">
          <el-input
            v-model="updatePasswordForm.newPasswordAgain"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelUpdatePassword">取 消</el-button>
          <el-button type="primary" @click="updatePasswordMethod"
            >确 定</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import StatusMonitor from '@/components/StatusMonitoring.vue';
import HttpUtil from '@/utils/HttpUtil';
const remote = require('electron').remote;
export default {
  name: 'HomePage',
  components: {
    StatusMonitor
  },
  props: {},
  data() {
    return {
      activeIndex: '1',
      windowSize: 'max-window',
      showLogout: true,
      dialogFormVisible: false,
      updatePasswordForm: {
        newPassword: '',
        newPasswordAgain: ''
      },
      userRole: ''
    };
  },
  computed: {
    navItems() {
      const items = [
        { index: '1', label: '首页', icon: 'HomeFilled' },
        { index: '2', label: '业务', icon: 'Operation' },
        {
          index: '3',
          label: '用户',
          icon: 'UserFilled',
          isAdminShow: true
        },
        { index: '5', label: '关于', icon: 'InfoFilled' }
      ];
      return items.filter(
        (item) => !item.isAdminShow || this.userRole === 'ADMIN'
      );
    }
  },
  watch: {},
  methods: {
    handleSelect(key, keyPath) {
      this.activeIndex = key;
      switch (key) {
        // welcomPage
        case '1':
          this.$nextTick(() => {
            if (this.$route.path !== '/homePage/welcomPage') {
              this.$router.replace({
                path: '/homePage/welcomPage'
              });
            }
          });
          break;
        case '2':
          this.$nextTick(() => {
            if (this.$route.path !== '/homePage/MainPage') {
              this.$router.replace({
                path: '/homePage/MainPage'
              });
            }
          });
          break;
        case '3':
          this.$nextTick(() => {
            if (this.$route.path !== '/homePage/userManagement') {
              this.$router.replace({
                path: '/homePage/userManagement'
              });
            }
          });
          break;
        case '5':
          this.$nextTick(() => {
            if (this.$route.path !== '/homePage/aboutPage') {
              this.$router.replace({
                path: '/homePage/aboutPage'
              });
            }
          });
          break;
        default:
          break;
      }
    },
    closewindow() {
      // 检查用户权限，只有管理员可以关闭系统
      if (this.userRole !== 'ADMIN') {
        this.$message.warning('操作员权限不足，无法关闭系统！');
        return;
      }
      ipcRenderer.send('close-window');
    },
    minWindow() {
      ipcRenderer.send('min-window');
    },
    maxWindow() {
      this.windowSize =
        this.windowSize === 'unmax-window' ? 'max-window' : 'unmax-window';
      ipcRenderer.send('max-window', this.windowSize);
    },
    fullScreen() {
      ipcRenderer.send('full_screen');
    },
    logoutMethod() {
      this.$nextTick(() => {
        this.$router.replace({
          path: '/'
        });
      });
      this.$nextTick(() => {
        ipcRenderer.send('logStatus', 'logout');
      });
    },
    handelCommand(command) {
      switch (command) {
        case 'logout':
          // 检查用户权限，只有管理员可以退出登录
          if (this.userRole !== 'ADMIN') {
            this.$message.warning('操作员权限不足，无法退出登录！');
            return;
          }
          this.$notify({
            title: '已退出登录！',
            message: '退出登录！',
            type: 'success',
            duration: 2000
          });
          this.logoutMethod();
          break;
        case 'updatePassword':
          this.$prompt('请输入注册账号时保存的姓名：', '敏感操作！验证用户！', {
            confirmButtonText: '验证',
            cancelButtonText: '取消'
          })
            .then(({ value }) => {
              // 验证姓名是否正确
              const param = {
                userName: value,
                userCode: remote.getGlobal('sharedObject').userInfo.userCode
              };
              HttpUtil.post('/userInfo/verifyName', param)
                .then((res) => {
                  if (res.data) {
                    this.$message.success('验证通过！');
                    // 打开修改密码的弹窗，可以修改密码
                    this.dialogFormVisible = true;
                  } else {
                    this.$message.error('验证未通过！');
                  }
                })
                .catch((err) => {
                  this.$message.error('验证未通过！请重试！');
                });
            })
            .catch(() => {
              this.$message({
                type: 'info',
                message: '取消验证！'
              });
            });
          break;
        default:
          break;
      }
    },
    setCommand(command) {
      console.log(command);
      switch (command) {
        case 'full_screen':
          this.fullScreen();
          break;
        default:
          break;
      }
    },
    changeIcon() {
      this.maxWinHandler = (e, status) => {
        this.windowSize = status;
      };
      ipcRenderer.on('mainWin-max', this.maxWinHandler);
    },
    cancelUpdatePassword() {
      this.dialogFormVisible = false;
      this.updatePasswordForm.newPassword = '';
      this.updatePasswordForm.newPasswordAgain = '';
    },
    updatePasswordMethod() {
      if (this.updatePasswordForm.newPassword == '') {
        this.$message.error('密码不可为空，请输入！');
        return false;
      }
      if (
        this.updatePasswordForm.newPassword !==
        this.updatePasswordForm.newPasswordAgain
      ) {
        this.$message.error('密码输入不一致，请重新输入！');
        return false;
      }
      const param = {
        userPassword: this.updatePasswordForm.newPassword,
        userCode: remote.getGlobal('sharedObject').userInfo.userCode
      };
      HttpUtil.post('/userInfo/updatePassword', param)
        .then((res) => {
          if (res.data > 0) {
            this.$notify({
              title: '修改成功！',
              message: '修改成功！请重新登陆！',
              type: 'success',
              duration: 2000
            });
            // 打开修改密码的弹窗，可以修改密码
            this.dialogFormVisible = false;
            this.logoutMethod();
          } else {
            this.$message.error('修改失败！');
          }
        })
        .catch((err) => {
          this.$message.error('修改失败！');
        });
    }
  },
  created() {
    // 给主进程发送消息，更改窗口大小，设置最小大小，默认全屏
    ipcRenderer.send('logStatus', 'login');
    this.changeIcon();
    // 获取用户角色
    this.userRole = remote.getGlobal('sharedObject').userInfo.userRole || '';
  },
  mounted() {},
  beforeUnmount() {
    // 清理窗口最大化状态监听器，防止重复注册
    if (this.maxWinHandler) {
      ipcRenderer.removeListener('mainWin-max', this.maxWinHandler);
      this.maxWinHandler = null;
    }
  }
};
</script>

<style lang="less" scoped>
.homePage {
  --hp-surface: #ffffff;
  --hp-surface-muted: #eef2f8;
  --hp-border: #d4deef;
  --hp-text: #262626;
  --hp-text-secondary: #8c8c8c;
  --hp-accent: #4385ff;
  --hp-accent-hover: #3e7bfa;
  --hp-accent-deep: #2f54eb;
  --hp-accent-bg: rgba(67, 133, 255, 0.1);
  --hp-accent-bg-active: rgba(67, 133, 255, 0.18);
  --hp-sidebar-width: 68px;
  --hp-titlebar-height: 38px;

  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e3e9f3 0%, #eef2f7 50%, #f5f7fa 100%);

  .app-shell {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── 顶部标题栏 ── */
  .title-bar {
    height: var(--hp-titlebar-height);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--hp-surface);
    border-bottom: 1px solid var(--hp-border);
    user-select: none;

    &-drag {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 12px;
      -webkit-app-region: drag;
      cursor: default;
    }

    &-logo {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    &-text {
      margin-left: 8px;
      display: flex;
      align-items: baseline;
      gap: 8px;
      overflow: hidden;
    }

    &-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--hp-text);
      white-space: nowrap;
    }

    &-sub {
      font-size: 11px;
      color: var(--hp-text-secondary);
      letter-spacing: 0.8px;
      white-space: nowrap;
    }

    &-actions {
      display: flex;
      align-items: center;
      -webkit-app-region: no-drag;
    }

    .version-tag {
      font-size: 11px;
      font-weight: 600;
      color: var(--hp-accent-deep);
      background: rgba(47, 84, 235, 0.06);
      padding: 2px 8px;
      border-radius: 10px;
      margin-right: 8px;
      letter-spacing: 0.5px;
    }

    .win-btn {
      width: 40px;
      height: var(--hp-titlebar-height);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--hp-text);
      font-size: 14px;
      transition: background 0.15s;

      &:hover {
        background: #eeeeee;
      }

      &--close:hover {
        background: #f8635f;
        color: #fff;
      }
    }
  }

  /* ── 主体区域 ── */
  .app-body {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  /* ── 微信式左侧导航 ── */
  .side-nav {
    width: var(--hp-sidebar-width);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--hp-surface);
    border-right: 1px solid var(--hp-border);
    user-select: none;

    &-menu {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0 8px;
      gap: 3px;
      overflow-y: auto;
    }

    &-footer {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      padding: 11px 0 14px;
      border-top: 1px solid var(--hp-border);
    }
  }

  .nav-item {
    width: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 9px 0 7px;
    border-radius: 9px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s, color 0.2s;

    &-icon {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 7px;
      font-size: 19px;
      color: var(--hp-text-secondary);
      transition: color 0.2s, background 0.2s;
    }

    &-label {
      font-size: 11px;
      color: var(--hp-text-secondary);
      line-height: 1;
      transition: color 0.2s;
    }

    &:hover {
      background: var(--hp-accent-bg);

      .nav-item-icon {
        color: var(--hp-accent);
      }

      .nav-item-label {
        color: var(--hp-accent-hover);
      }
    }

    &.is-active {
      background: var(--hp-accent-bg-active);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 26px;
        border-radius: 0 3px 3px 0;
        background: linear-gradient(180deg, #4572ef, #5ad4f6);
      }

      .nav-item-icon {
        color: var(--hp-accent);
        background: rgba(67, 133, 255, 0.12);
      }

      .nav-item-label {
        color: var(--hp-accent-deep);
        font-weight: 600;
      }
    }
  }

  .footer-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    cursor: pointer;
    font-size: 17px;
    color: var(--hp-text-secondary);
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: var(--hp-accent-bg);
      color: var(--hp-accent);
    }
  }

  .footer-avatar {
    cursor: pointer;
    border-radius: 8px;
    padding: 2px;
    transition: background 0.2s;

    &:hover {
      background: var(--hp-accent-bg);
    }
  }

  /* ── 主内容区 ── */
  .main-panel {
    flex: 1;
    min-width: 0;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
}
</style>
