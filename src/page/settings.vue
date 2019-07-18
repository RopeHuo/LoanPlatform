<template>
  <div>
    <group>
      <!-- <cell title="绑定手机" :value="user.mobile?show_mobile:'未设置'" is-link link="/user/mobile"><i slot="icon" class="icons icon icon-bdingshouji"></i></cell> -->
      <cell title="登录密码" :value="user.safe_login?'已设置':'未设置'" is-link link="/user/login"><i slot="icon" class="icons icon icon-denglumima"></i></cell>
      <cell title="支付密码" :value="user.safe_pay?'已设置':'未设置'" is-link link="/user/pay"><i slot="icon" class="icons icon icon-zhifumima"></i></cell>
      <cell title="结算卡" :value="card_id" is-link link="/card?card_type=1"><i slot="icon" class="icons icon icon-jiesuanka"></i></cell>
      <!-- <cell title="微信帐号" :value="user.weixin_open_id?'已绑定':'未绑定'" is-link><i slot="icon" class="icons icon icon-weixin"></i></cell> -->
      <cell title="清除缓存" :value="clear_time?'上次：'+clear_time:'未清理'" @click.native="clear" is-link><i slot="icon" class="icons icon icon-qingchuhuancun"></i></cell>
    </group>
    <box gap="10px 10px">
      <x-button :show-loading="btn_loading" type="warn" @click.native="logout">安全退出</x-button>
    </box>
  </div>
</template>
<script>
import { cookie, Cell, Group, Box, XButton, Confirm } from 'vux'
import axios from 'axios'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'me',
  components: {
    Cell,
    Group,
    Box,
    XButton,
    Confirm
  },
  data() {
    return {
      card_count: 0,
      clear_time: ''
    }
  },
  computed: {
    ...mapGetters(['cards', 'user', 'btn_loading']),
    show_mobile() {
      return this.user.mobile.substr(0, 3) + '****' + this.user.mobile.substr(this.user.mobile.length - 4)
    },
    card_id() {
      let value = '';
      if (this.user && this.user.card_id && this.cards && this.cards[this.user.card_id]) {
        return '已设置'
      }
      return '未设置';
    },
    // card_count(){
    //   if(this.cards){
    //     return Object.getOwnPropertyNames(this.cards).length;  
    //   }else{
    //     return 0;
    //   }
    // }
  },
  created() {
    this.$store.commit('updatePageTitle', '设置');
    if (!this.user) {
      this.$router.replace('/login');
      return;
    }
    if (!this.$isNull(this.cards)) {
      for (var card_id in this.cards) {
        var _card = this.cards[card_id];
        if (_card.status >= 0) {
          this.card_count += 1;
        }
      }
    }
    this.clear_time = this.$db.get('clear_time') || '';
  },
  methods: {
    ...mapActions(['loadUser']),
    bindRealName(){
      var that = this;
      if(this.user.id_card&&this.user.realname){
        return ;
      }
      that.$vux.confirm.show({
        title: '实名认证',
        content: '前往添加卡片,自动实名认证',
        onConfirm() {
          that.$router.replace('/card/add');
        }
      })
    },
    logout() {
      var that = this;
      that.$vux.confirm.show({
        title: '退出确认',
        content: '确定要退出吗？',
        onConfirm() {
          that.$store.commit('removeToken');
          that.$store.commit('removeUser');
          that.$store.commit('removeTasks');
          that.$store.commit('removeCards');
          that.$store.commit('removeTrades');
          that.$store.commit('removeCoupons');
          // that.$store.
          that.$router.replace('/');
          // that.$store.commit('updateUser',{});
        }
      })
      // 
    },
    clear() {
      var that = this;
      that.$vux.confirm.show({
        title: '清除缓存',
        content: '确定清除吗？',
        onConfirm() {
          that.$store.commit('clearStore');
          that.$vux.toast.show({ text: '清除完成' });
          that.clear_time = that.$db.get('clear_time');
        }
      })
    }

  }
}

</script>
<style lang="less">


</style>
