<template>
  <div class="login">
    <div class="login-left">
      <img src="./img/imgs_register.png" alt="免费注册" />
    </div>
    <div class="login-right">
      <div class="login-right-top">
        <div class="login-right-top-left"></div>
        <div class="login-right-top-min" style="z-index: 12" @click="minWindow">
          <el-icon style="font-size: 18px; font-weight: 600"><Minus /></el-icon>
        </div>
        <div
          class="login-right-top-close"
          style="z-index: 12"
          @click="closewindow"
        >
          <el-icon style="font-size: 18px; font-weight: 600"><Close /></el-icon>
        </div>
      </div>
      <div class="login-right-down">
        <p class="title">智能分拣系统</p>
        <p class="intro">
          欢迎使用智能分拣系统。简洁、易用的操作页面，全自动化管理全力帮助您提高效率。
        </p>
        <div class="login-form">
          <el-input
            placeholder="请输入用户名"
            class="user-code"
            spellcheck="false"
            v-model="userCode"
            @keyup.enter="login"
          ></el-input>
          <el-input
            placeholder="请输入密码"
            class="user-password"
            type="password"
            v-model="userPassword"
            spellcheck="false"
            show-password
            @keyup.enter="login"
          ></el-input>
          <p class="tips">忘记密码请联系管理员</p>
          <el-button
            class="user-login-button"
            type="primary"
            @click="login"
            :loading="loadingStatus"
            >立即登录</el-button
          >
        </div>
      </div>
    </div>
    <transition name="fade">
      <div class="zz-spin" v-show="!javaAppStarted">
        <div id="loader" class="loadloding">
          <div></div>
        </div>
        <div id="lodtext">{{ startupMessage }}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import HttpUtil from '@/utils/HttpUtil';
import axios from 'axios';
const remote = require('electron').remote;
export default {
  name: 'Login',
  components: {},
  props: {},
  data() {
    return {
      userCode: '',
      userPassword: '',
      loadingStatus: false,
      javaAppStarted: false,
      javaAppUrl: process.env.VUE_APP_BASE_URL + '/status/check',
      maxRetries: 60,
      retryInterval: 500,
      startupMessage: '系统正在启动中... 请稍后...'
    };
  },
  watch: {},
  computed: {},
  methods: {
    login() {
      this.loadingStatus = true;
      // 将账号密码传递后台，判断密码是否正确
      const param = {
        userCode: this.userCode,
        userPassword: this.userPassword
      };
      HttpUtil.post('/login/login', param)
        .then((res) => {
          if (res.data) {
            remote.getGlobal('sharedObject').userInfo = res.data;
            // 根据用户角色跳转不同页面
            setTimeout(() => {
              this.loadingStatus = false;
              // 跳转主页
              this.$nextTick(() => {
                this.$router.replace({
                  path: '/homePage/welcomPage',
                  query: { userRole: res.data.userRole }
                });
              });
            }, 2000);
          } else {
            this.$message.error(res.message);
            this.loadingStatus = false;
          }
        })
        .catch((err) => {
          this.$message.error(err);
          this.loadingStatus = false;
        });
    },
    closewindow() {
      ipcRenderer.send('close-window');
    },
    minWindow() {
      ipcRenderer.send('min-window');
    },
    checkJavaAppStatus(retries = 0) {
      // 更新启动提示信息，让用户知道正在进行中
      const progress = Math.min(
        Math.round((retries / this.maxRetries) * 100),
        99
      );
      this.startupMessage = `系统服务启动中... ${progress}%`;

      axios
        .get(this.javaAppUrl, { timeout: 3000 })
        .then((response) => {
          console.log(response);
          if (response.data === 'OK') {
            this.javaAppStarted = true;
            this.startupMessage = '系统服务已启动！';
            // 给主进程发消息，启动PLC连接
            ipcRenderer.send('conPLC');
          } else {
            this.scheduleRetry(retries, '服务响应异常');
          }
        })
        .catch((error) => {
          const reason =
            error.code === 'ECONNREFUSED' ? '服务启动中' : '网络连接中';
          this.scheduleRetry(retries, reason);
        });
    },
    scheduleRetry(retries, reason) {
      if (retries < this.maxRetries) {
        setTimeout(
          () => this.checkJavaAppStatus(retries + 1),
          this.retryInterval
        );
      } else {
        this.startupMessage = '系统服务启动较慢，请耐心等待...';
        // 超时时继续尝试，不再限制次数，但降低轮询频率
        setTimeout(() => this.checkJavaAppStatus(retries + 1), 2000);
      }
    }
  },
  created() {
    // ipcRenderer.send('logStatus','logout');
  },
  mounted() {
    if (!this.javaAppStarted) {
      this.checkJavaAppStatus();
    }
  }
};
</script>
<style lang="less" scoped>
.login {
  width: 100%;
  height: 100%;
  display: flex;
  &-left {
    pointer-events: none;
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fbfcfd;
    img {
      width: 690px;
      height: 546px;
    }
  }
  &-right {
    width: calc(100% - 690px);
    height: 100%;
    padding-left: 28px;
    &-top {
      height: 45px;
      width: 100%;
      display: flex;
      &-left {
        flex: 1;
        height: 100%;
        -webkit-app-region: drag;
        line-height: 45px;
        text-align: left;
        padding-left: 10px;
        font-size: 13px;
        font-weight: 600;
      }
      &-min,
      &-close,
      &-max {
        height: 100%;
        width: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        -webkit-app-region: no-drag;
      }
      &-min:hover,
      &-max:hover {
        background-color: #eeeeee;
      }
      &-close:hover {
        background-color: #f8635f;
        color: #fff;
      }
    }
    &-down {
      width: 100%;
      margin-top: 75px;
      .title {
        font-weight: 400;
        font-size: 32px;
        line-height: 25px;
        color: #262626;
      }
      .intro {
        width: 332px;
        font-weight: 400;
        font-size: 12px;
        line-height: 18px;
        color: #8c8c8c;
        margin-top: -15px;
        span {
          color: #4385ff;
          cursor: pointer;
        }
      }
      .login-form {
        padding: 20px 30px 20px 0px;
        // Element Plus 边框在 .el-input__wrapper 上，间距需写在组件根元素，写在 inner 上会撞高边框
        .user-code {
          margin-bottom: 30px;
        }
        .user-password {
          margin-bottom: 2px;
        }
        :deep(.user-code) {
          .el-input__inner {
            height: 45px;
            font-size: 14px !important;
            color: #000;
          }
        }
        :deep(.user-password) {
          .el-input__inner {
            height: 45px;
            font-size: 14px !important;
            color: #000;
          }
        }
        .user-login-button {
          height: 43px;
          border-radius: 2px;
          font-size: 16px;
          width: 100%;
        }
        .tips {
          font-weight: 400;
          font-size: 12px;
          line-height: 18px;
          color: #8c8c8c;
          margin-bottom: 36px;
          span {
            color: #4385ff;
            cursor: pointer;
          }
        }
      }
    }
  }
  .loadloding {
    position: fixed;
    top: 45%;
    left: 50%;
    margin-top: -25px;
    margin-left: -25px;
    width: 50px;
    height: 50px;
    display: block;
    color: #1890ff;
    z-index: 11;
  }
  .loadloding > div {
    display: inline-block;
    float: none;
    background-color: currentColor;
    border: 0 solid currentColor;
  }
  #lodtext {
    font-size: 18px;
    position: fixed;
    top: 50%;
    left: 50%;
    margin-top: 40px;
    margin-left: -100px;
    width: 220px;
    height: 30px;
    z-index: 11;
    font-weight: 600;
  }
  .loadloding > div {
    width: 100%;
    height: 100%;
    border-radius: 0;
    animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
  }
  @keyframes square-spin {
    0% {
      transform: perspective(100px) rotateX(0) rotateY(0);
    }
    25% {
      transform: perspective(100px) rotateX(180deg) rotateY(0);
    }
    50% {
      transform: perspective(100px) rotateX(180deg) rotateY(180deg);
    }
    75% {
      transform: perspective(100px) rotateX(0) rotateY(180deg);
    }
    100% {
      transform: perspective(100px) rotateX(0) rotateY(360deg);
    }
  }
  .zz-spin {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 4;
    width: 100%;
    height: 100%;
    opacity: 0.9;
    pointer-events: auto;
    background: #fff;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 1s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
