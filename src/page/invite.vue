<template>
  <div class="content">
    <div :class="[isShow?'isShow':'']" @click="isShow=false">
      <img style="width: 80%;margin-left: 4em;margin-top: 2em;" src="../../static/fenxian.png" v-if="isShow">
    </div>
    
    <div class="title">
      <flexbox align="center">
          <flexbox-item><router-link to="/invite/user"><span style="font-size:3.9em;display: block;">{{page_count.total_count?page_count.total_count:'0'}}</span><label>累计邀请</label></router-link></flexbox-item>
          <flexbox-item><router-link to="/cash/money"><span style="font-size:3.9em;display: block;">{{user.total_prize?user.total_prize:'0'}}</span><label>累计奖励</label></router-link></flexbox-item>
      </flexbox>
    </div>

    <div class="invit-content"  @click="showMask">
      <i class="icon icon-add"></i>
    </div>
    <div style="margin:20px 0;"  @click="showMask">
      <img src="/static/img/fenxian_2.png" width="100%">
    </div>
    <box gap="10px 10px">
      <a @click="show = true" class="til">详细规则</a>
      <!-- <x-button :show-loading="btn_loading" type="primary" @click.native="showMask">我也要赚取收益</x-button> -->
    </box>
    <confirm v-model="showQrcode" :show-cancel-button="false" title="分享二维码">
      <qrcode value="qrcode" type="img"></qrcode>
    </confirm>
    <div v-transfer-dom>
      <confirm v-model="show" :show-cancel-button="false" title="奖励规则">
        <p style="text-align:center;">
          <div class="text">
            <p><span>1.成功邀请一位好友体验银掌通产品，您可获得现金奖励10元，同时好友将获得1000元免息金；</span></p>
            <p><span><br></span></p>
            <p><span>2.好友奖励逐步发放，好友完成注册并实名认证立即发放2元奖励，好友在平台交易金额达到3000元发放剩下的8元奖励（取现或还款交易累计超过3000元即可）；</span></p>
            <p><span><br></span></p>
            <p><span>3.奖励发放至钱包，可随时提现。</span></p>
          </div>
        </p>
      </confirm>
    </div>
  </div>
</template>
<script>
import { Grid, GridItem,Flexbox,FlexboxItem, Clocker, Cell, Group, XButton, Confirm, Qrcode, Box, TransferDomDirective as TransferDom } from 'vux'
import { mapGetters, mapActions } from 'vuex'
export default {
  directives: {
    TransferDom
  },
  components: {
    Flexbox,FlexboxItem,
    Clocker,
    Cell,
    Group,
    XButton,
    Confirm,
    Qrcode,
    Box
  },
  name: 'user',
  data() {
    return {
      isSelect: 1,
      invite_number: '0',
      isShow: false,
      showQrcode: false,
      show: false,
    }
  },
  created() {
    this.$store.commit('updatePageTitle', '分享');
    this.loadUser();
    this.loadInvites();
  },
  computed: {
    ...mapGetters(['user', 'btn_loading','invites']),
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    },
    page_count() {
      return this.$store.state.page_count['invites'] || {};
    },
    user_id() {
      if (this.user) {
        return this.user.id;
      } else {
        return '';
      }
    }
  },
  methods: {
    ...mapActions(['loadUser','loadInvites']),
    showLeftDetaile() {
      this.loadInvite();
      this.isSelect = 1;
    },
    showMask() {
      if (this.isWeixin) {
        this.isShow = true;
      } else {
        this.showQrcode = true;
      }

    },
    showRightDetaile() {
      this.isSelect = 2;
    },
  }
}

</script>
<style>
.title{background-color:#FF6974;padding:1.3em 0;}
.title span{font-size:3.9em;display:block;}
.title label{margin-top:-0.5em;}
.title a{color: #fff}
.title .vux-flexbox{text-align:center;}
.invit-content{
  margin-top: 20px;
  padding: 2.84em 0;
  text-align: center;
  color: #C0C0C0;
  background-color: #ffffff;
}
.invit-content .icon{
  font-size: 2em;
}
.isShow {
  background: #000;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 1000;
  opacity: 0.7;
  /*background: url('../../static/fenxian.png');*/
}


.til {
  text-align: center;
  display: block;
  margin-bottom: 1em;
  color: green;
}

.rool {
  background: #fff;
  padding-top: 3em;
  padding-bottom: 3em;
}

.rool h4 {
  text-align: center;
  margin-bottom: 2em;
}

.text {
  margin: auto 1em;
  font-size: 0.9em;
  line-height: 1.5em;
}

.me-header {
  padding: 1em 0;
  text-indent: 20px;
  background: #fff
}

.invite_info b {
  color: red
}

.invite_info span {
  margin-top: 0.2em
}


/*.btn{position:fixed;bottom:4em;text-align: center;width:100%;padding: 0 10%;ma}*/

.btn a {
  color: green
}

.btn div {
  background: #fff;
  width: 80%;
  margin: auto;
}

.content .weui-grids:before {
  border-top: none
}

.content .weui-grid:before {
  border-right: none;
}

</style>
