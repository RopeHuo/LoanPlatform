<template>
  <div>
    <!-- 登录 -->
    <div v-if="is_login">
      <div style="height:46px">
        <tab>
          <tab-item @on-item-click="login_mode='password'" :selected="login_mode === 'password'">密码登录</tab-item>
          <tab-item @on-item-click="login_mode='vcode'" :selected="login_mode === 'vcode'">验证码登录</tab-item>
        </tab>
      </div>
      <group>
        <x-input type="number" :min="11" placeholder="手机号码" v-model="login_data.mobile"><i slot="label" class="icons icon icon-bdingshouji"></i></x-input>
        <x-input v-if="login_mode === 'password'" placeholder="登录密码" :show-clear="false" type="password" v-model="login_data.password">
          <i slot="label" class="icons icon icon-denglumima"></i>
          <a slot="right" class="button-link" @click="login_mode = 'vcode'">忘记密码</a>
        </x-input>
        <template v-if="login_mode === 'vcode'">
          <x-input :show-clear="false" type="number" placeholder="短信验证码" v-model="login_data.valicode">
            <i slot="label" class="icons icon icon-denglumima"></i>
            <a slot="right" class="button-link" @click="valicode">{{wait>0?wait+'秒':'获取验证码'}}</a>
          </x-input>
        </template>
      </group>
      <div style="padding:15px;">
        <x-button :show-loading="btn_loading" @click.native="login" :disabled="!login_data.mobile" type="primary">登录</x-button>
      </div>
      <div class="content-padded text-center">
        <a class="button is-text" @click="login_mode = 'vcode'" v-if="login_mode == 'password'">注册新账户</a>
        <a class="button is-text" @click="show_xieyi=true" v-else>首次登录自动注册并默许<label style="color:#04BE02;">平台协议</label></a>
      </div>
    </div>
    <!-- 完善信息 -->
    <div v-if="!is_login">
      <group>
        <x-input type="text" placeholder="昵称" v-model="user.nickname"><i slot="label" class="icons icon icon-shimingrenzheng"></i></x-input>
        <x-input type="password" :min="6" :max="20" placeholder="密码长度为6-16个字符" v-model="user.password"><i slot="label" class="icons icon icon-denglumima"></i></x-input>
        <!-- <x-input type="number" placeholder="邀请人ID/手机号" v-model="user.inviter"><i slot="label" class="icons icon icon-yaoqingyouli"></i></x-input> -->
      </group>
      <div style="padding:15px;">
        <x-button :show-loading="btn_loading" @click.native="register" :disabled="!user.mobile" type="primary">同意并注册</x-button>
      </div>
      <div class="content-padded text-center">
        <a class="button is-text" @click="show_xieyi=true">平台协议</a>
      </div>
    </div>
    <popup id="xieyi" v-model="show_xieyi" width="100%" height="100%" position="bottom" :show-mask="false">
      <!-- <view-box ref="viewBox"> -->
      <sticky scroll-box="xieyi" :check-sticky-support="false">
        <x-header :left-options="{preventGoBack:true,backText:'关闭'}" @on-click-back="show_xieyi=false"></x-header>
      </sticky>
      <iframe width="100%" height="100%" src="/static/xieyi.html" scrolling="no" style="border: none;" v-if="show_xieyi"></iframe>
      <!-- </view-box> -->
      <!-- <div style="position: fixed;bottom:0;width:100%;">
        <x-button :show-loading="btn_loading" @click.native="show_xieyi=false" type="warn"> 关闭 </x-button>
      </div> -->
    </popup>
  </div>
</template>
<script>
import { Tab, TabItem, Group, Cell, Sticky, Popup, XHeader, ViewBox, XButton, XInput, XDialog, TransferDomDirective as TransferDom } from 'vux'
import { mapGetters, mapActions } from 'vuex'
import { clearTimeout } from 'timers';

export default {
  components: {
    Tab,
    XHeader,
    TabItem,
    ViewBox,
    Sticky,
    Group,
    Popup,
    Cell,
    XButton,
    XInput,
    XDialog
  },
  data() {
    return {
      user: { nickname: '', inviter: '', reg_token: '', mobile: '', password: '' },
      is_login: true,
      wait: 0,
      timer: null,
      show_xieyi: false,
      login_mode: 'password',
      login_data: { mobile: '', password: '', valicode: '', inviter: '' },
      error_msg: '',
      success_msg: '',
      weixin_user: {},
      is_loading: false,
    }
  },
  computed: {
    ...mapGetters(['btn_loading', 'token']),
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    },
  },
  created() {
    this.$store.commit('updatePageTitle', '登录');
    if (this.isWeixin) {
      this.weixin_user = this.$db.get('weixin_user');
    }

  },
  watch: {
    error_msg(cv, ov) {
      if (cv) {
        this.$vux.toast.show({ text: this.error_msg, type: 'warn', time: 3000 });
      }
    },
    token(cv, ov) {
      if (cv) {
        let path = this.$route.query.redirect || '/';
        this.$router.replace(path);
      }
    }
  },
  methods: {
    register() {
      if (this.isWeixin && this.weixin_user) {
        this.user.weixin_open_id = this.weixin_user.openid;
      }
      this.$axios.post('/api/register', this.user).then((res) => {
        this.$store.commit('updateUser', res.data.data);
        this.$store.commit('updateToken', res.data.token);
        this.$db.set('token', res.data.token);
        this.$router.replace('/');
        toast(res.data);
      })
    },
    login() {
      if (this.is_loading) { return; }
      this.is_loading = true;
      this.error_msg = '';
      if (this.isWeixin && this.weixin_user) {
        this.login_data.weixin_open_id = this.weixin_user.openid;
      }
      if (this.login_mode == 'vcode') {
        this.login_data.password = '';
      } else {
        this.login_data.valicode = '';
      }
      this.$axios.post('/api/login', this.login_data).then((res) => {
        this.is_loading = false;
        this.$store.commit('updateToken', res.data.token);
        this.$db.set('token', res.data.token);
        this.$store.commit('updateUser', res.data.data);
        if (window.SDK) {
          window.SDK.setToken(res.data.token);
        }
        if (!res.data.reg_token) {
          this.$store.commit('updateUser', res.data.data);
          this.$router.replace('/');
        } else {
          if (this.isWeixin) {
            this.user.nickname = this.weixin_user.nickname || '';
            this.user.password = '';
            this.register();
          } else {
            this.is_login = false;
            this.success_msg = '';
          }
          this.user.mobile = this.login_data.mobile;
          this.user.reg_token = res.data.reg_token;
        }
      }).catch((e) => { this.is_loading = false; });
    },
    waitTimer() {
      if (this.wait <= 0) { return; }
      this.wait -= 1;
      // clearTimeout(this.timer);
      // this.timer = setTimeout(this.waitTimer, 1000);
      setTimeout(this.waitTimer, 1000);
    },
    valicode() {
      if (!this.login_data.mobile||this.is_loading||this.wait>0) { return; }
      this.is_loading = true;
      var post_data = { mobile: this.login_data.mobile };
      post_data.token = '';
      try {
        var token = post_data.mobile;
        post_data.timestamp = parseInt(new Date().getTime() / 1000) + '';
        var key = post_data.timestamp;

        for (var i = 0; i < key.length; i++) {
          if (token.length <= i) { break; }
          post_data.token += String.fromCharCode(48 + (token.charCodeAt(i) + key.charCodeAt(i)) % 74);
        }
      } catch (e) {
        alert(e);
      }
      this.$axios.post('/api/valicode', post_data).then((res) => {
        this.is_loading = false;
        this.$vux.toast.show({ text: res.data, type: 'success', time: 3000 });
        this.wait = 60;
        this.waitTimer();
      }).catch((e) => { this.is_loading = false; })
    }
  }
}

</script>
<style scoped>
@media (min-width: 991px) {
  .container {
    width: 25rem;
    margin: 0 auto;
    border: 1px solid #f1f1f1;
    margin-top: 3em;
  }
}

.msg {
  color: #999999;
  font-size: 0.9rem;
  padding: 2%;
}

.notification.is-danger,
.notification.is-success {
  padding: 2px 5px;
}

.text-center {
  text-align: center;
}

</style>
