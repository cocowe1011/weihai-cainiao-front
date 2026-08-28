const { defineConfig } = require('@vue/cli-service');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      overlay: {
        // ResizeObserver 循环警告为浏览器良性提示（Element Plus 组件内部大量使用），不弹错误遮罩
        runtimeErrors: (error) => {
          if (
            error.message === 'ResizeObserver loop limit exceeded' ||
            error.message.includes(
              'ResizeObserver loop completed with undelivered notifications'
            )
          ) {
            return false;
          }
          return true;
        }
      }
    }
  },
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        crypto: require.resolve('crypto-browserify')
      },
      alias: {
        '@': path.join(__dirname, 'src')
      }
    },
    plugins: [new NodePolyfillPlugin()]
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // mqtt@5 含可选链等现代语法，主进程 webpack 无法解析；外置后由 Node 直接 require
      externals: ['mqtt'],
      builderOptions: {
        productName: 'weihai-cainiao-front', //生成exe的名字
        appId: 'weihai-cainiao-front', //包名
        copyright: 'wl', //版权信息,
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: true, // 允许请求提升。若为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, //是否允许修改安装目录
          installerIcon: './build/icons/icon.ico', // 安装时图标
          uninstallerIcon: './build/icons/icon.ico', //卸载时图标
          installerHeaderIcon: './build/icons/icon.ico', // 安装时头部图标
          createDesktopShortcut: true, // 是否创建桌面图标
          createStartMenuShortcut: true, // 是否创建开始菜单图标
          shortcutName: '分拣系统', // 快捷方式名称
          runAfterFinish: false //是否安装完成后运行
        },
        win: {
          icon: 'build/icons/icon.ico', //图标路径
          target: [
            {
              target: 'nsis', //利用nsis制作安装程序
              arch: [
                'x64' //64位
                // "ia32" //32位
              ]
            }
          ]
        },
        asar: false
      }
    }
  }
});
