// import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import axios from 'axios'
import db from './db'
import { ToastPlugin, ConfirmPlugin, LoadingPlugin, ColorPicker } from 'vux'
import crypto from 'crypto';


Vue.use(LoadingPlugin)
Vue.use(ConfirmPlugin)
Vue.use(ToastPlugin)
Vue.prototype.$axios = axios;
Vue.prototype.$db = db;
Vue.prototype.bus = new Vue;
// Vue.prototype.wx = wx
window.store = store;
let isWeixin = window.navigator.userAgent.indexOf('MicroMessenger') != -1;
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isWeixin) { // 判断该路由是否需要登录权限
    if ((store.state.token && store.state.token !== 'null') || (db.get('token') && db.get('token') !== 'null')) { // 通过vuex state获取当前的token是否存在
      next();
    } else {
      next({
        path: '/login',
        replace: true,
        query: { redirect: to.fullPath } // 将跳转的路由path作为参数，登录成功后跳转到该路由
      })
    }
  } else {
    next();
  }
});
// http request 拦截器
axios.interceptors.request.use(
  config => {
    config.timeout = 12000;
        var token = '';
        if (store.state.token) {
            token = store.state.token;
        } else {
            token = db.get('token');
        }
        if (token) { // 判断是否存在token，如果存在的话，则每个http header都加上token
            config.headers.Authorization = `token ${token}`;

            if (config.method == 'post') {
                config.headers['x-encode'] = 'des';
                var data = config.data;
                console.log('提交',data)
                if (typeof(data) == 'object') {
                    data = JSON.stringify(data);
                }
                token = token.substr(-8);
                let iv = new Buffer(0);
                token = new Buffer(token)
                let cipher = crypto.createCipheriv('des-ecb', token, iv)
                let encrypted = cipher.update(data, 'utf8', 'base64')
                encrypted += cipher.final('base64')
                data = {
                    'd': encrypted
                };
                config.data = data;  
            }
        }
        return config;
  },
  err => {
    return Promise.reject(err);
  });

// http response 拦截器
axios.interceptors.response.use(
  response => {
    if (response.status == 200 && response.headers['x-encode'] == 'des') {
      var token = '';
      if (store.state.token) {
          token = store.state.token;
      } else {
          token = db.get('token');
      }
      let body = response.data;
      if (token) {
          try {
              token = token.substr(-8);
              let iv = new Buffer(0);
              token = new Buffer(token)
              let decipher = crypto.createDecipheriv('des-ecb', token, iv);
              body = decipher.update(body.d, 'base64', 'utf8');
              body += decipher.final('utf8');
              if (body.indexOf('{') == 0 || body.indexOf('[') == 0) {
                  body = JSON.parse(body);
              }
          } catch (e) {

          }
      }
      console.log(body)
      response.data = body;
    }
    return response;
  },
  error => {
    if (error.response) {
      if (error.response.status == 401) {
        //store.commit(types.LOGOUT);
        Vue.prototype.bus.$vux.toast.show({ text: error.response.data, type: 'warn' });
        db.remove('token');

        router.replace({
          path: '/login',
          query: { redirect: router.currentRoute.fullPath }
        })
      } else if (error.response.status >= 500) {
        Vue.prototype.bus.$vux.toast.show({ text: '未知错误:' + error.response.data, type: 'warn' });
      } else {
        Vue.prototype.bus.$vux.toast.show({ text: error.response.data, type: 'warn' });
      }
    } else {
      Vue.prototype.bus.$vux.toast.show({ text: '连接超时，请检查网络', type: 'warn' });
    }
    store.commit('updateBtnLoading', false);
    return Promise.reject(error) // 返回接口返回的错误信息
  });
Vue.prototype.go = (path, replace) => {
  if (replace) {
    router.replace(path);
  } else {
    router.push(path);
  }
}
Vue.prototype.$isNull = function(obj) {
  if (!obj) { return true; }
  return Object.keys(obj).length == 0;
}
Vue.prototype.$tradeTypeName = (trade_type) => {
  let name = '未知';
  if (trade_type == 0) { //
    name = '收款';
  } else if (trade_type == 1) {
    name = '还款';
  } else if (trade_type == 2) {
    name = '消费';
  } else if (trade_type == 3) {
    name = '提现';
  } else if (trade_type == 4) {
    name = '充值';
  } else if (trade_type == 5) {
    name = '分润';
  } else if (trade_type == 6) {
    name = '服务费';
  } else if (trade_type == 7) {
    name = '垫还';
  }
  return name;
}
Vue.prototype.$isIdCard = (code) => {
  var city = ["11", "12", "13", "14", "15", "21", "22", "23", "31", "32", "33", "34", "35", "36", "37", "41", "42", "43", "44", "45", "46", "50", "51", "52", "53", "54", "61", "62", "63", "64", "65", "71", "81", "82", "91"];
  var tip = "";
  var pass = true;

  if (!/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
    tip = "身份证号格式错误";
    pass = false;
  } else if (city.indexOf(code.substr(0, 2)) == -1) {
    tip = "身份证号格式错误!";
    pass = false;
  } else {
    if (code.length == 18) {
      code = code.split('');
      var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
      var sum = 0;
      var ai = 0;
      var wi = 0;
      for (var i = 0; i < 17; i++) {
        ai = code[i];
        wi = factor[i];
        sum += ai * wi;
      }
      var last = parity[sum % 11];
      if (parity[sum % 11] != code[17]) {
        tip = "身份证号格式错误!!";
        pass = false;
      }
    }
  }
  return { valid: pass, msg: tip }
}
Vue.filter('money', function(val) {
  try {
    val = val.toString().replace(/\$|\,/g, '')
    if (isNaN(val)) {
      val = "0";
    }
    let sign = (val == (val = Math.abs(val)));
    val = Math.floor(val * 100 + 0.50000000001);
    let cents = val % 100;
    val = Math.floor(val / 100).toString();
    if (cents < 10) {
      cents = "0" + cents
    }
    for (var i = 0; i < Math.floor((val.length - (1 + i)) / 3); i++) {
      val = val.substring(0, val.length - (4 * i + 3)) + ',' + val.substring(val.length - (4 * i + 3));
    }

    return (((sign) ? '' : '-') + val + '.' + cents);
  } catch (e) {

    return 0.00;
  }
});
Vue.filter('date', function(val) {
  if (!val) { return ''; }
  var date = new Date(val);
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
});
Vue.filter('dateTime', function(val) {
  if (!val) { return ''; }
  var date = new Date(val);
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
});
Vue.filter('dateTimeList', function(val) {
  if (!val) { return ''; }
  var date = new Date(val);
  return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + date.getHours() + ':' + date.getMinutes();
});
Vue.filter('card', function(val) {
  return val.substr(0, 4) + ' ' + val.substr(4, 4) + ' ' + val.substr(8, 4) + ' ' + val.substr(12, 4);
});

 new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
console.log()
const FastClick = require('fastclick')
FastClick.attach(document.body)
