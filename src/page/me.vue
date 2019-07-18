<template>
  <div>
    <card class="me">
      <div slot="header" class="me-header">
        <template v-if="!isWeixin || !weixin_user">{{user.nickname?user.nickname:user.realname}}，您好！
          <router-link to="/login" v-if="!user.id" class="link">登录</router-link>
        </template>
        <template v-else>{{user.id?user.nickname?user.nickname:user.realname:weixin_user.nickname}}，您好！
          <router-link to="/login" v-if="!user.id" class="link">登录</router-link>
        </template>
      </div>
      <div slot="content" class="me-header">
        <h1>
          {{(user.total_money) | money}}
        </h1>
        <span><router-link to="/cash/money" class="link">提现</router-link></span>
        <small>账户总资产(元)</small>
      </div>
      <div slot="footer">
        <flexbox align="center" style="padding-bottom: 0.5em">
          <flexbox-item>
            <router-link to="/trade">
              <div>{{user.money | money}}</div><small>余额(元)</small></router-link>
          </flexbox-item>
          <flexbox-item>
            <router-link to="/card">
              <div>{{card_count}}</div><small>银行卡</small></router-link>
          </flexbox-item>
          <flexbox-item>
            <router-link to="/rank">
              <div>{{user.level}}</div><small>{{level(user.level)}}</small>
            </router-link>
          </flexbox-item>
        </flexbox>
      </div>
    </card>
    <group>
      <cell title="交易记录" value="" is-link link="/trade"><i slot="icon" class="icons icon icon-jiaoyijilu"></i></cell>
      <cell title="还款计划" value="" is-link link="/task"><i slot="icon" class="icons icon icon-huankuanjihua"></i></cell>
    </group>
    <group style="margin-bottom:3em"> 
      <cell title="实名认证" :value="user.id_card&&user.realname?'已认证':'未认证'" is-link @click.native="bindRealName"><i slot="icon" class="icons icon icon-shimingrenzheng"></i></cell>
      <cell title="优惠券" is-link link="/coupon"><i slot="icon" class="icons icon icon-youhuiquan"></i></cell>
      <cell title="邀请有礼" is-link link="/invite"><i slot="icon" class="icons icon icon-yaoqingyouli"></i></cell>
      <cell title="我的客服" is-link link="/kefu"><i slot="icon" class="icons icon icon-wodekefu"></i></cell>
      <cell title="设置" is-link link="/settings"><i slot="icon" class="icons icon icon-shezhi"></i></cell>
    </group>
  </div>
</template>
<script>
import { cookie, Cell, Group, Card, Flexbox, FlexboxItem } from 'vux'
import axios from 'axios'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'me',
  components: {
    Cell,
    Group,
    Card,
    Flexbox,
    FlexboxItem
  },
  data() {
    return {
      weixin_user: {},
      card_count: 0,
    }
  },
  computed: {
    ...mapGetters(['token', 'user', 'cards', 'btn_loading']),

    card_id() {
      let value = '';
      if (this.user && this.user.card_id && this.cards && this.cards[this.user.card_id]) {
        return '已设置'
      }
      return '未设置';
    },
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    },
  },
  created() {
    this.$store.commit('updatePageTitle', '个人中心');
    if (this.isWeixin) {
      this.weixin_user = this.$db.get('weixin_user');
    }
    if (this.token) {
      this.loadUser();
      this.loadCards();
    }
    this.card_count = Object.keys(this.cards).length;
  },
  methods: {
    ...mapActions(['loadUser', 'loadCards']),
    level(level){
      switch(level){
              case 0:
                  return '免费用户';
              case 1:
                  return 'VIP会员';
              case 2:
                  return '铜牌会员';
              case 3:
                  return '银牌会员';
              case 4:
                  return '金牌会员';
              case 5:
                  return '运营会员';
              default:

          }
    },
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
  },
  wacth: {
    cards(cur, old) {
      this.card_count = Object.keys(cur).length;
    }
  }
}

</script>
<style lang="less">
.me{
  color: #fff;
  background-color: #fff;
}
.me .link{color: #fff;}
.me .me-header {
  padding: 1em 0;
  text-indent: 20px;
  background-color: #3B80FF;
}
.me .vux-card-content .me-header{padding: 0 0 1em 0;}
.me-header h1,
.me-header small {
  display: block;
  text-indent: 30px;
}

.me-header h1 {
  font-weight: normal;
  font-size: 3.8em;
  line-height: 1.2em;
}

.me-header span {
  float: right;
  margin-right: 1em;
}

.weui-panel:before {
  border-top: none !important;
}

.me .weui-panel__ft {
  border-top: 1px solid #D9D9D9;
}

.me .vux-flexbox {
  text-align: center;
}
.me .vux-flexbox a{
  color:#000; 
}
.me .vux-flexbox-item div {
  line-height: 2em;
  font-size: 1.3em;
}

.me .vux-flexbox-item small {
  display: block;
  margin-top: -0.5em;
}

.headimg {
  display: flex;
  padding-left: 1em;
}

.headimg img {
  display: block;
  border-radius: 50%;
  width: 2em;
  height: 2em;
}

.headimg span {
  line-height: 2em;
}

</style>
