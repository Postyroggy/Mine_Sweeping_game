const electron = require('electron')
// 应用的生命周期
const app = electron.app
// 创建原生浏览器窗口的模块
const BrowserWindow = electron.BrowserWindow // 创建并控制浏览器窗口。 
const dialog = electron.dialog //对话框!
const globalShortcut = electron.globalShortcut //向操作系统注册/注销全局键盘快捷方式，以便您可以自定义各种快捷方式的操作。

let mainWindow

function createWindow () {
  // 创建并控制浏览器窗口。
  mainWindow = new BrowserWindow({
    width: 500,
    height: 550,
    resizable: false, //更改窗口是否可调

    // fullscreen: true, (全屏?)
    autoHideMenuBar: true, //隐藏菜单栏
    darkTheme: true,//黑暗模式主题

    skipTaskbar: false
  })

  // 从index.html加载app
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // 打开调试工具Dev-tools
  // mainWindow.webContents.openDevTools()

  // APP关闭时执行操作
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  let Cheat = false //游戏作弊与否
  //                        全局快捷键                callback
  globalShortcut.register('CommandOrControl+Alt+c', function () {
    //定义作弊快捷键:
    Cheat = !Cheat
    let message = "居然被你发现了!"
    let detail = "作弊器开启"
    if (!Cheat) {
      message = "溜了溜了,安心玩游戏"
      detail = "作弊器关闭"
    }

    dialog.showMessageBox({
      type: 'info',
      message: message,
      detail: detail,
      buttons: ['确认!'],
      title:"啊,这"
    })

    mainWindow.webContents.send('toggleDemo', Cheat);
  });
}

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
// 这个方法就被调用
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
  // 这个方法就被调用
  if (mainWindow === null) {
    // 创建浏览器窗口。
    createWindow()
  }
  // 打开开发工具
  // mainWindow.openDevTools(); 先关闭,如果调试,你可以自行打开
})
