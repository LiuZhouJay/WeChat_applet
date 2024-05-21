// pages/background/background.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTime: '',

    readchr: [],  //筛选支持不同属性的服务与特征值
    readsev: [],
    notifychr: [],
    notifysev: [],
    writechr: [],
    writesev: [],

    multiArraywrite: [],// 用于picker的多列数据
    multiArraynotify: [],
    multiArrayread: [],

    macaddr: null, //保存连接设备的mac地址和name
    devicename: null,

    userInput: '',

    writetargetsev: '',
    writetargetchr: '',

    notifyvalue: null,

    //读取、写入、通知的数据
    Arrays: []
  },
  onLoad: function () {
    var that = this;
    setInterval(function () {
      var now = new Date();
      // 使用Intl.DateTimeFormat来格式化日期和时间
      // var formatter = new Intl.DateTimeFormat('zh-CN', {
      //   year: 'numeric', month: '2-digit', day: '2-digit',
      //   hour: '2-digit', minute: '2-digit', second: '2-digit',
      //   hour12: false // 如果需要12小时制，可以设置为true
      // });
      that.data.readchr = wx.getStorageSync('readCharacteristicId');
      that.data.readsev = wx.getStorageSync('readserviceId');
      that.data.notifychr = wx.getStorageSync('notifyCharacteristicId');
      that.data.notifysev = wx.getStorageSync('notifyserviceId');
      that.data.writechr = wx.getStorageSync('writeCharacteristicId');
      that.data.writesev = wx.getStorageSync('writeserviceId');
      that.data.macaddr = wx.getStorageSync('BleDeviceId');
      that.data.devicename = wx.getStorageSync('Devicename');

      that.popup = wx.createAnimation({
        duration: 200,
        timingFunction: 'ease'
      });
      that.setData({
        // currentTime: formatter.format(now),
        macaddr: that.data.macaddr,
        devicename: that.data.devicename,
        multiArraywrite: [
          that.data.writesev.map(service => [service]), // 创建服务列表的列
          that.data.writechr.map(characteristic => [characteristic]) // 创建特征值列表的列
        ],
        multiArrayread: [
          that.data.readsev.map(service => [service]), // 创建服务列表的列
          that.data.readchr.map(characteristic => [characteristic]) // 创建特征值列表的列
        ],
        multiArraynotify: [
          that.data.notifysev.map(service => [service]), // 创建服务列表的列
          that.data.notifychr.map(characteristic => [characteristic]) // 创建特征值列表的列
        ]
      });
      wx.onBLECharacteristicValueChange((res) => {
        if (res.characteristicId == that.data.readchr[0]) {
          console.log(res.characteristicId);
          wx.setStorageSync('readvlaue', that.ab2hex(res.value))
        }
        if (res.characteristicId == that.data.notifychr[0]) {
          console.log(res.characteristicId);
          that.setData({
            notifyvalue: that.ab2hex(res.value)
          })
        }
        console.log(that.ab2hex(res.value));
      })
    }, 1000);

  },

  onwrite: function (e) {
    var that = this
    that.data.writetargetsev = that.data.writesev[e.detail.value[0]];
    that.data.writetargetchr = that.data.writechr[e.detail.value[1]];
    this.setData({
      showPopup: true
    });
    this.popup.translateY(-150).step();
    this.setData({
      popup: this.popup.export()
    });
  },
  onnotify: function () {
  },
  confirmInput: function () {
    // 用户点击确认后的操作
    const PreviousArray = this.data.Arrays
    const Array = { read: null, write: null }
    const data = {}
    console.log('userInput');
    console.log(this.data.userInput)

    Array['write'] = this.data.userInput
    console.log('Array')
    console.log(Array)
    console.log('PreviousArray.length')
    console.log(PreviousArray.length)
    console.log('PreviousArray')
    console.log(PreviousArray)
    data[`Arrays[${PreviousArray.length}]`] = Array
    console.log('data')
    console.log(data)
    this.setData(data)
    console.log('latter')
    console.log(this.data.Arrays)

    var str = this.data.userInput; // 获取用户输入的字符串
    var buffer = new ArrayBuffer(str.length * 2); // 假设使用UTF-16编码，每个字符2字节
    var view = new DataView(buffer);
    for (var i = 0; i < str.length; i++) {
      view.setUint16(i * 2, str.charCodeAt(i), true); // 使用小端序
    }
    this.onConfirm(buffer, this.data.writetargetsev, this.data.writetargetchr);
    this.hideInputPopup(); // 隐藏弹出层
  },
  hideInputPopup: function () {
    // 隐藏弹出层
    this.setData({
      showPopup: false
    });
    // 动画效果，使得弹出层平滑隐藏
    this.popup.translateY(0).step();
  },
  inputContent: function (e) {
    // 更新输入的内容
    this.setData({
      userInput: e.detail.value,
      'Array.write': e.detail.value
    });
    console.log(this.data.Array)
  },
  onConfirm: function (buffer, parm1, parm2) {
    var that = this
    // 发送数据
    wx.writeBLECharacteristicValue({
      deviceId: that.data.macaddr,
      serviceId: parm1, // 服务UUID
      characteristicId: parm2, // 特征值UUID
      value: buffer,
      success: function (res) {
        console.log('写入成功');
        wx.showModal({
          title: '写入成功',
          content: null,
          confirmColor: '#00b6b5',
          showCancel: false,
          success(res) { }
        })
      },
      fail: function (res) {
        console.log(res.errCode);
        wx.showToast({
          title: '写入失败，请检查蓝牙连接是否正常',
          icon: 'none',// 图标类s型，可选值：success、loading、none
          duration: 2000,// 提示框显示时间，单位毫秒，默认2000ms
          mask: true  // 是否显示透明蒙层，防止触摸穿透，默认false
        })
      },
    });
  },

  //读取数据
  onread: function (e) {
    var that = this
    var targetsev = that.data.readsev[e.detail.value[0]];
    var targetchr = that.data.readchr[e.detail.value[0]];
    wx.showLoading({
      title: '读取中',
    })
    wx.readBLECharacteristicValue({
      deviceId: that.data.macaddr,
      serviceId: targetsev,
      characteristicId: targetchr,
      success: (res) => {
        wx.hideLoading();
        console.log("readreadread");
        setTimeout(function () {
          that.data.readvlaue = wx.getStorageSync('readvlaue');
          const PreviousArray = that.data.Arrays
          const Array = { read: null, write: null }
          const data = {}
          console.log('readvlaue')
          console.log(that.data.readvlaue)
          Array['read'] = that.data.readvlaue
          console.log('Array')
          console.log(Array)
          console.log('PreviousArray.length')
          console.log(PreviousArray.length)
          console.log('PreviousArray')
          console.log(PreviousArray)
          data[`Arrays[${PreviousArray.length}]`] = Array
          console.log('data')
          console.log(data)
          that.setData(data)
          console.log('latter')
          console.log(that.data.Arrays)
          that.setData({
            Arrays: that.data.Arrays,
          })

          wx.showModal({
            title: '读取成功',
            content: that.data.readvlaue,
            confirmColor: '#00b6b5',
            showCancel: false,
            success(res) {
              //将读取到的数据展示到页面上
            }
          })
        }, 1000);
      },
      fail: (res) => {
        wx.hideLoading();
        wx.showToast({
          title: '读取失败，请检查蓝牙连接是否正常',
          icon: 'none',// 图标类s型，可选值：success、loading、none
          duration: 2000,// 提示框显示时间，单位毫秒，默认2000ms
          mask: true  // 是否显示透明蒙层，防止触摸穿透，默认false
        })
      }
    })
  },
  onnotify: function (e) {
    var that = this
    wx.showToast({
      title: '正在接收通知',
      icon: 'success',
      duration: 1000
    })
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      deviceId: that.data.macaddr,
      serviceId: that.data.notifysev[0],
      characteristicId: that.data.notifychr[0],
      success(res) {
        console.log('notifyBLECharacteristicValueChange success', res.errMsg)
      }
    })
  },
  ab2hex(buffer) {
    var str = '';
    var view = new Uint8Array(buffer);
    for (var i = 0; i < view.length; i++) {
      str += String.fromCharCode(view[i]);
    }
    return str;
  },
})