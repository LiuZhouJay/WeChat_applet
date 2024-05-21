// pages/welcome/welcome.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    angle: 0,
    user: {}
  },
  onLoad: function() {
    var that = this
  },
  // onhomePage: function(){
  //   wx.redirectTo({
  //     url: '/pages/homePage/homePage', 
  //   }); 
  // },
  onhomePage: function(){
    wx.reLaunch({
      url: '/pages/homePage/homePage',
    })
  },
  goLogin: function() {
    let that = this
    let user = wx.getStorageSync('user')
    if (!user) {
      wx.switchTab({
        url: '/pages/homePage/homnePage',
      })
    } else {
      that.setData({
        user: user
      })
      wx.switchTab({
        url: '/pages/home/home',
      })
    }
  },
  onReady: function() {
    var that = this;
    setTimeout(function() {
      that.setData({
        remind: ''
      });
    }, 1000);
    wx.onAccelerometerChange(function(res) {
      var angle = -(res.x * 30).toFixed(1);
      if (angle > 14) {
        angle = 14;
      } else if (angle < -14) {
        angle = -14;
      }
      if (that.data.angle !== angle) {
        that.setData({
          angle: angle
        });
      }
    });
  }
});

