const electron = require('electron')
const ipc = electron.ipcRenderer //渲染器

let blockNum = [10, 16] //正方形边框的cell数量10*10或者16*16
let mineNum = [12, 40] //炸弹的数量10*10==>12个(12.000%)|16*16==>40个(15.625%)
let level = 0 //初始难度(简单)
let time = 0 //初始计时0
let boom = [] //存储炸弹的数组
let game_status = false //游戏开始

let color = ["", "#99CCFF", "#CCCC33", "#0099CC", "#3366CC", "#336699", "#336666", "#336666", "#336666"]

let getRandomNum = function (boom) {
  // 生产随机炸弹                         10 | 16               10 | 16
  let selected_num = parseInt(Math.random() * blockNum[level] * blockNum[level]) //Math.random->[0,1)
  //parseInt不传radix参数默认string->num(取整数)
  if (boom.indexOf(selected_num) > -1) //如果找到了
    return getRandomNum(boom) //递归再次随机
  return selected_num
}
//作弊器开始!
let toggleDemo = function (status_switch) {
  if (status_switch + "" == "true") { //转化为字符串
    for (let i = 0; i < boom.length; i++) {
      $("[data-index=" + boom[i] + "]").css({
        color: "#DC143C" //标志出炸弹的位置
      })
    }
  } else {
    for (let i = 0; i < boom.length; i++) {
      $("[data-index=" + boom[i] + "]").css({
        color: "#483D8B"
      })
    }
  }
}

ipc.on('toggleDemo', function (event, message) {
  // console.log(message);
  toggleDemo(message)
});
//作弊器结束


//游戏本体算法开始:
$(function () {
  let box = $("#box")
  let timeElem = $("#time")
  timer = {}                    //空object
  let initailze = function () { //初始化数据;
    game_status = false
    box.html("")
    boom = []
    time = 0

    /* console.log(level); // 打印难度等级 */

    if (level == 1) {  /* 切换难度等级(css)*/
      box.addClass("mibble")
    } else {
      box.removeClass("mibble")
    }

    clearInterval(timer) //timer全局变量 (控制计时的)
    timeElem.removeClass("start").html("时间：0") //上述定义timeElem=#time

    buildCell(0, function () {
      setTimeout(function () {
        bindClickForCell() //绑定点击事件(函数定义在下面)
        for (let i = 0; i < mineNum[level]; i++) {
          boom.push(getRandomNum(boom)) //放置随机炸弹
        }
      }, 0)
    })
  }

  let buildCell = function (i, my_func) {
    if (i >= blockNum[level] * blockNum[level]) {
      if (my_func && my_func != null) {
        my_func()
      }
      return
    }

    let cell = $("<div class='cell' data-index='" + i + "'>O</div>")
    box.append(cell)

    doAnimate(cell, "zoomIn animated") //动画效果

    setTimeout(function () {
      buildCell(++i, my_func)
    }, 5)
  }

  let bindClickForCell = function () { //单击事件函数开始
      box.find(".cell").mousedown(function (any) {

      let my_this = $(this)

      if (!timeElem.hasClass("start")) {
        timeElem.addClass("start")
        timer = setInterval(function () {
          time = parseFloat((time + 0.1).toFixed(1))
          timeElem.html("时间：" + time)
        }, 100)
      }

      if (3 == any.which) {
        //3代表右键
        if (game_status || $(this).hasClass("open")) {
          return
        }
        let html = $(this).html()
        if (html == "○") {
          $(this).html("🚩").css({
            color: "#666"
          })
        } else {
          $(this).html("⭕").css({
            color: "#FF9966"
          })
        }
      } else if (1 == any.which) {
        // 1 代表左键
        sound("start_sound") //点开"无雷"时的声音
        if (game_status || my_this.hasClass("open")) {
          return
        }
        let i = parseInt(my_this.attr("data-index"))
        open(i)

      }

    })

  }
  //单击事件函数结束

  $("#start").off("click").on("click", function () { //"开始"按钮初始化
    initailze()
  })

  $("#setting").off("click").on("click", function () { //"简单/困难模式切换"
    if (level == 0) {
      level = 1
      $(this).html("困难模式")
    } else {
      level = 0
      $(this).html("简单模式")
    }
    initailze() //重置游戏
  })

  let open = function (i) {
    let cell = $("[data-index=" + i + "]")
    if (cell.hasClass("open")) {
      return
    }
    if (isBoom(i)) {
      return lose(i)
    }

    doAnimate(cell, "jello animated") //动画果冻
    cell.addClass("open")

    let n = getBoomNum(i)
    if (n == 0) {
      cell.css({
        color: "#ddd"
      })

      setTimeout(function () {
        iterator(i, function (index) {
          open(index)
        })
      }, 20)
    } else {
      cell.html(n).css({
        color: color[n]
      })
    }
    if ($(".cell:not(.open)").length == mineNum[level]) {
      win()
    }
  }

  let getBoomNum = function (i) {
    let n = 0
    iterator(i, function (index) {
      if (isBoom(index)) {
        n++
      }
    })
    return n
  }

  let iterator = function (i, my_func) {
    let x = i % blockNum[level]
    let y = parseInt(i / blockNum[level])

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let n_x = x + i
        let n_y = y + j
        if (n_x < 0 || n_x > blockNum[level] - 1 || n_y < 0 || n_y > blockNum[level] - 1 || (i == 0 && j == 0)) {
          continue
        }
        let index = n_y * blockNum[level] + n_x
        my_func(index)
      }
    }
  }

  let isBoom = function (i) { //寻找这个格子是否为炸弹
    if (boom.indexOf(i) > -1) {
      return true
    }
    return false
  }

  let lose = function (i) {
    let index = boom[boom.indexOf(i)]
    boom.splice(index, 1)

    doBoom(index, function () { //炸弹被点到
      popup("Lose Game,游戏结束!")
    })

    clearInterval(timer)
    game_status = true
  }
  let win = function (i) {
    for (let i = 0; i < boom.length; i++) {
      $("[data-index=" + boom[i] + "]").html("🎉").css({
        color: "#666"
      }).addClass("zoomIn animated")
    }
    popup("你赢啦！耗时 " + time + "秒")
    sound("win")

    clearInterval(timer)
    game_status = true
  }

  let doBoom = function (index, my_func) {
    $("[data-index=" + index + "]").html("💣").addClass("Flippers animated boom")
    sound("boom")

    if (boom.length == 0) {
      if (my_func && my_func != null) {
        my_func()
      }
      return
    }
    setTimeout(function () {
      doBoom(boom.pop(), my_func)
    }, 100)
  }

  let doAnimate = function (cell, clazz) {
    cell.addClass(clazz)
    setTimeout(function () {
      cell.removeClass(clazz)
    }, 500) //时间延迟
  }

  window.sound = function (filename) { //声音函数()
    let game_sound = $("<audio src='sound/" + filename + ".wav' controls='controls' hidden='true'>")
    $(".sound").append(game_sound)
    setTimeout(function () {
      let audio = $(".sound audio:last")
      audio[0].play()

      setTimeout(function () {
        audio.remove()
      }, 1000)
    }, 0)
  }

  $('#test').avgrund({
    height: 130,
    width: 400,
    holderClass: 'custom',
    showClose: true,
    showCloseText: '朕已阅',
    onBlurContainer: '.container',
    template: $(".popup")
  })

  let popup = function (msg) {
    $('#test').click()
    $(".popup").find("h2").html(msg)
  }

  initailze()
})