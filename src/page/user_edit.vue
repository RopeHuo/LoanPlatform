<template>
  <div>
    <div v-if="step==0">
      <div v-if="pass_type=='login'">
        <group title="设置登录密码" v-if="!user.safe_login">
          <x-input text-align="right" type="password" v-model="post_data.password" title="登录密码" placeholder="6位以上英文字母或数字的组合"></x-input>
          <x-input text-align="right" type="password" v-model="password_check" title="登录密码确认" placeholder="再次输入以免出错"></x-input>
        </group>
        <group title="修改登录密码" v-if="user.safe_login">
          <x-input text-align="right" type="password" v-model="post_data.password" title="登录密码" placeholder="6位以上英文字母或数字的组合"></x-input>
          <x-input type="number" v-model="post_data.valicode" :show-clear="false" placeholder="请输入短信验证码">
            <button slot="right" @click="sendSMS" class="weui-vcode-btn">{{sendName}}</button>
          </x-input>
        </group>
      </div>
      <div v-if="pass_type=='pay'">
        <group title="设置支付密码" v-if="!user.safe_pay">
          <x-input text-align="right" type="password" v-model="post_data.pay_password" title="支付密码" placeholder="6位数字"></x-input>
          <x-input text-align="right" type="password" v-model="pay_password_check" title="支付密码确认" placeholder="再次输入以免出错"></x-input>
        </group>
        <group title="修改支付密码" v-if="user.safe_pay">
          <x-input text-align="right" type="password" v-model="post_data.pay_password" title="支付密码" placeholder="6位数字"></x-input>
          <x-input type="number" v-model="post_data.valicode" :show-clear="false" placeholder="请输入短信验证码">
            <button slot="right" @click="sendSMS" class="weui-vcode-btn">{{sendName}}</button>
          </x-input>
        </group>
      </div>
      <div v-if="pass_type=='mobile'">
        <group title="设置绑定手机" v-if="!post_data.mobile">
          <x-input text-align="right" type="text"  v-model="post_data.mobile" title="手机号码" placeholder="手机号码"></x-input>
          <x-input type="number" v-model="post_data.valicode" :show-clear="false" placeholder="请输入短信验证码">
            <button slot="right" @click="sendSMS" class="weui-vcode-btn">{{sendName}}</button>
          </x-input>
        </group>
        <group title="修改绑定手机" v-if="post_data.mobile">
          <x-input text-align="right" type="text" v-model="post_data.mobile" title="手机号码" placeholder="手机号码"></x-input>
          <x-input type="number" v-model="post_data.valicode" :show-clear="false" placeholder="请输入短信验证码">
            <button slot="right" @click="sendSMS" class="weui-vcode-btn">{{sendName}}</button>
          </x-input>
        </group>
      </div>
      <box gap="10px 10px" v-if="!(post_data.realname&&pass_type=='real')">
        <x-button :show-loading="btn_loading" type="primary" @click.native="doPassword">确定</x-button>
      </box>
    </div>
    <msg v-if="step==1" :title="msg_data.title" :description="msg_data.description" :buttons="msg_data.buttons" icon="success"></msg>
  </div>
</template>
<script>
import { Cell, Group, Msg, Box, XButton, XInput } from 'vux'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'password',
  data() {
    return {
      id: '',
      step: 0,
      post_data: { deviceId: '', password: '', pay_password: '', valicode: '', mobile: '' },
      pass_type: 'login',
      timer: 0,
      password: '',
      password_check: '',
      pay_password: '',
      pay_password_check: '',
      is_loading: false,
      msg_data: {
        title: '',
        description: '',
        buttons: [{
          type: 'primary',
          text: '返回我的账户',
          link: '/me'
        }]
      }
    }
  },
  components: {
    Cell,
    Group,
    Msg,
    Box,
    XButton,
    XInput
  },
  computed: {
    ...mapGetters(['btn_loading', 'user']),
    sendName: function() {
      if (this.timer <= 0) {
        return '获取验证码';
      }
      return this.timer + '秒';
    }
  },
  updated() {

  },
  created() {
    this.pass_type = this.$route.params.pass_type;
    if (this.pass_type == 'login') {
      this.$store.commit('updatePageTitle', '登录密码管理');
    } else if (this.pass_type == 'pay') {
      this.$store.commit('updatePageTitle', '支付密码管理');
    } else if (this.pass_type == 'mobile') {
      this.$store.commit('updatePageTitle', '绑定手机管理');
    } else if (this.pass_type == 'real') {
      this.$store.commit('updatePageTitle', '实名认证管理');
    }
    if (!this.$isNull(this.user)) {
      this.post_data.mobile = this.user.mobile;
      this.post_data.id_card = this.user.id_card;
      this.post_data.realname = this.user.realname;
    }
  },
  methods: {
    sendSMS() {
      if (this.timer > 0) { return; }
      try {
        var token = this.post_data.mobile;
        this.post_data.timestamp = parseInt(new Date().getTime() / 1000) + '';
        var key = this.post_data.timestamp;

        for (var i = 0; i < key.length; i++) {
          if (token.length <= i) { break; }
          this.post_data.token += String.fromCharCode(48 + (token.charCodeAt(i) + key.charCodeAt(i)) % 74);
        }
      } catch (e) {
      }
      this.$axios.post('/api/valicode', this.post_data).then((res) => {
        this.initTimer();
        this.$vux.toast.show({ text: res.data, type: 'text', time: 3000 });
      })
    },
    initTimer() {
      this.timer = 60;
      var _timer = setInterval(() => { this.timer -= 1; if (this.timer <= 0) { clearInterval(_timer) } }, 1000);
    },
    doPassword() {
      var error_msg = '';
      if (this.post_data.password == '' && this.post_data.pay_password == ''&&this.pass_type != 'mobile') {
        error_msg = '密码不能为空';
      } else if (this.pass_type == 'login') {
        if (this.post_data.password.length < 6) {
          error_msg = '密码长度不能少于6位';
        } else if (!this.user.safe_login && this.post_data.password != this.password_check) {
          error_msg = '两次输入的密码不一致';
        }
      } else if (this.pass_type == 'pay') {
        if (this.post_data.pay_password.length != 6 || this.post_data.pay_password.replace(/\d+/i, '') != '') {
          error_msg = '支付密码须为6位数字';
        } else if (!this.user.safe_pay && this.post_data.pay_password != this.pay_password_check) {
          error_msg = '两次输入的密码不一致';
        }
      }else if(this.pass_type == 'mobile'){
        if(!this.post_data.mobile){
          error_msg = "手机号不能为空"
        }
      }
      if (error_msg) {
        this.$vux.toast.show({ text: error_msg, type: 'text', time: 3000 });
        return;
      }
      if (this.is_loading) { return; }
      this.is_loading = true;
      this.$store.commit('updateBtnLoading', true);
      let url = '';
      if(this.pass_type=='login'){
        url = '/api/user/password/' + this.pass_type;
      }else if(this.pass_type=='pay'){
        url = '/api/user/password/' + this.pass_type;
      }else if(this.pass_type=='mobile'){
        url = '/api/user/change_mobile';
      }
      this.$axios.post(url, this.post_data).then((res) => {
        this.$store.commit('updateBtnLoading', false);
        this.msg_data.title = '操作成功';
        if (this.pass_type == 'login') {
          this.user.safe_login = true;
        } else {
          this.user.safe_pay = true;
        }
        this.$store.commit('updateUser', this.user);
        this.step = 1;
      }).catch((e) => { this.is_loading = false; });
    }
  }
}

</script>
<style lang="less">


</style>
