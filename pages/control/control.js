// pages/control/control.js
Page({

  data: {
    deviceId: '',
    writechr: [],
    writesev: [],
    userInput: '',
    showPopup: false,
    //判断是修改名称还是修改mac地址
    status: null,
    terminalmode: ['无确认重发模式', '有确认重发模式'],
  },

  onLoad(options) {
    var that = this
    that.data.deviceId = wx.getStorageSync('BleDeviceId');
    that.data.writechr = wx.getStorageSync('writeCharacteristicId');
    that.data.writesev = wx.getStorageSync('writeserviceId');
    // 创建自定义弹出层组件
    this.popup = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease'
    });
  },
  onbutton: function (event) {
    this.data.status = Number(event.currentTarget.dataset.param);
    console.log(this.data.status);
    this.setData({
      showPopup: true
    });

    this.popup.translateY(-100).step();
    this.setData({
      popup: this.popup.export()
    });
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
      userInput: e.detail.value
    });
  },
  confirmInput: function () {
    // 点击确认后的操作
    var that = this
    console.log('输入的内容是：', that.data.userInput);
    if (that.data.status == 1) {
      wx.showModal({
        title: '提示',
        content: '您确定要更改设备mac地址吗？这将在重启设备后生效',
        success(res) {
          if (res.confirm) {
            var inputValue = Number(that.data.userInput);
            if (!isNaN(inputValue) && inputValue >= 0xA98AC7 && inputValue <= 0xFFFFFFFF) {
              const dataToSend = new ArrayBuffer(4);
              const dataView = new DataView(dataToSend);
              dataView.setUint32(0, inputValue, true);
              that.onConfirm(dataToSend, that.data.writesev[0], that.data.writechr[2]);
            } else {
              wx.showToast({
                title: '请输入0到4294967295之间的数字',
                icon: 'none',
                duration: 2000
              });
            }
          } else if (res.cancel) {
          }
        }
      });
      this.hideInputPopup(); // 隐藏弹出层
    }
    if (that.data.status == 2) {
      var str = that.data.userInput; 
      var buffer = new ArrayBuffer(str.length * 2); 
      var view = new DataView(buffer);
      for (var i = 0; i < str.length; i++) {
        view.setUint16(i * 2, str.charCodeAt(i), true); 
      }
      this.onConfirm(buffer, that.data.writesev[0], that.data.writechr[1]);
      this.hideInputPopup(); // 隐藏弹出层
    }
  },
  //重启终端
  restart: function () {
    var that = this
    wx.showModal({
      title: '提示',
      content: '您确定要重启终端吗？这将使您断开连接',
      success(res) {
        if (res.confirm) {
          console.log('确定');
          const dataToSend = new ArrayBuffer(2);
          const dataView = new DataView(dataToSend);
          dataView.setUint16(0, 1, true);
          that.onConfirm(dataToSend, that.data.writesev[0], that.data.writechr[3]);
        } else if (res.cancel) {
          console.log('取消');
        }
      }
    });
  },
  /*************断开连接按钮的回调函数***************/
  closeBLEConnection: function (e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '您确定要断开连接吗？',
      success(res) {
        if (res.confirm) {
          wx.closeBLEConnection({
            deviceId: that.data.deviceId,
            success(res) {
              console.log('断开连接成功');
              console.log(res);
              wx.showToast({
                title: '已断开蓝牙连接',
                icon: 'success',// 图标类型，可选值：success、loading、none
                duration: 2000,// 提示框显示时间，单位毫秒，默认2000ms
                mask: true  // 是否显示透明蒙层，防止触摸穿透，默认false
              });
            }, fail(res) {
              console.log('断开连接失败');
            }
          });
          console.log('确定');
        } else if (res.cancel) {
          console.log('取消');
        }
      }
    });

  },

  /* 改变终端模式的回调函数 */
  Change_terminalmode: function (e) {
    var that = this
    wx.showActionSheet({
      itemList: that.data.terminalmode,
      success: function (res) {
        const dataToSend = new ArrayBuffer(2);
        const dataView = new DataView(dataToSend);
        if (res.tapIndex == 0) {
          dataView.setUint16(0, 0, true);
          console.log(res.tapIndex);
        }
        if (res.tapIndex == 1) {
          console.log(res.tapIndex);
          dataView.setUint16(0, 1, true);
        }
        that.onConfirm(dataToSend, that.data.writesev[0], that.data.writechr[0]);
        wx.showToast({
          title: '更改成功',
          icon: 'success',// 图标类s型，可选值：success、loading、none
          duration: 2000,// 提示框显示时间，单位毫秒，默认2000ms
          mask: true  // 是否显示透明蒙层，防止触摸穿透，默认false
        })
      },
      fail: function (res) {
        console.log(res.errMsg);
      }
    });
  },

  onConfirm: function (buffer, parm1, parm2) {
    var that = this
    // 发送数据
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
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
        console.log('写入失败');
        console.log(res.errMsg);
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
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const deviceIdData = wx.getStorageSync('deviceIdData')
    this.setData({
      deviceId: deviceIdData
    })
    console.log(this.data.deviceId)
  },
})