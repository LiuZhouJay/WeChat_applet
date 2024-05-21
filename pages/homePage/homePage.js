// pages/homePage/homePage.js
function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    connected: false,
    click: false,
    chs: [],
    index: 0,
    nameDevices: [],
    priceUrl: ["cloud://cloud1-6gc5dqf578ae6166.636c-cloud1-6gc5dqf578ae6166-1324760850/assets/img/qq_group.jpg"],
    // 筛选支持相应属性的特征值id
    readchar: [],
    writechar: [],
    notifychar: [],
    // 筛选支持相应属性的服务id
    readsev: [],
    writesev: [],
    notifysev: [],
  },
  onLoad(options) {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      }
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery({
      success(res) {
        console.log("stopBluetoothDevicesDiscovery sucess")
      }
    })
  },
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        //经过inArray判断之后，若相等返回相等的位置值；若不相等，则返回-1，代表传递信息为不相等
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.setData(data)
        console.log('Found', device)
        console.log('Data')
        console.log(data)
        console.log('Devices')
        console.log(this.data.devices)
      })
    })
  },
  createBLEConnection(e) {
    this.stopBluetoothDevicesDiscovery()
    // 清除本地数据
    wx.clearStorage({
      success: function () {
        console.log('清除本地存储成功');
      },
      fail: function () {
        console.log('清除本地存储失败');
      }
    });
    const ds = e.currentTarget.dataset
    const deviceId = ds.deviceId
    const name = ds.name
    const sc = ds.advertisServiceUUIDs
    wx.setStorageSync('BleDeviceId', deviceId)
    wx.setStorageSync('Devicename', name)
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          connected: true,
          name,
          deviceId,
          sc,
        })
        console.log('createBLEConnection success', this.data.deviceId)
        this.getBLEDeviceServices(deviceId)
      }
    })
  },
  closeBLEConnection() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  //获取蓝牙设备所有服务(service)。
  getBLEDeviceServices(deviceId) {
    var that = this
    console.log("进入服务");
    setTimeout(() => {
      wx.getBLEDeviceServices({
        deviceId: deviceId,
        success: (res) => {
          console.log('device services:', res)
          res.services.forEach((item) => {
            console.log('serviceId:', item.uuid)
            that.getBLEDeviceCharacteristics(deviceId, item.uuid)
          })
        }
      })
    }, 1000)
  },
  // 获取蓝牙特征值
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    var that = this
    console.log("进入特征");
    setTimeout(() => {
      wx.getBLEDeviceCharacteristics({
        deviceId: deviceId,
        serviceId: serviceId,
        success: (res) => {
          console.log(res)
          res.characteristics.forEach((item) => {
            if (item.properties.read) { that.data.readchar.push(item.uuid); that.data.readsev.push(serviceId); }
            if (item.properties.write) { that.data.writechar.push(item.uuid); that.data.writesev.push(serviceId); }
            if (item.properties.notify) { that.data.notifychar.push(item.uuid); that.data.notifysev.push(serviceId); }
            console.log('characteristicId:', item.uuid)
            // that.notifyBLECharacteristicValueChange(deviceId, serviceId,
            // that.readBLECharacteristicValue(deviceId, serviceId,
            //     item.uuid)
          })
          /* 保存数据 */
          wx.setStorageSync('readCharacteristicId', that.data.readchar)
          wx.setStorageSync('writeCharacteristicId', that.data.writechar)
          wx.setStorageSync('notifyCharacteristicId', that.data.notifychar)

          wx.setStorageSync('readserviceId', that.data.readsev)
          wx.setStorageSync('writeserviceId', that.data.writesev)
          wx.setStorageSync('notifyserviceId', that.data.notifysev)
        },
        fail: (res) => {
          console.log(res)
        }
      })
    }, 2000)
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
  onClickChange: function (e) {
    // this.setData({
    //   click = !click
    // })
    console.log('enter')
    //先停止
    this.stopBluetoothDevicesDiscovery()
    //再次重新搜索
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
    var that = this.data.click
    // this.data.click = !(this.data.click)
    this.setData({
      click: !that
    })
    console.log('click change success', this.data.click)
  },

  ab2hex(buffer) {
    var str = '';
    var view = new Uint8Array(buffer);
    for (var i = 0; i < view.length; i++) {
      str += String.fromCharCode(view[i]);
    }
    return str;
  },
  // 展示二维码
  join: function () {
    var imgUrl = this.data.priceUrl;
    console.log('imgClick success', imgUrl)
    wx.previewImage({
      urls: imgUrl,//imgUrl 必须是需要预览的图片链接列表，只有一张图片也需要是列表
      success: (res => {
        console.log('接口调用成功', res)
      })
    })
  },
  onInstruction: function () {
    wx.redirectTo({
      url: '/pages/instruction/instruction',
    })
  },
  enterWork: function () {
    wx.setStorageSync('deviceIdData', this.data.deviceId)
    wx.switchTab({
      url: '/pages/control/control',
    })
  },
  onScanCode: function () {
    var that = this
    wx.scanCode({
      success: function (res) {
        console.log(res.result);
        let scanResult = res.result;
        let deviceId = [];
        let name = [];
        let segmenSize = 4;
        //处理数据，将“addr：”后的数据放在deviceId中，将“name：”后的数据放在name中
        //因此需要规定二维码传进来的数据格式为——addr：内容name：内容（ps.name必须需要放在最后一个）
        for (let index = 0; index < scanResult.length; index++) {
          let segment = scanResult.slice(index, index + segmenSize);
          if (segment == 'addr') {
            deviceId = scanResult.slice(index + segmenSize + 1, index + segmenSize + 18)
          }
          else if (segment == 'name') {
            name = scanResult.slice(index + segmenSize + 1)
          }
        }
        //检验数据处理是否成功
        console.log(deviceId)
        console.log(name)
        // //先断开连接
        // wx.closeBLEConnection({
        //   deviceId: that.data.deviceId
        // })

        //根据处理后的数据进行蓝牙连接
        wx.createBLEConnection({
          deviceId,
          success: (res) => {
            console.log('createBLEConnection success', that.data.deviceId)
            that.setData({
              connected: true,
              name,
              deviceId,
            })
            console.log('createBLEConnection success', that.data.deviceId)
            that.getBLEDeviceServices(deviceId)
          },
          complete(res) {
            console.log('enter this function')
          },
          fail(res) {
            console.log('conection fail')
          }
        })
      }
    })
  }
})
